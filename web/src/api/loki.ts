import { FlowScope, MetricType, StatFunction } from '../model/flow-query';
import { cyrb53 } from '../utils/hash';
import { getFunctionFromId, getRateFunctionFromId } from '../utils/overview-panels';
import { Field, Fields, Labels, Record } from './ipfix';

export interface AggregatedQueryResponse {
  resultType: string;
  result: StreamResult[] | RawTopologyMetrics[];
  stats: Stats;
  unixTimestamp: number;
}

export interface Stats {
  numQueries: number;
  limitReached: boolean;
  dataSources: string[];
  // Here, more (raw) stats available in queriesStats array
}

export interface StreamResult {
  stream: { [key: string]: string };
  values: string[][];
}

export class RecordsResult {
  records: Record[];
  stats: Stats;
}

export class FlowMetricsResult {
  metrics: TopologyMetrics[];
  stats: Stats;
}

export class GenericMetricsResult {
  metrics: GenericMetric[];
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

export interface RawTopologyMetric extends Fields, Labels {}

export interface RawTopologyMetrics {
  metric: RawTopologyMetric;
  values: [number, unknown][];
}

export interface NameAndType {
  name: string;
  type: string;
}

export interface TopologyMetricPeer {
  id: string;
  addr?: string;
  owner?: NameAndType;
  resource?: NameAndType;
  resourceKind?: string;
  isAmbiguous: boolean;
  getDisplayName: (inclNamespace: boolean, disambiguate: boolean) => string | undefined;
  // any FlowScope can appear here as optionnal field
  [name: string]: unknown;
  namespace?: string;
  host?: string;
  cluster?: string;
}

export type GenericMetric = {
  name: string;
  values: [number, number][];
  stats: MetricStats;
  aggregateBy: Field;
};

export type FunctionMetrics = {
  avg?: TopologyMetrics[];
  min?: TopologyMetrics[];
  max?: TopologyMetrics[];
  p90?: TopologyMetrics[];
  p99?: TopologyMetrics[];
};

export type TotalFunctionMetrics = {
  avg?: TopologyMetrics;
  min?: TopologyMetrics;
  max?: TopologyMetrics;
  p90?: TopologyMetrics;
  p99?: TopologyMetrics;
};

export const initFunctionMetricKeys = (ids: string[]) => {
  const obj: FunctionMetrics | TotalFunctionMetrics = {};
  ids.forEach(id => {
    obj[getFunctionFromId(id)] = undefined;
  });
  return obj;
};

export const getFunctionMetricKey = (metricFunction: StatFunction) => {
  switch (metricFunction) {
    case 'min':
    case 'max':
    case 'p90':
    case 'p99':
      return metricFunction;
    default:
      return 'avg';
  }
};

export type RateMetrics = {
  bytes?: TopologyMetrics[];
  packets?: TopologyMetrics[];
};

export type TotalRateMetrics = {
  bytes?: TopologyMetrics;
  packets?: TopologyMetrics;
};

export type NetflowMetrics = {
  rateMetrics?: RateMetrics;
  droppedRateMetrics?: RateMetrics;
  totalRateMetric?: TotalRateMetrics;
  totalDroppedRateMetric?: TotalRateMetrics;
  droppedStateMetrics?: GenericMetric[];
  droppedCauseMetrics?: GenericMetric[];
  dnsRCodeMetrics?: GenericMetric[];
  dnsLatencyMetrics?: FunctionMetrics;
  rttMetrics?: FunctionMetrics;
  totalFlowCountMetric?: TopologyMetrics;
  totalDnsLatencyMetric?: TotalFunctionMetrics;
  totalDnsCountMetric?: GenericMetric;
  totalRttMetric?: TotalFunctionMetrics;
  customMetrics: Map<string, TopologyMetrics[] | GenericMetric[]>;
  totalCustomMetrics: Map<string, TopologyMetrics | GenericMetric>;
};

export const defaultNetflowMetrics = {
  customMetrics: new Map(),
  totalCustomMetrics: new Map()
};

export const initRateMetricKeys = (ids: string[]) => {
  const obj: RateMetrics | TotalRateMetrics = {};
  ids.forEach(id => {
    obj[getRateFunctionFromId(id)] = undefined;
  });
  return obj;
};

export const getRateMetricKey = (metricType: MetricType) => {
  return metricType === 'Bytes' ? 'bytes' : 'packets';
};

export type TopologyMetrics = {
  source: TopologyMetricPeer;
  destination: TopologyMetricPeer;
  values: [number, number][];
  stats: MetricStats;
  scope: FlowScope;
};

export type NamedMetric = TopologyMetrics & {
  fullName: string;
  shortName: string;
  isInternal: boolean;
};

export interface MetricStats {
  sum: number;
  latest: number;
  avg: number;
  min: number;
  max: number;
  percentiles: number[];
  total: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isValidTopologyMetrics = (metric: any): metric is TopologyMetrics => {
  return (
    metric &&
    typeof metric.source === 'object' &&
    typeof metric.destination === 'object' &&
    Array.isArray(metric.values) &&
    typeof metric.stats === 'object' &&
    typeof metric.scope === 'string'
  );
};

export interface Status {
  loki: DatasourceStatus;
  prometheus: DatasourceStatus;
}

export interface DatasourceStatus {
  isEnabled: boolean;
  namespacesCount: number;
  isReady: boolean;
  error: string;
  errorCode: number;
}
