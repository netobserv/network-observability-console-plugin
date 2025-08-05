import { PrometheusAlert, PrometheusLabels, Rule } from '@openshift-console/dynamic-plugin-sdk';
import * as _ from 'lodash';

export type HealthStats = {
  global: ByResource[],
  byNamespace: ByResource[];
  byNode: ByResource[];
};

export type ByResource = {
  name: string;
  alerts: AlertWithRuleName[];
  critical: SeverityStats;
  warning: SeverityStats;
  other: SeverityStats;
};

type SeverityStats = {
  firing: string[];
  pending: string[];
  silenced: string[];
};

export type AlertWithRuleName = PrometheusAlert & {
  ruleName: string;
  ruleID: string;
  metadata?: HealthMetadata;
};

export const buildStats = (rules: Rule[]): HealthStats => {
  const alerts: AlertWithRuleName[] = rules.flatMap(r => {
    const md = getHealthMetadata(r.annotations);
    return r.alerts.map(a => {
      if (typeof a.value === 'string') {
        a.value = parseFloat(a.value);
      }
      return { ...a, ruleName: r.name, ruleID: r.id, metadata: md };
    })
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
  return { global, byNamespace, byNode };
};

const filterGlobals = (alerts: AlertWithRuleName[], nonGlobalLabels: string[]): ByResource[] => {
  // Keep only rules where none of the non-global labels are set
  const filtered = alerts.filter(a => !nonGlobalLabels.some(l => (l in a.labels)));
  if (filtered.length === 0) {
    return [];
  }
  return statsFromGrouped({"global": filtered});
};

const groupBy = (alerts: AlertWithRuleName[], labels: string[]): ByResource[] => {
  if (labels.length === 0) {
    return [];
  }
  const groups: {[key: string]: AlertWithRuleName[]} = {};
  labels.forEach(l => {
    const byLabel = _.groupBy(alerts.filter(a => l in a.labels), a => a.labels[l]);
    _.keys(byLabel).forEach(k => {
      if (k in groups) {
        groups[k].push(...byLabel[k]);
      } else {
        groups[k] = byLabel[k];
      }
    });
  });
  return statsFromGrouped(groups);
};

const statsFromGrouped = (g: _.Dictionary<AlertWithRuleName[]>): ByResource[] => {
  const stats: ByResource[] = [];
  _.keys(g).forEach(k => {
    if (k) {
      const br: ByResource = {
        name: k,
        alerts: g[k],
        critical: { firing: [], pending: [], silenced: [] },
        warning: { firing: [], pending: [], silenced: [] },
        other: { firing: [], pending: [], silenced: [] }
      };
      stats.push(br);
      g[k].forEach(alert => {
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
            stats.firing.push(alert.ruleName);
            break;
          case 'pending':
            stats.pending.push(alert.ruleName);
            break;
          case 'silenced':
            stats.silenced.push(alert.ruleName);
            break;
        }
      });
    }
  });
  return stats;
};

export const getRulesPreview = (byr: ByResource): string => {
  const r: string[] = [];
  [byr.critical.firing, byr.warning.firing, byr.other.firing].forEach(list => {
    list.forEach(name => {
      if (r.length < 3 && !r.includes(name)) {
        r.push(name);
      }
    });
  });
  if (r.length < 3) {
    return r.join(', ');
  }
  return r.join(', ') + '...';
};

type HealthMetadata = {
  threshold: string;
  unit: string;
  nodeLabels?: string[];
  namespaceLabels?: string[];
};

export const getHealthMetadata = (annotations: PrometheusLabels): HealthMetadata | undefined => {
  if ('netobserv_io_network_health' in annotations) {
    return JSON.parse(annotations['netobserv_io_network_health']) as HealthMetadata;
  }
  return undefined;
}
