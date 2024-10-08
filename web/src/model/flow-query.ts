import { Field } from '../api/ipfix';
import { Filter } from './filters';

export type RecordType = 'allConnections' | 'newConnection' | 'heartbeat' | 'endConnection' | 'flowLog';
export type DataSource = 'auto' | 'loki' | 'prom';
export type Match = 'all' | 'any';
export type PacketLoss = 'dropped' | 'hasDrops' | 'sent' | 'all';
export type MetricFunction = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'p90' | 'p99' | 'rate';
export type StatFunction = MetricFunction | 'last';
export type MetricType = 'Flows' | 'DnsFlows' | Field;
export type FlowScope = 'app' | 'cluster' | 'zone' | 'host' | 'namespace' | 'owner' | 'resource';
export type AggregateBy = FlowScope | Field;
export type NodeType = FlowScope | 'unknown';
export type Groups =
  | 'clusters'
  | 'clusters+zones'
  | 'clusters+hosts'
  | 'clusters+namespaces'
  | 'clusters+owners'
  | 'zones'
  | 'zones+hosts'
  | 'zones+namespaces'
  | 'zones+owners'
  | 'hosts'
  | 'hosts+namespaces'
  | 'hosts+owners'
  | 'namespaces'
  | 'namespaces+owners'
  | 'owners';

export interface FlowQuery {
  timeRange?: number;
  startTime?: string;
  endTime?: string;
  namespace?: string;
  filters: string;
  dedup?: boolean;
  recordType: RecordType;
  dataSource: DataSource;
  packetLoss: PacketLoss;
  limit: number;
  percentile?: number;
  type?: MetricType;
  function?: MetricFunction;
  aggregateBy?: AggregateBy;
  groups?: Groups;
  rateInterval?: string;
  step?: string;
}

export const filtersToString = (filters: Filter[], matchAny: boolean): string => {
  const matches: string[] = [];
  filters.forEach(f => {
    const str = f.def.encoder(f.values, matchAny, f.not || false, f.moreThan || false);
    matches.push(str);
  });
  return encodeURIComponent(matches.join(matchAny ? '|' : '&'));
};

export const filterByHashId = (hashId: string): string => {
  return encodeURIComponent(`_HashId="${hashId}"`);
};

export const isTimeMetric = (metricType: MetricType | undefined) => {
  return ['DnsLatencyMs', 'TimeFlowRttNs'].includes(metricType || '');
};
