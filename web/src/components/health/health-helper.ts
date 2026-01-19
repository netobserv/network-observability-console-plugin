import { PrometheusAlert, PrometheusLabels, Rule } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { SilenceMatcher } from '../../api/alert';
import { HealthRuleMetadata } from '../../model/config';

export type Severity = 'critical' | 'warning' | 'info';

export type RecordingRuleItem = {
  name: string;
  value: number;
  severity: Severity;
  template: string;
  threshold?: string;
  upperBound?: string;
  labels: PrometheusLabels;
};

export type RecordingRulesByResource = {
  name: string;
  critical: RecordingRuleItem[];
  warning: RecordingRuleItem[];
  other: RecordingRuleItem[];
  score: number;
};

export type RecordingRuleMetricValue = {
  labels: PrometheusLabels;
  value: number;
};

export type RecordingRuleMetric = {
  template?: string;
  name: string;
  values: RecordingRuleMetricValue[];
};

export type HealthStats = {
  global: ByResource;
  byNamespace: ByResource[];
  byNode: ByResource[];
  recordingRules: {
    global: RecordingRulesByResource;
    byNamespace: RecordingRulesByResource[];
    byNode: RecordingRulesByResource[];
  };
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
  trafficLink?: TrafficLink;
};

type TrafficLink = {
  extraFilter: string;
  backAndForth: boolean;
  filterDestination: boolean;
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
    trafficLink: {
      extraFilter: '',
      backAndForth: true,
      filterDestination: false
    },
    links: []
  };
  if ('netobserv_io_network_health' in annotations) {
    const md = (JSON.parse(annotations['netobserv_io_network_health']) as HealthMetadata) || undefined;
    if (md) {
      // Setup defaults and derived
      md.unit = md.unit || defaultMetadata.unit;
      md.upperBound = md.upperBound || defaultMetadata.upperBound;
      md.trafficLink = md.trafficLink || defaultMetadata.trafficLink;
      md.links = md.links || defaultMetadata.links;
      md.thresholdF = md.threshold ? parseFloat(md.threshold) || 0 : 0;
      md.upperBoundF = parseFloat(md.upperBound) || defaultMetadata.upperBoundF;
      return md;
    }
  }
  return defaultMetadata;
};

const processRecordingRules = (
  recordingRulesMetrics: RecordingRuleMetric[],
  healthRulesMetadata: HealthRuleMetadata[]
): {
  global: RecordingRulesByResource;
  byNamespace: RecordingRulesByResource[];
  byNode: RecordingRulesByResource[];
} => {
  const recordingRuleItems: RecordingRuleItem[] = [];

  // Process each recording rule metric
  recordingRulesMetrics.forEach(metric => {
    const template = metric.template;
    if (!template) {
      return; // Skip if no template
    }

    // Find the metadata for this template
    const metadata = healthRulesMetadata.find(m => m.template === template);
    if (!metadata) {
      return;
    }

    // Process each value (each value represents a different resource/label combination)
    metric.values.forEach((valueData: RecordingRuleMetricValue) => {
      // Find the variant that matches the groupBy in the labels
      let variant = metadata.variants[0]; // Default to first variant
      for (const v of metadata.variants) {
        // Check if the groupBy label exists in the metric labels
        if (v.groupBy && valueData.labels[v.groupBy.toLowerCase()]) {
          variant = v;
          break;
        }
      }

      const value = valueData.value;

      // Determine severity based on thresholds
      let severity: Severity = 'info';
      if (variant.thresholds.critical && value >= parseFloat(variant.thresholds.critical)) {
        severity = 'critical';
      } else if (variant.thresholds.warning && value >= parseFloat(variant.thresholds.warning)) {
        severity = 'warning';
      }

      // Only include if value exceeds the minimum threshold (info)
      const minThreshold = variant.thresholds.info ? parseFloat(variant.thresholds.info) : 0;
      if (value >= minThreshold) {
        recordingRuleItems.push({
          name: metric.name,
          value: value,
          severity: severity,
          template: template,
          threshold: variant.thresholds[severity],
          upperBound: variant.upperBound,
          labels: valueData.labels
        });
      }
    });
  });

  // Group by namespace and node
  const namespaceGroups: { [key: string]: RecordingRuleItem[] } = {};
  const nodeGroups: { [key: string]: RecordingRuleItem[] } = {};
  const globalItems: RecordingRuleItem[] = [];

  recordingRuleItems.forEach(item => {
    // Check for namespace labels
    const namespace =
      item.labels.namespace || item.labels.Namespace || item.labels.SrcK8S_Namespace || item.labels.DstK8S_Namespace;
    // Check for node labels
    const node = item.labels.node || item.labels.Node || item.labels.SrcK8S_HostName || item.labels.DstK8S_HostNode;

    if (namespace) {
      if (!namespaceGroups[namespace]) {
        namespaceGroups[namespace] = [];
      }
      namespaceGroups[namespace].push(item);
    } else if (node) {
      if (!nodeGroups[node]) {
        nodeGroups[node] = [];
      }
      nodeGroups[node].push(item);
    } else {
      globalItems.push(item);
    }
  });

  // Build the result structures
  const buildResourceGroup = (name: string, items: RecordingRuleItem[]): RecordingRulesByResource => {
    return {
      name: name,
      critical: items.filter(i => i.severity === 'critical'),
      warning: items.filter(i => i.severity === 'warning'),
      other: items.filter(i => i.severity === 'info'),
      score: 0 // Will be computed below
    };
  };

  const global = buildResourceGroup('', globalItems);
  const byNamespace = Object.keys(namespaceGroups).map(ns => buildResourceGroup(ns, namespaceGroups[ns]));
  const byNode = Object.keys(nodeGroups).map(n => buildResourceGroup(n, nodeGroups[n]));

  // Compute scores for all resource groups
  [global, ...byNamespace, ...byNode].forEach(r => {
    r.score = computeRecordingRulesScore(r);
  });

  return {
    global,
    byNamespace,
    byNode
  };
};

export const buildStats = (
  rules: Rule[],
  healthRulesMetadata: HealthRuleMetadata[],
  recordingRulesMetrics: RecordingRuleMetric[] = []
): HealthStats => {
  const ruleWithMD: RuleWithMetadata[] = rules.map(r => {
    const md = getHealthMetadata(r.annotations);
    return { ...r, metadata: md };
  });
  const alerts: AlertWithRuleName[] = ruleWithMD.flatMap(r => {
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
    if (a.metadata.namespaceLabels) {
      a.metadata.namespaceLabels.forEach(l => {
        if (!namespaceLabels.includes(l)) {
          namespaceLabels.push(l);
        }
      });
    }
    if (a.metadata.nodeLabels) {
      a.metadata.nodeLabels.forEach(l => {
        if (!nodeLabels.includes(l)) {
          nodeLabels.push(l);
        }
      });
    }
  });
  const global = filterGlobals(alerts, [...namespaceLabels, ...nodeLabels]);
  const byNamespace = groupBy(alerts, namespaceLabels);
  const byNode = groupBy(alerts, nodeLabels);
  // Inject inactive rules
  const globalRules = ruleWithMD.filter(r => _.isEmpty(r.metadata.namespaceLabels) && _.isEmpty(r.metadata.nodeLabels));
  const namespaceRules = ruleWithMD.filter(r => !_.isEmpty(r.metadata.namespaceLabels));
  const nodeRules = ruleWithMD.filter(r => !_.isEmpty(r.metadata.nodeLabels));
  injectInactive(globalRules, [global]);
  injectInactive(namespaceRules, byNamespace);
  injectInactive(nodeRules, byNode);
  [global, ...byNamespace, ...byNode].forEach(r => {
    r.score = computeScore(r);
  });

  // Process recording rules
  const recordingRulesProcessed = processRecordingRules(recordingRulesMetrics, healthRulesMetadata);

  return { global, byNamespace, byNode, recordingRules: recordingRulesProcessed };
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
  return Object.entries(alert.labels).filter(
    e => e[0] !== 'app' && e[0] !== 'netobserv' && e[0] !== 'severity' && e[0] !== 'alertname' && e[1] !== target
  );
};

export const getAlertLink = (a: AlertWithRuleName): string => {
  const labels: string[] = [];
  Object.keys(a.labels).forEach(k => {
    labels.push(k + '=' + a.labels[k]);
  });
  return `/monitoring/alerts/${a.ruleID}?${labels.join('&')}`;
};

export const getRecordingRuleMetricLink = (rule: RecordingRuleItem, resourceName?: string): string => {
  let query = rule.name;

  // Filter by namespace or node if available
  if (resourceName) {
    const namespaceLabel = Object.keys(rule.labels).find(
      k => k.toLowerCase().includes('namespace') || k === 'Namespace'
    );
    const nodeLabel = Object.keys(rule.labels).find(
      k => k.toLowerCase().includes('node') || k.toLowerCase().includes('hostname') || k === 'Node'
    );

    if (namespaceLabel) {
      query += `{${namespaceLabel}="${resourceName}"}`;
    } else if (nodeLabel) {
      query += `{${nodeLabel}="${resourceName}"}`;
    }
  }

  return `/monitoring/query-browser?query0=${encodeURIComponent(query)}`;
};

export const getTrafficLink = (kind: string, resourceName: string, a: AlertWithRuleName): string => {
  const filters: string[] = [];
  let params = '';
  const side = a.metadata.trafficLink?.filterDestination ? 'dst' : 'src';
  const bnf = a.metadata.trafficLink?.backAndForth !== false;
  switch (kind) {
    case 'Namespace':
      filters.push(`${side}_namespace="${resourceName}"`);
      params += `&bnf=${bnf}`;
      break;
    case 'Node':
      filters.push(`${side}_owner_name="${resourceName}"`);
      filters.push(`${side}_kind="Node"`);
      params += `&bnf=${bnf}`;
      break;
  }
  if (a.metadata.trafficLink?.extraFilter) {
    filters.push(a.metadata.trafficLink.extraFilter);
  }
  return `/netflow-traffic?filters=${encodeURIComponent(filters.join(';'))}${params}`;
};

const criticalWeight = 1;
const warningWeight = 0.5;
const minorWeight = 0.25;
const pendingWeight = 0.3;
const silencedWeight = 0.1;

const getSeverityWeight = (a: AlertWithRuleName) => {
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

// Score [0,10]; higher is better
export const computeRecordingRulesScore = (r: RecordingRulesByResource): number => {
  const allRules = [...r.critical, ...r.warning, ...r.other];

  if (allRules.length === 0) {
    return 10; // Perfect score if no rules
  }

  const allScores: ScoreDetail[] = allRules.map(rule => {
    // Determine weight based on severity
    let weight = minorWeight;
    if (rule.severity === 'critical') {
      weight = criticalWeight;
    } else if (rule.severity === 'warning') {
      weight = warningWeight;
    }

    // Calculate raw score based on value vs threshold
    let rawScore = 10; // Default to perfect if no threshold
    if (rule.threshold) {
      const thresholdValue = parseFloat(rule.threshold);
      if (!isNaN(thresholdValue) && thresholdValue > 0) {
        // Use upperBound from variant metadata if available, otherwise default to 100
        const upperBoundValue = rule.upperBound ? parseFloat(rule.upperBound) : 100;
        // Create a compatible object to use the same computeExcessRatio function as alerts
        const mockAlert = {
          value: rule.value,
          metadata: {
            thresholdF: thresholdValue,
            upperBoundF: upperBoundValue
          }
        } as AlertWithRuleName;

        const excessRatio = computeExcessRatio(mockAlert);
        rawScore = 10 * (1 - excessRatio);
      }
    }

    return { rawScore, weight };
  });

  const sum = allScores.map(s => s.rawScore * s.weight).reduce((a, b) => a + b, 0);
  const sumWeights = allScores.map(s => s.weight).reduce((a, b) => a + b, 0);

  if (sumWeights === 0) {
    return 10;
  }

  return sum / sumWeights;
};

// Score [0,1]; lower is better
export const computeExcessRatio = (a: AlertWithRuleName): number => {
  // Assuming the alert value is a [0-n] percentage. Needs update if more use cases come up.
  const threshold = a.metadata.thresholdF / 2;
  const upper = a.metadata.upperBoundF;
  const vclamped = Math.min(Math.max(a.value as number, threshold), upper);
  const range = upper - threshold;
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

// Mapping of severity levels to PatternFly Label colors
// critical -> red (danger)
// warning -> orange (warning)
// info -> blue (info)
const SEVERITY_LABEL_COLORS = {
  critical: 'red',
  warning: 'orange',
  info: 'blue'
} as const;

export const getSeverityColor = (
  severity: string | undefined
): 'red' | 'orange' | 'blue' | 'grey' | 'purple' | 'cyan' | 'green' | 'gold' => {
  if (severity && severity in SEVERITY_LABEL_COLORS) {
    return SEVERITY_LABEL_COLORS[severity as keyof typeof SEVERITY_LABEL_COLORS];
  }
  return 'blue'; // default for info/undefined
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
