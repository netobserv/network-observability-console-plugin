import { Filter } from './filters';

export type Reporter = 'source' | 'destination' | 'both';
export type Layer = 'infrastructure' | 'application' | 'both';
export type Match = 'all' | 'any';
export type MetricFunction = 'sum' | 'avg' | 'max' | 'rate';
export type MetricType = 'bytes' | 'packets';
export type MetricScope = 'host' | 'namespace' | 'owner' | 'resource';
export type Groups = 'hosts' | 'hosts+namespaces' | 'hosts+owners' | 'namespaces' | 'namespaces+owners' | 'owners';
export interface FlowQuery {
  timeRange?: number;
  startTime?: string;
  endTime?: string;
  filters: string;
  reporter: Reporter;
  layer: Layer;
  limit: number;
  function?: MetricFunction;
  type?: MetricType;
  step?: number;
  scope?: MetricScope;
  groups?: Groups;
}

// All filters in AND-group (ie. usually for "match all") are set in a list of [key-values]
type AndGroup = { key: string; values: string[] }[];
// All filters in OR-group (ie. usually for "match any") are set as elements of AndGroup array
type OrGroup = AndGroup[];

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
  const srcMatch: AndGroup = [];
  const dstMatch: AndGroup = [];
  let needSrcDstSplit = false;
  filters.forEach(f => {
    if (f.def.fieldMatching.always) {
      // Filters here are always applied, regardless Src/Dst group split
      f.def.fieldMatching.always(f.values).forEach(filter => {
        srcMatch.push(filter);
        dstMatch.push(filter);
      });
    } else {
      needSrcDstSplit = true;
      // Filters here are applied for their Src/Dst group split
      f.def.fieldMatching.ifSrc!(f.values).forEach(filter => {
        srcMatch.push(filter);
      });
      f.def.fieldMatching.ifDst!(f.values).forEach(filter => {
        dstMatch.push(filter);
      });
    }
  });
  return encodeFilters(needSrcDstSplit ? [srcMatch, dstMatch] : [srcMatch]);
};

export const groupFiltersMatchAny = (filters: Filter[]): string => {
  const orGroup: OrGroup = [];
  filters.forEach(f => {
    if (f.def.fieldMatching.always) {
      orGroup.push(f.def.fieldMatching.always(f.values));
    } else {
      orGroup.push(f.def.fieldMatching.ifSrc!(f.values));
      orGroup.push(f.def.fieldMatching.ifDst!(f.values));
    }
  });
  return encodeFilters(orGroup);
};

const encodeFilters = (filters: OrGroup): string => {
  // Example of output: foo=a,b&bar=c|baz=d (url-encoded)
  const str = filters.map(group => group.map(filter => `${filter.key}=${filter.values.join(',')}`).join('&')).join('|');
  return encodeURIComponent(str);
};
