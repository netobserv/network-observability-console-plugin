import { MetricScope } from '../model/flow-query';
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

export class TopologyResult {
  metrics: (TopologyMetrics | DroppedTopologyMetrics)[];
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
  TcpDropState?: string;
  TcpDropCause?: string;
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

export type DroppedTopologyMetrics = {
  value: number;
  name: string;
  values: [number, number][];
  stats: MetricStats;
  scope: MetricScope;
};

export type TopologyMetrics = {
  source: TopologyMetricPeer;
  destination: TopologyMetricPeer;
  values: [number, number][];
  stats: MetricStats;
  scope: MetricScope;
};

export type NamedMetric = TopologyMetrics & {
  fullName: string;
  shortName: string;
  isInternal: boolean;
};

export interface MetricStats {
  latest: number;
  avg: number;
  max: number;
  total: number;
}
