import { Filter } from './filters';

export type RecordType = 'allConnections' | 'newConnection' | 'heartbeat' | 'endConnection' | 'flowLog';
export type Match = 'all' | 'any';
export type PacketLoss = 'dropped' | 'hasDrops' | 'sent' | 'all';
export type MetricFunction = 'sum' | 'avg' | 'min' | 'max' | 'last' | 'p90' | 'p99';
export type MetricType =
  | 'count'
  | 'countDns'
  | 'bytes'
  | 'packets'
  | 'droppedBytes'
  | 'droppedPackets'
  | 'dnsLatencies'
  | 'flowRtt';
export type FlowScope = 'app' | 'host' | 'namespace' | 'owner' | 'resource';
export type GenericAggregation = 'droppedCause' | 'droppedState' | 'dnsRCode';
export type AggregateBy = FlowScope | GenericAggregation;
export type NodeType = FlowScope | 'unknown';
export type Groups = 'hosts' | 'hosts+namespaces' | 'hosts+owners' | 'namespaces' | 'namespaces+owners' | 'owners';

export interface FlowQuery {
  timeRange?: number;
  startTime?: string;
  endTime?: string;
  filters: string;
  dedup?: boolean;
  recordType: RecordType;
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
  return ['dnsLatencies', 'flowRtt'].includes(metricType || '');
};
