import { PrometheusAlert, PrometheusLabels, Rule } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';
import { SilenceMatcher } from '../../api/alert';

export type HealthStats = {
  global: ByResource;
  byNamespace: ByResource[];
  byNode: ByResource[];
};

export type ByResource = {
  name: string;
  critical: SeverityStats;
  warning: SeverityStats;
  other: SeverityStats;
  score: Score;
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
  metadata?: HealthMetadata;
};

type RuleWithMetadata = Rule & {
  metadata?: HealthMetadata;
};

type HealthMetadata = {
  threshold: string;
  thresholdF: number;
  unit: string;
  nodeLabels?: string[];
  namespaceLabels?: string[];
};

type Score = {
  total: number;
  details: ScoreDetail[];
};

type ScoreDetail = {
  alertName: string;
  rawScore: number;
  weight: number;
};

export const getHealthMetadata = (annotations: PrometheusLabels): HealthMetadata | undefined => {
  if ('netobserv_io_network_health' in annotations) {
    const md = (JSON.parse(annotations['netobserv_io_network_health']) as HealthMetadata) || undefined;
    if (md) {
      md.thresholdF = parseFloat(md.threshold) || 0;
    }
    return md;
  }
  return undefined;
};

export const buildStats = (rules: Rule[]): HealthStats => {
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
    if (a.metadata?.namespaceLabels) {
      a.metadata.namespaceLabels.forEach(l => {
        if (!namespaceLabels.includes(l)) {
          namespaceLabels.push(l);
        }
      });
    }
    if (a.metadata?.nodeLabels) {
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
  const globalRules = ruleWithMD.filter(
    r => _.isEmpty(r.metadata?.namespaceLabels) && _.isEmpty(r.metadata?.nodeLabels)
  );
  const namespaceRules = ruleWithMD.filter(r => !_.isEmpty(r.metadata?.namespaceLabels));
  const nodeRules = ruleWithMD.filter(r => !_.isEmpty(r.metadata?.nodeLabels));
  injectInactive(globalRules, [global]);
  injectInactive(namespaceRules, byNamespace);
  injectInactive(nodeRules, byNode);
  [global, ...byNamespace, ...byNode].forEach(r => {
    r.score = computeScore(r);
  });
  return { global, byNamespace, byNode };
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
    score: { total: 0, details: [] }
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

const criticalWeight = 1;
const warningWeight = 0.7;
const minorWeight = 0.4;
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
export const computeScore = (r: ByResource): Score => {
  const allAlerts = getAllAlerts(r);
  const allScores = allAlerts
    .map(computeAlertScore)
    .concat(r.critical.inactive.map(name => ({ alertName: name, rawScore: 10, weight: criticalWeight })))
    .concat(r.warning.inactive.map(name => ({ alertName: name, rawScore: 10, weight: warningWeight })))
    .concat(r.other.inactive.map(name => ({ alertName: name, rawScore: 10, weight: minorWeight })));
  const sum = allScores.map(s => s.rawScore * s.weight).reduce((a, b) => a + b, 0);
  const sumWeights = allScores.map(s => s.weight).reduce((a, b) => a + b, 0);
  if (sumWeights === 0) {
    return { total: 10, details: [] };
  }
  return { total: sum / sumWeights, details: allScores };
};

// Score [0,1]; lower is better
const computeExcessRatio = (a: AlertWithRuleName): number => {
  // Assuming the alert value is a [0-100] percentage. Needs update if more use cases come up.
  const threshold = (a.metadata?.thresholdF || 0) / 2;
  const range = 100 - threshold;
  const excess = Math.max((a.value as number) - threshold, 0);
  return excess / range;
};

export const computeExcessRatioStatusWeighted = (a: AlertWithRuleName): number => {
  return computeExcessRatio(a) * getStateWeight(a);
};

// Score [0,10]; higher is better
export const computeAlertScore = (a: AlertWithRuleName): ScoreDetail => {
  return {
    alertName: a.ruleName,
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
