import { Filter } from './filters';

export type Reporter = 'source' | 'destination' | 'both';
export type RecordType = 'allConnections' | 'newConnection' | 'heartbeat' | 'endConnection' | 'flowLog';
export type Match = 'all' | 'any';
export type PacketLoss = 'dropped' | 'hasDrops' | 'sent' | 'all';
export type MetricFunction = 'sum' | 'avg' | 'max' | 'last';
export type MetricType = 'count' | 'bytes' | 'packets' | 'droppedBytes' | 'droppedPackets';
export type MetricScope = 'app' | 'host' | 'namespace' | 'owner' | 'resource';
export type NodeType = MetricScope | 'unknown';
export type Groups = 'hosts' | 'hosts+namespaces' | 'hosts+owners' | 'namespaces' | 'namespaces+owners' | 'owners';
export interface FlowQuery {
  timeRange?: number;
  startTime?: string;
  endTime?: string;
  filters: string;
  reporter?: Reporter;
  recordType: RecordType;
  packetLoss: PacketLoss;
  limit: number;
  type?: MetricType;
  scope?: MetricScope;
  groups?: Groups;
  rateInterval?: string;
  step?: string;
}

// E.g.: OrGroup=[AndGroup={foo=a,bar=b}] is match all: foo=a AND bar=b
// OrGroup=[AndGroup={foo=a},AndGroup={bar=b}] is match any: foo=a OR bar=b
// Things get more complicated with the Src/Dst group split,
// e.g. "Namespace=foo AND Port=80" (match all) stands for
// "SrcNamespace=foo AND SrcPort=80" OR "DstNamespace=foo AND DstPort=80"
// which translates into:
// OrGroup=[AndGroup={SrcNamespace=foo,SrcPort=80},AndGroup={DstNamespace=foo,DstPort=80}]

// Match all: put all filters in a single AndGroup, except if there's a Src/Dst group split found
// in which case there will be Src-AndGroup OR Dst-AndGroup
export const groupFiltersMatchAll = (filters: Filter[]): string => {
  const srcMatch: string[] = [];
  const dstMatch: string[] = [];
  let needSrcDstSplit = false;
  filters.forEach(f => {
    if (f.def.encoders.simpleEncode) {
      // Filters here are always applied, regardless Src/Dst group split
      const str = f.def.encoders.simpleEncode(f.values, false, f.not || false);
      srcMatch.push(str);
      dstMatch.push(str);
    } else if (f.def.encoders.common) {
      needSrcDstSplit = true;
      // Filters here are applied for their Src/Dst group split
      const src = f.def.encoders.common.srcEncode(f.values, false, f.not || false);
      srcMatch.push(src);
      const dst = f.def.encoders.common.dstEncode(f.values, false, f.not || false);
      dstMatch.push(dst);
    }
  });
  const joined = needSrcDstSplit ? `${srcMatch.join('&')}|${dstMatch.join('&')}` : srcMatch.join('&');
  return encodeURIComponent(joined);
};

export const groupFiltersMatchAny = (filters: Filter[]): string => {
  const orGroup: string[] = [];
  filters.forEach(f => {
    if (f.def.encoders.simpleEncode) {
      orGroup.push(f.def.encoders.simpleEncode(f.values, true, f.not || false));
    } else if (f.def.encoders.common) {
      orGroup.push(f.def.encoders.common.srcEncode(f.values, true, f.not || false));
      orGroup.push(f.def.encoders.common.dstEncode(f.values, true, f.not || false));
    }
  });
  return encodeURIComponent(orGroup.join('|'));
};

export const filterByHashId = (hashId: string): string => {
  return encodeURIComponent(`_HashId="${hashId}"`);
};
