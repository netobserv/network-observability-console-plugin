//import { getDateSInMinutes, getRangeInMinutes } from '../utils/duration';
import { MetricFunction, MetricType } from '../model/flow-query';
import { humanFileSize } from '../utils/bytes';
import { roundTwoDigits } from '../utils/count';
import { cyrb53 } from '../utils/hash';
import { Fields, Labels, Record } from './ipfix';
import { MetricScopeOptions } from '../model/metrics';
import { TFunction } from 'i18next';

export interface AggregatedQueryResponse {
  resultType: string;
  result: StreamResult[] | Metrics[];
  stats: Stats;
}

export interface Stats {
  numQueries: number;
  limitReached: boolean;
  // Here, more (raw) stats available in queriesStats array
}

export interface StreamResult {
  stream: { [key: string]: string };
  values: string[][];
}

export interface RecordsResult {
  records: Record[];
  stats: Stats;
}

export interface MetricsResult {
  metrics: Metrics[];
  appMetrics?: Metrics;
  stats: Stats;
}

export const parseStream = (raw: StreamResult): Record[] => {
  return raw.values.map(v => {
    const fields = JSON.parse(v[1]) as Fields;
    return {
      labels: raw.stream as unknown as Labels,
      key: cyrb53(v.join(',')),
      fields: fields
    };
  });
};

export interface Metric {
  app?: string;
  DstAddr: string;
  DstK8S_Name: string;
  DstK8S_Namespace: string;
  DstK8S_OwnerName: string;
  DstK8S_OwnerType: string;
  DstK8S_Type: string;
  DstK8S_HostName: string;
  SrcAddr: string;
  SrcK8S_Name: string;
  SrcK8S_Namespace: string;
  SrcK8S_OwnerName: string;
  SrcK8S_OwnerType: string;
  SrcK8S_Type: string;
  SrcK8S_HostName: string;
}

export const getMetricName = (metric: Metric, scope: MetricScopeOptions, src: boolean, t: TFunction) => {
  const m = metric as never;
  const prefix = src ? 'Src' : 'Dst';
  switch (scope) {
    case MetricScopeOptions.HOST:
      return m[`${prefix}K8S_HostName`]
        ? m[`${prefix}K8S_HostName`]
        : m[`${prefix}K8S_Type`] === 'Node'
        ? m[`${prefix}K8S_Name`]
        : t('External');
    case MetricScopeOptions.NAMESPACE:
      return m[`${prefix}K8S_Namespace`]
        ? m[`${prefix}K8S_Namespace`]
        : m[`${prefix}K8S_Type`] === 'Namespace'
        ? m[`${prefix}K8S_Name`]
        : t('Unknown');
    case MetricScopeOptions.OWNER:
      return m[`${prefix}K8S_Namespace`] && m[`${prefix}K8S_OwnerName`]
        ? `${m[`${prefix}K8S_Namespace`]}.${m[`${prefix}K8S_OwnerName`]}`
        : m[`${prefix}K8S_OwnerName`]
        ? m[`${prefix}K8S_OwnerName`]
        : t('Unknown');
    case MetricScopeOptions.RESOURCE:
    default:
      return m[`${prefix}K8S_Namespace`] && m[`${prefix}K8S_Name`]
        ? `${m[`${prefix}K8S_Namespace`]}.${m[`${prefix}K8S_Name`]}`
        : m[`${prefix}K8S_Name`]
        ? m[`${prefix}K8S_Name`]
        : m[`${prefix}Addr`];
  }
};

export interface Metrics {
  metric: Metric;
  values: (string | number)[][];
  total: number;
}

/* calculate total for selected function
 * loki will return matrix with multiple values (approximatively one per step)
 * relying on value.length is safer than counting steps in a range
 */
export const calculateMatrixTotals = (tm: Metrics, mf: MetricFunction) => {
  tm.total = 0;
  switch (mf) {
    case 'max':
      tm.total = Math.max(...tm.values.map(v => Number(v[1])));
      break;
    case 'avg':
    case 'rate':
      tm.values.forEach(v => (tm.total += Number(v[1])));
      tm.total = tm.total / tm.values.length;
      break;
    case 'sum':
    default:
      tm.values.forEach(v => (tm.total += Number(v[1])));
      break;
  }
  return tm;
};

export const getMetricValue = (v: number, metricFunction?: MetricFunction, metricType?: MetricType) => {
  return metricFunction !== 'rate' && metricType === 'bytes' ? humanFileSize(v, true, 0) : roundTwoDigits(v);
};
