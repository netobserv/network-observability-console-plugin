import { cyrb53 } from '../utils/hash';
import { Fields, Labels, Record } from './ipfix';

export interface AggregatedQueryResponse {
  resultType: string;
  result: StreamResult[] | RawTopologyMetrics[];
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
}

export interface RawTopologyMetrics {
  metric: RawTopologyMetric;
  values: (string | number)[][];
}

export interface TopologyMetricPeer {
  addr?: string;
  name?: string;
  namespace?: string;
  ownerName?: string;
  ownerType?: string;
  type?: string;
  hostName?: string;
  displayName?: string;
}

export const peersEqual = (p1: TopologyMetricPeer, p2: TopologyMetricPeer): boolean => {
  return (
    p1.addr === p2.addr &&
    p1.hostName === p2.hostName &&
    p1.name === p2.name &&
    p1.type === p2.type &&
    p1.namespace === p2.namespace &&
    p1.ownerName === p2.ownerName &&
    p1.ownerType === p2.ownerType
  );
};

export type TopologyMetrics = {
  source: TopologyMetricPeer;
  destination: TopologyMetricPeer;
  values: (string | number)[][];
  stats: MetricStats;
};

export interface MetricStats {
  latest: number;
  avg: number;
  max: number;
  total: number;
}
