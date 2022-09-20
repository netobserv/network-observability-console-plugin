import { TFunction } from 'i18next';
import { MetricScopeOptions } from '../model/metrics';
import { MetricFunction, MetricType } from '../model/flow-query';
import { humanFileSize } from '../utils/bytes';
import { roundTwoDigits } from '../utils/count';
import { TimeRange } from '../utils/datetime';
import { cyrb53 } from '../utils/hash';
import { Fields, Labels, Record } from './ipfix';

export interface AggregatedQueryResponse {
  resultType: string;
  result: StreamResult[] | TopologyMetrics[];
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

export interface TopologyResult {
  metrics: TopologyMetrics[];
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

export interface TopologyMetric {
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

export const getMetricName = (metric: TopologyMetric, scope: MetricScopeOptions, src: boolean, t: TFunction) => {
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

export interface TopologyMetrics {
  metric: TopologyMetric;
  values: (string | number)[][];
  total: number;
}

/* calculate total for selected function
 * loki will return matrix with multiple values (one per step = 60s)
 */
export const calculateMatrixTotals = (tm: TopologyMetrics, mf: MetricFunction, range: number | TimeRange) => {
  let rangeInMinutes: number;
  if (typeof range === 'number') {
    rangeInMinutes = range / 60;
  } else {
    rangeInMinutes = (range.from - range.to) / (1000 * 60);
  }

  tm.total = 0;
  switch (mf) {
    case 'max':
      tm.total = Math.max(...tm.values.map(v => Number(v[1])));
      break;
    case 'avg':
    case 'rate':
      tm.values.forEach(v => (tm.total += Number(v[1])));
      tm.total = tm.total / rangeInMinutes;
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
