import { getFunctionFromId, getRateFunctionFromId } from '../utils/overview-panels';
import { GenericAggregation, FlowScope, MetricType, MetricFunction } from '../model/flow-query';
import { cyrb53 } from '../utils/hash';
import { Fields, Labels, Record } from './ipfix';

export interface AggregatedQueryResponse {
  resultType: string;
  result: StreamResult[] | RawTopologyMetrics[];
  stats: Stats;
  isMock: boolean;
  unixTimestamp: number;
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

export interface RawTopologyMetric {
  DstAddr?: string;
  DstK8S_Name?: string;
  DstK8S_Namespace?: string;
  DstK8S_OwnerName?: string;
  DstK8S_OwnerType?: string;
  DstK8S_Type?: string;
  DstK8S_HostName?: string;
  SrcAddr?: string;
  SrcK8S_Name?: string;
  SrcK8S_Namespace?: string;
  SrcK8S_OwnerName?: string;
  SrcK8S_OwnerType?: string;
  SrcK8S_Type?: string;
  SrcK8S_HostName?: string;
  PktDropLatestState?: string;
  PktDropLatestDropCause?: string;
  DnsFlagsResponseCode?: string;
}

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
  namespace?: string;
  owner?: NameAndType;
  resource?: NameAndType;
  hostName?: string;
  resourceKind?: string;
  isAmbiguous: boolean;
  getDisplayName: (inclNamespace: boolean, disambiguate: boolean) => string | undefined;
}

export type GenericMetric = {
  name: string;
  values: [number, number][];
  stats: MetricStats;
  aggregateBy: GenericAggregation;
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

export const getFunctionMetricKey = (metricFunction: MetricFunction) => {
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
  totalDnsCountMetric?: TopologyMetrics;
  totalRttMetric?: TotalFunctionMetrics;
};

export const initRateMetricKeys = (ids: string[]) => {
  const obj: RateMetrics | TotalRateMetrics = {};
  ids.forEach(id => {
    obj[getRateFunctionFromId(id)] = undefined;
  });
  return obj;
};

export const getRateMetricKey = (metricType: MetricType) => {
  return metricType === 'bytes' ? 'bytes' : 'packets';
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
