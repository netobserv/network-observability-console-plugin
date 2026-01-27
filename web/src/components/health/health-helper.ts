import { PrometheusAlert, PrometheusLabels, Rule } from '@openshift-console/dynamic-plugin-sdk';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { SilenceMatcher } from '../../api/alert';
import { RecordingAnnotations } from '../../model/config';

export type Severity = 'critical' | 'warning' | 'info';
export type AlertState = 'firing' | 'pending' | 'silenced' | 'recording' | 'inactive';

// HealthItem can be either based on an Alert or based on a RecordingRule metric
export type HealthItem = {
  ruleName: string;
  ruleID?: string;
  metadata: HealthMetadata;
  value: number;
  severity: Severity;
  state: AlertState;
  threshold: string;
  thresholdF: number;
  upperBound: string;
  labels: PrometheusLabels;
  summary: string;
  description: string;
  activeAt?: string;
};

export type RecordingRuleMetric = {
  name: string;
  values: { labels: PrometheusLabels; value: number }[];
};

export type HealthStats = {
  global: HealthStat;
  byNamespace: HealthStat[];
  byNode: HealthStat[];
  byOwner: HealthStat[];
};

export type HealthStat = {
  name: string;
  critical: PerState;
  warning: PerState;
  other: PerState;
  score: number;
};

type PerState = {
  firing: HealthItem[];
  pending: HealthItem[];
  silenced: HealthItem[];
  recording: HealthItem[];
  inactive: string[];
};

type HealthMetadata = {
  alertThreshold?: string;
  alertThresholdF: number;
  recordingThresholds?: RecordingThresholds;
  upperBound: string;
  upperBoundF: number;
  unit: string;
  nodeLabels?: string[];
  namespaceLabels?: string[];
  ownerLabels?: string[];
  links: { name: string; url: string }[];
  trafficLink?: TrafficLink;
};

type RecordingThresholds = {
  info?: string;
  warning?: string;
  critical?: string;
  infoF: number;
  warningF: number;
  criticalF: number;
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

const alertToHealth = (a: PrometheusAlert, r: Rule, md: HealthMetadata): HealthItem => {
  return {
    ruleID: r.id,
    ruleName: r.name,
    metadata: md,
    threshold: md.alertThreshold || '',
    thresholdF: md.alertThresholdF,
    upperBound: md.upperBound,
    labels: a.labels,
    severity: (a.labels.severity as Severity) || 'info',
    state: (a.state as AlertState) || 'inactive',
    summary: a.annotations.summary || a.labels.template || '',
    description: a.annotations.description || '',
    value: (a.value as number) || 0,
    activeAt: a.activeAt
  };
};

const recordingToHealth = (metric: RecordingRuleMetric, annotations: { [key: string]: string }): HealthItem[] => {
  // Parse metadata
  const md = getHealthMetadata(annotations);
  return metric.values.flatMap(valueData => {
    // Process each value (each value represents a different resource/label combination)
    const value = !isNaN(valueData.value) && isFinite(valueData.value) ? valueData.value : 0;

    // Determine severity based on thresholds
    let severity: Severity = 'info';
    let state: AlertState = 'inactive';
    let threshold: string | undefined = undefined;
    let thresholdF = 0;
    if (md.recordingThresholds) {
      if (md.recordingThresholds.criticalF && value >= md.recordingThresholds.criticalF) {
        severity = 'critical';
        state = 'recording';
        threshold = md.recordingThresholds.critical!;
        thresholdF = md.recordingThresholds.criticalF;
      } else if (md.recordingThresholds.warning && value >= md.recordingThresholds.warningF) {
        severity = 'warning';
        state = 'recording';
        threshold = md.recordingThresholds.warning!;
        thresholdF = md.recordingThresholds.warningF;
      } else if (md.recordingThresholds.info && value >= md.recordingThresholds.infoF) {
        severity = 'info';
        state = 'recording';
        threshold = md.recordingThresholds.info;
        thresholdF = md.recordingThresholds.infoF;
      }
      if (!threshold) {
        // Fallback: use the lowest threshold available (info -> warning -> critical)
        threshold = md.recordingThresholds.info || md.recordingThresholds.warning || md.recordingThresholds.critical;
        thresholdF =
          md.recordingThresholds.infoF || md.recordingThresholds.warningF || md.recordingThresholds.criticalF;
      }
    }

    // Inject labels in description
    let description = annotations.description || '';
    for (const [key, value] of Object.entries(valueData.labels)) {
      description = description.replaceAll(`{{ $labels.${key} }}`, value);
    }

    return {
      ruleName: metric.name,
      metadata: md,
      threshold: threshold || '',
      thresholdF: thresholdF,
      upperBound: md.upperBound,
      labels: valueData.labels,
      severity: severity,
      state: state,
      summary: annotations.summary || valueData.labels.template || '',
      description: description,
      value: value
    };
  });
};

const getHealthMetadata = (annotations: PrometheusLabels): HealthMetadata => {
  const defaultMetadata: HealthMetadata = {
    alertThresholdF: 0,
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
  const parseFloat0 = (s?: string) => (s ? parseFloat(s) || 0 : 0);
  if (annotations && 'netobserv_io_network_health' in annotations) {
    const md = (JSON.parse(annotations['netobserv_io_network_health']) as HealthMetadata) || undefined;
    if (md) {
      // Setup defaults and derived
      md.unit = md.unit || defaultMetadata.unit;
      md.upperBound = md.upperBound || defaultMetadata.upperBound;
      md.trafficLink = md.trafficLink || defaultMetadata.trafficLink;
      md.links = md.links || defaultMetadata.links;
      md.alertThresholdF = parseFloat0(md.alertThreshold);
      md.upperBoundF = parseFloat(md.upperBound) || defaultMetadata.upperBoundF;
      if (md.recordingThresholds) {
        md.recordingThresholds.criticalF = parseFloat0(md.recordingThresholds.critical);
        md.recordingThresholds.warningF = parseFloat0(md.recordingThresholds.warning);
        md.recordingThresholds.infoF = parseFloat0(md.recordingThresholds.info);
      }
      return md;
    }
  }
  return defaultMetadata;
};

export const rulesToHealthItems = (
  alertRules: Rule[],
  recordingAnnotations: RecordingAnnotations,
  recordingRulesMetrics: RecordingRuleMetric[] = []
): HealthItem[] => {
  const alertItems = alertRules.flatMap(ar => {
    const md = getHealthMetadata(ar.annotations);
    if (ar.alerts.length === 0) {
      // set as inactive
      return [
        alertToHealth(
          {
            annotations: ar.annotations,
            labels: { severity: 'inactive' }
          } as PrometheusAlert,
          ar,
          md
        )
      ];
    }
    return ar.alerts.map(a => {
      if (typeof a.value === 'string') {
        a.value = parseFloat(a.value);
      }
      return alertToHealth(a, ar, md);
    });
  });
  const recordingItems = recordingRulesMetrics.flatMap(rm => {
    const annotations = recordingAnnotations[rm.name];
    if (annotations) {
      return recordingToHealth(rm, annotations);
    }
    return [];
  });
  return [...alertItems, ...recordingItems];
};

export const buildStats = (items: HealthItem[]): HealthStats => {
  const namespaceLabels: string[] = [];
  const nodeLabels: string[] = [];
  const ownerLabels: string[] = [];
  items.forEach(a => {
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
    if (a.metadata.ownerLabels) {
      a.metadata.ownerLabels.forEach(l => {
        if (!ownerLabels.includes(l)) {
          ownerLabels.push(l);
        }
      });
    }
  });
  const global = filterGlobals(items, [...namespaceLabels, ...nodeLabels]);
  const byNamespace = groupBy(items, namespaceLabels);
  const byNode = groupBy(items, nodeLabels);
  // TODO: should be grouped by namespace + owner
  const byOwner = groupBy(items, ownerLabels);
  [global, ...byNamespace, ...byNode, ...byOwner].forEach(r => {
    r.score = computeResourceScore(r);
  });

  return {
    global,
    byNode: _.sortBy(byNode, r => r.score, 'asc'),
    byNamespace: _.sortBy(byNamespace, r => r.score, 'asc'),
    byOwner: _.sortBy(byOwner, r => r.score, 'asc')
  };
};

const filterGlobals = (items: HealthItem[], nonGlobalLabels: string[]): HealthStat => {
  // Keep only rules where none of the non-global labels are set
  const filtered = items.filter(a => !nonGlobalLabels.some(l => l in a.labels));
  return statsFromGrouped('', filtered);
};

const groupBy = (items: HealthItem[], labels: string[]): HealthStat[] => {
  if (labels.length === 0) {
    return [];
  }
  const groups: { [key: string]: HealthItem[] } = {};
  labels.forEach(l => {
    const byLabel = _.groupBy(
      items.filter(a => l in a.labels),
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
  const stats: HealthStat[] = [];
  _.keys(groups).forEach(k => {
    if (k) {
      const br = statsFromGrouped(k, groups[k]);
      // Ignore if all are inactive
      const countInactive = br.critical.inactive.length + br.warning.inactive.length + br.other.inactive.length;
      if (countInactive !== groups[k].length) {
        stats.push(br);
      }
    }
  });
  return stats;
};

const statsFromGrouped = (name: string, grouped: HealthItem[]): HealthStat => {
  const br: HealthStat = {
    name: name,
    critical: { firing: [], pending: [], silenced: [], inactive: [], recording: [] },
    warning: { firing: [], pending: [], silenced: [], inactive: [], recording: [] },
    other: { firing: [], pending: [], silenced: [], inactive: [], recording: [] },
    score: 0
  };
  _.uniqWith(grouped, (a, b) => {
    return a.ruleName === b.ruleName && _.isEqual(a.labels, b.labels);
  }).forEach(item => {
    let stats: PerState;
    switch (item.severity) {
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
    switch (item.state) {
      case 'firing':
        stats.firing.push(item);
        break;
      case 'pending':
        stats.pending.push(item);
        break;
      case 'silenced':
        stats.silenced.push(item);
        break;
      case 'recording':
        stats.recording.push(item);
        break;
      case 'inactive':
        stats.inactive.push(item.ruleName);
        break;
    }
  });
  return br;
};

export const getAllHealthItems = (g: HealthStat): HealthItem[] => {
  return [
    ...g.critical.firing,
    ...g.warning.firing,
    ...g.other.firing,
    ...g.critical.pending,
    ...g.warning.pending,
    ...g.other.pending,
    ...g.critical.silenced,
    ...g.warning.silenced,
    ...g.other.silenced,
    ...g.critical.recording,
    ...g.warning.recording,
    ...g.other.recording
  ];
};

export const getItemFilteredLabels = (item: HealthItem, target: string): [string, string][] => {
  return Object.entries(item.labels).filter(
    e =>
      e[0] !== 'app' &&
      e[0] !== 'netobserv' &&
      e[0] !== 'severity' &&
      e[0] !== '__name__' &&
      e[0] !== 'prometheus' &&
      e[0] !== 'template' &&
      e[0] !== 'alertname' &&
      e[1] !== target
  );
};

export const getLinks = (t: TFunction, kind: string, item: HealthItem, resourceName: string) => {
  if (item.state === 'recording') {
    return [
      { name: t('Inspect metric'), url: getRecordingRuleMetricLink(item, resourceName) },
      { name: t('Inspect network traffic'), url: getTrafficLink(kind, resourceName, item) },
      ...item.metadata.links
    ];
  }
  return [
    { name: t('Inspect alert'), url: getAlertLink(item) },
    { name: t('Inspect network traffic'), url: getTrafficLink(kind, resourceName, item) },
    ...item.metadata.links
  ];
};

const getAlertLink = (item: HealthItem): string | undefined => {
  if (item.ruleID) {
    const labels: string[] = [];
    Object.keys(item.labels).forEach(k => {
      labels.push(k + '=' + item.labels[k]);
    });
    return `/monitoring/alerts/${item.ruleID}?${labels.join('&')}`;
  }
  return undefined;
};

const getRecordingRuleMetricLink = (item: HealthItem, resourceName?: string): string => {
  let query = item.ruleName;

  // Filter by namespace or node if available
  if (resourceName) {
    if (item.metadata.namespaceLabels && item.metadata.namespaceLabels.length > 0) {
      query += `{${item.metadata.namespaceLabels[0]}="${resourceName}"}`;
    } else if (item.metadata.nodeLabels && item.metadata.nodeLabels.length > 0) {
      query += `{${item.metadata.nodeLabels[0]}="${resourceName}"}`;
    }
    // TODO: workloads
  }

  return `/monitoring/query-browser?query0=${encodeURIComponent(query)}`;
};

const getTrafficLink = (kind: string, resourceName: string, item: HealthItem): string => {
  const filters: string[] = [];
  let params = '';
  const side = item.metadata.trafficLink?.filterDestination ? 'dst' : 'src';
  const bnf = item.metadata.trafficLink?.backAndForth !== false;
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
    case 'Owner':
      // Filter by owner name
      filters.push(`${side}_owner_name="${resourceName}"`);
      // For workload alerts, namespace and kind are directly in the labels
      // TODO: find a fix; not always true
      const namespace = item.labels.namespace;
      const ownerKind = item.labels.kind;
      if (namespace) {
        filters.push(`${side}_namespace="${namespace}"`);
      }
      if (ownerKind) {
        filters.push(`${side}_kind="${ownerKind}"`);
      }
      params += `&bnf=${bnf}`;
      break;
  }
  if (item.metadata.trafficLink?.extraFilter) {
    filters.push(item.metadata.trafficLink.extraFilter);
  }
  return `/netflow-traffic?filters=${encodeURIComponent(filters.join(';'))}${params}`;
};

const criticalWeight = 1;
const warningWeight = 0.5;
const minorWeight = 0.25;
const pendingWeight = 0.3;
const silencedWeight = 0.1;

const getSeverityScoreRange = (severity: string): { min: number; max: number } => {
  switch (severity) {
    case 'critical':
      return { min: 0, max: 6 };
    case 'warning':
      return { min: 4, max: 8 };
    default:
      // 'info'
      return { min: 6, max: 10 };
  }
};

const getSeverityWeight = (severity: Severity): number => {
  switch (severity) {
    case 'critical':
      return criticalWeight;
    case 'warning':
      return warningWeight;
    default:
      return minorWeight;
  }
};

const getStateWeight = (state: AlertState) => {
  switch (state) {
    case 'pending':
      return pendingWeight;
    case 'silenced':
      return silencedWeight;
    case 'inactive':
      return 0;
  }
  return 1;
};

// Generic weighted score calculator - eliminates code duplication
// Score [0,10]; higher is better
const computeWeightedScore = (scores: ScoreDetail[]): number => {
  if (scores.length === 0) {
    return 10; // Perfect score if no violations
  }

  // Filter out any scores with NaN rawScore to prevent contamination
  const validScores = scores.filter(s => !isNaN(s.rawScore) && isFinite(s.rawScore));

  if (validScores.length === 0) {
    return 10;
  }

  const sum = validScores.map(s => s.rawScore * s.weight).reduce((a, b) => a + b, 0);
  const sumWeights = validScores.map(s => s.weight).reduce((a, b) => a + b, 0);
  if (sumWeights === 0) {
    return 10;
  }
  return sum / sumWeights;
};

// Score [0,10]; higher is better
export const computeResourceScore = (r: HealthStat): number => {
  const allAlerts = getAllHealthItems(r);
  const allScores = allAlerts
    .map(computeHealthItemScore)
    .concat(r.critical.inactive.map(name => ({ alertName: name, rawScore: 10, weight: criticalWeight })))
    .concat(r.warning.inactive.map(name => ({ alertName: name, rawScore: 10, weight: warningWeight })))
    .concat(r.other.inactive.map(name => ({ alertName: name, rawScore: 10, weight: minorWeight })));
  return computeWeightedScore(allScores);
};

// Score [0,1]; lower is better
export const computeExcessRatio = (item: HealthItem): number => {
  // Assuming the alert value is a [0-n] percentage. Needs update if more use cases come up.
  const threshold = item.thresholdF;
  const upper = item.metadata.upperBoundF;
  const vclamped = Math.min(Math.max(item.value, threshold), upper);
  const range = upper - threshold;
  return (vclamped - threshold) / range;
};

export const computeExcessRatioStatusWeighted = (item: HealthItem): number => {
  return computeExcessRatio(item) * getStateWeight(item.state);
};

// Score [0,10]; higher is better
export const computeHealthItemScore = (item: HealthItem): ScoreDetail => {
  const excessRatio = computeExcessRatio(item);
  const range = getSeverityScoreRange(item.severity);

  const scoreRange = range.max - range.min;
  const rawScore = range.min + scoreRange * (1 - excessRatio);

  return {
    rawScore: rawScore,
    weight: getSeverityWeight(item.severity) * getStateWeight(item.state)
  };
};

// Mapping of severity levels to PatternFly Label colors
// critical -> red (danger)
// warning -> orange (warning)
// info -> blue (info)
const severityLabelsColors = {
  critical: 'red',
  warning: 'orange',
  info: 'blue'
} as const;

export const getSeverityColor = (
  severity: string | undefined
): 'red' | 'orange' | 'blue' | 'grey' | 'purple' | 'cyan' | 'green' | 'gold' => {
  if (severity && severity in severityLabelsColors) {
    return severityLabelsColors[severity as keyof typeof severityLabelsColors];
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

export const getResourceSeverity = (s: HealthStat): Severity | undefined => {
  if (s.critical.firing.length > 0 || s.critical.pending.length > 0 || s.critical.recording.length > 0) {
    return 'critical';
  }
  if (s.warning.firing.length > 0 || s.warning.pending.length > 0 || s.warning.recording.length > 0) {
    return 'warning';
  }
  if (s.other.firing.length > 0 || s.other.pending.length > 0 || s.other.recording.length > 0) {
    return 'info';
  }
  return undefined;
};
