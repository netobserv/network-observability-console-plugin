import { PrometheusAlert, PrometheusLabels, Rule } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { SilenceMatcher } from '../../api/alert';

export type RecordingRulesByResource = {
  name: string;
  rules: Rule[];
};

export type RecordingRulesStats = {
  global: Rule[];
  byNamespace: RecordingRulesByResource[];
  byNode: RecordingRulesByResource[];
};

export type HealthStats = {
  global: ByResource;
  byNamespace: ByResource[];
  byNode: ByResource[];
  recordingRules: RecordingRulesStats;
};

export type ByResource = {
  name: string;
  critical: SeverityStats;
  warning: SeverityStats;
  other: SeverityStats;
  score: number;
};

type SeverityStats = {
  firing: AlertWithRuleName[];
  pending: AlertWithRuleName[];
  silenced: AlertWithRuleName[];
  inactive: string[];
};

export type AlertWithRuleName = PrometheusAlert & {
  ruleName: string;
  ruleID: string;
  metadata: HealthMetadata;
};

type RuleWithMetadata = Rule & {
  metadata: HealthMetadata;
};

type HealthMetadata = {
  threshold?: string;
  thresholdF: number;
  upperBound: string;
  upperBoundF: number;
  unit: string;
  nodeLabels?: string[];
  namespaceLabels?: string[];
  links: { name: string; url: string }[];
  trafficLinkFilter?: string;
};

type ScoreDetail = {
  rawScore: number;
  weight: number;
};

const getHealthMetadata = (annotations: PrometheusLabels): HealthMetadata => {
  const defaultMetadata: HealthMetadata = {
    thresholdF: 0,
    upperBound: '100',
    upperBoundF: 100,
    unit: '%',
    links: []
  };
  if (!annotations) {
    return defaultMetadata;
  }
  if ('netobserv_io_network_health' in annotations) {
    try {
      const md = (JSON.parse(annotations['netobserv_io_network_health']) as HealthMetadata) || undefined;
      if (md) {
        // Setup defaults and derived
        md.unit = md.unit || defaultMetadata.unit;
        md.upperBound = md.upperBound || defaultMetadata.upperBound;
        md.links = md.links || defaultMetadata.links;
        md.thresholdF = md.threshold ? parseFloat(md.threshold) || 0 : 0;
        md.upperBoundF = parseFloat(md.upperBound) || defaultMetadata.upperBoundF;
        return md;
      }
    } catch (e) {
      console.error('Error parsing health metadata:', e);
    }
  }
  return defaultMetadata;
};

const groupRecordingRules = (rules: Rule[]): RecordingRulesStats => {
  if (!rules || rules.length === 0) {
    return { global: [], byNamespace: [], byNode: [] };
  }

  const globalRules: Rule[] = [];
  const namespaceRules: Rule[] = [];
  const nodeRules: Rule[] = [];

  // Parse recording rule names to infer grouping
  // Format: netobserv:health:<template>:<groupby>:<side>:rate5m
  // Examples:
  //   - netobserv:health:packet_drops_by_kernel:namespace:source:rate5m
  //   - netobserv:health:packet_drops_by_kernel:node:source:rate5m
  //   - netobserv:health:packet_drops_by_kernel:rate5m (global)
  rules.forEach(rule => {
    const name = rule.name || '';
    const parts = name.split(':');

    // Recording rules cannot have annotations in Prometheus, so we parse the name
    if (parts.length >= 3) {
      // Check if there's a groupBy field (index 3)
      const groupBy = parts[3];

      if (groupBy === 'namespace') {
        namespaceRules.push(rule);
      } else if (groupBy === 'node') {
        nodeRules.push(rule);
      } else {
        globalRules.push(rule);
      }
    } else {
      // Fallback: if name doesn't match expected format, treat as global
      globalRules.push(rule);
    }
  });

  // Group namespace and node rules
  const byNamespace: RecordingRulesByResource[] = namespaceRules.length > 0
    ? [{ name: 'By Namespace', rules: namespaceRules }]
    : [];

  const byNode: RecordingRulesByResource[] = nodeRules.length > 0
    ? [{ name: 'By Node', rules: nodeRules }]
    : [];

  return { global: globalRules, byNamespace, byNode };
};

export const buildStats = (rules: Rule[]): HealthStats => {
  if (!rules || !Array.isArray(rules)) {
    return {
      global: { name: '', critical: { firing: [], pending: [], silenced: [], inactive: [] }, warning: { firing: [], pending: [], silenced: [], inactive: [] }, other: { firing: [], pending: [], silenced: [], inactive: [] }, score: 10 },
      byNamespace: [],
      byNode: [],
      recordingRules: { global: [], byNamespace: [], byNode: [] }
    };
  }

  // Separate recording rules (those without alerts) from alert rules
  const recordingRules = rules.filter(r => !r.alerts || r.alerts.length === 0);
  const alertRules = rules.filter(r => r.alerts && r.alerts.length > 0);

  const ruleWithMD: RuleWithMetadata[] = alertRules.map(r => {
    const md = getHealthMetadata(r.annotations);
    return { ...r, metadata: md };
  });
  const alerts: AlertWithRuleName[] = ruleWithMD.flatMap(r => {
    if (!r.alerts) {
      return [];
    }
    return r.alerts.map(a => {
      if (typeof a.value === 'string') {
        a.value = parseFloat(a.value);
      }
      return { ...a, ruleName: r.name, ruleID: r.id, metadata: r.metadata };
    });
  });

  const namespaceLabels: string[] = [];
  const nodeLabels: string[] = [];
  alerts.forEach(a => {
    if (a.metadata && a.metadata.namespaceLabels && Array.isArray(a.metadata.namespaceLabels)) {
      a.metadata.namespaceLabels.forEach(l => {
        if (l && !namespaceLabels.includes(l)) {
          namespaceLabels.push(l);
        }
      });
    }
    if (a.metadata && a.metadata.nodeLabels && Array.isArray(a.metadata.nodeLabels)) {
      a.metadata.nodeLabels.forEach(l => {
        if (l && !nodeLabels.includes(l)) {
          nodeLabels.push(l);
        }
      });
    }
  });
  const global = filterGlobals(alerts, [...namespaceLabels, ...nodeLabels]);
  const byNamespace = groupBy(alerts, namespaceLabels);
  const byNode = groupBy(alerts, nodeLabels);
  // Inject inactive rules
  const globalRules = ruleWithMD.filter(
    r => r.metadata && _.isEmpty(r.metadata.namespaceLabels) && _.isEmpty(r.metadata.nodeLabels)
  );
  const namespaceRules = ruleWithMD.filter(r => r.metadata && !_.isEmpty(r.metadata.namespaceLabels));
  const nodeRules = ruleWithMD.filter(r => r.metadata && !_.isEmpty(r.metadata.nodeLabels));
  injectInactive(globalRules, [global]);
  injectInactive(namespaceRules, byNamespace);
  injectInactive(nodeRules, byNode);
  [global, ...byNamespace, ...byNode].forEach(r => {
    r.score = computeScore(r);
  });

  // Group recording rules
  const groupedRecordingRules = groupRecordingRules(recordingRules);

  return { global, byNamespace, byNode, recordingRules: groupedRecordingRules };
};

const filterGlobals = (alerts: AlertWithRuleName[], nonGlobalLabels: string[]): ByResource => {
  // Keep only rules where none of the non-global labels are set
  const filtered = alerts.filter(a => !nonGlobalLabels.some(l => l in a.labels));
  return statsFromGrouped('', filtered);
};

const groupBy = (alerts: AlertWithRuleName[], labels: string[]): ByResource[] => {
  if (labels.length === 0) {
    return [];
  }
  const groups: { [key: string]: AlertWithRuleName[] } = {};
  labels.forEach(l => {
    const byLabel = _.groupBy(
      alerts.filter(a => l in a.labels),
      a => a.labels[l]
    );
    _.keys(byLabel).forEach(k => {
      if (k in groups) {
        groups[k].push(...byLabel[k]);
      } else {
        groups[k] = byLabel[k];
      }
    });
  });
  const stats: ByResource[] = [];
  _.keys(groups).forEach(k => {
    if (k) {
      stats.push(statsFromGrouped(k, groups[k]));
    }
  });
  return stats;
};

const statsFromGrouped = (name: string, grouped: AlertWithRuleName[]): ByResource => {
  const br: ByResource = {
    name: name,
    critical: { firing: [], pending: [], silenced: [], inactive: [] },
    warning: { firing: [], pending: [], silenced: [], inactive: [] },
    other: { firing: [], pending: [], silenced: [], inactive: [] },
    score: 0
  };
  _.uniqWith(grouped, (a, b) => {
    return a.ruleName === b.ruleName && _.isEqual(a.labels, b.labels);
  }).forEach(alert => {
    if (!alert.labels) {
      return;
    }
    let stats: SeverityStats;
    switch (alert.labels.severity) {
      case 'critical':
        stats = br.critical;
        break;
      case 'warning':
        stats = br.warning;
        break;
      default:
        stats = br.other;
        break;
    }
    switch (alert.state) {
      case 'firing':
        stats.firing.push(alert);
        break;
      case 'pending':
        stats.pending.push(alert);
        break;
      case 'silenced':
        stats.silenced.push(alert);
        break;
    }
  });
  return br;
};

const injectInactive = (rules: RuleWithMetadata[], groups: ByResource[]) => {
  groups.forEach(g => {
    const allAlerts = getAllAlerts(g).map(a => a.ruleName);
    rules.forEach(r => {
      if (allAlerts.includes(r.name)) {
        // There's an alert for this rule, skip
        return;
      }
      if (!r.labels) {
        return;
      }
      switch (r.labels.severity) {
        case 'critical':
          g.critical.inactive.push(r.name);
          break;
        case 'warning':
          g.warning.inactive.push(r.name);
          break;
        default:
          g.other.inactive.push(r.name);
          break;
      }
    });
  });
};

export const getAllAlerts = (g: ByResource): AlertWithRuleName[] => {
  return [
    ...g.critical.firing,
    ...g.warning.firing,
    ...g.other.firing,
    ...g.critical.pending,
    ...g.warning.pending,
    ...g.other.pending,
    ...g.critical.silenced,
    ...g.warning.silenced,
    ...g.other.silenced
  ];
};

export const getAlertFilteredLabels = (alert: AlertWithRuleName, target: string): [string, string][] => {
  if (!alert.labels) {
    return [];
  }
  return Object.entries(alert.labels).filter(
    e => e[0] !== 'app' && e[0] !== 'netobserv' && e[0] !== 'severity' && e[0] !== 'alertname' && e[1] !== target
  );
};

export const getAlertLink = (a: AlertWithRuleName): string => {
  const labels: string[] = [];
  if (a.labels) {
    Object.keys(a.labels).forEach(k => {
      labels.push(k + '=' + a.labels[k]);
    });
  }
  return `/monitoring/alerts/${a.ruleID}?${labels.join('&')}`;
};

export const getTrafficLink = (kind: string, resourceName: string, a: AlertWithRuleName): string => {
  const filters: string[] = [];
  let params = '';
  switch (kind) {
    case 'Namespace':
      filters.push(`src_namespace="${resourceName}"`);
      params += '&bnf=true';
      break;
    case 'Node':
      filters.push(`src_node="${resourceName}"`);
      params += '&bnf=true';
      break;
  }
  if (a.metadata && a.metadata.trafficLinkFilter) {
    filters.push(a.metadata.trafficLinkFilter);
  }
  return `/netflow-traffic?filters=${encodeURIComponent(filters.join(';'))}${params}`;
};

const criticalWeight = 1;
const warningWeight = 0.5;
const minorWeight = 0.25;
const pendingWeight = 0.3;
const silencedWeight = 0.1;

const getSeverityWeight = (a: AlertWithRuleName) => {
  if (!a.labels || !a.labels.severity) {
    return minorWeight;
  }
  switch (a.labels.severity) {
    case 'critical':
      return criticalWeight;
    case 'warning':
      return warningWeight;
    default:
      return minorWeight;
  }
};

const getStateWeight = (a: AlertWithRuleName) => {
  switch (a.state) {
    case 'pending':
      return pendingWeight;
    case 'silenced':
      return silencedWeight;
  }
  return 1;
};

// Score [0,10]; higher is better
export const computeScore = (r: ByResource): number => {
  const allAlerts = getAllAlerts(r);
  const allScores = allAlerts
    .map(computeAlertScore)
    .concat(r.critical.inactive.map(name => ({ alertName: name, rawScore: 10, weight: criticalWeight })))
    .concat(r.warning.inactive.map(name => ({ alertName: name, rawScore: 10, weight: warningWeight })))
    .concat(r.other.inactive.map(name => ({ alertName: name, rawScore: 10, weight: minorWeight })));
  const sum = allScores.map(s => s.rawScore * s.weight).reduce((a, b) => a + b, 0);
  const sumWeights = allScores.map(s => s.weight).reduce((a, b) => a + b, 0);
  if (sumWeights === 0) {
    return 10;
  }
  return sum / sumWeights;
};

// Score [0,1]; lower is better
const computeExcessRatio = (a: AlertWithRuleName): number => {
  if (!a.metadata) {
    return 0;
  }
  // Assuming the alert value is a [0-n] percentage. Needs update if more use cases come up.
  const threshold = a.metadata.thresholdF / 2;
  const upper = a.metadata.upperBoundF;
  const vclamped = Math.min(Math.max(a.value as number, threshold), upper);
  const range = upper - threshold;
  if (range === 0) {
    return 0;
  }
  return (vclamped - threshold) / range;
};

export const computeExcessRatioStatusWeighted = (a: AlertWithRuleName): number => {
  return computeExcessRatio(a) * getStateWeight(a);
};

// Score [0,10]; higher is better
export const computeAlertScore = (a: AlertWithRuleName): ScoreDetail => {
  return {
    rawScore: 10 * (1 - computeExcessRatio(a)),
    weight: getSeverityWeight(a) * getStateWeight(a)
  };
};

export const isSilenced = (silence: SilenceMatcher[], labels: PrometheusLabels): boolean => {
  for (const matcher of silence) {
    if (!(matcher.name in labels)) {
      return false;
    }
    if (matcher.value !== labels[matcher.name]) {
      return false;
    }
  }
  return true;
};
