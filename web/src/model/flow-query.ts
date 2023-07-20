import { Filter, Filters, filtersEqual } from './filters';
import { swapFilters } from '../components/filters/filters-helper';

export type Reporter = 'source' | 'destination' | 'both';
export type RecordType = 'allConnections' | 'newConnection' | 'heartbeat' | 'endConnection' | 'flowLog';
export type Match = 'all' | 'any';
export type PacketLoss = 'dropped' | 'hasDrops' | 'sent' | 'all';
export type MetricFunction = 'sum' | 'avg' | 'max' | 'last';
export type MetricType = 'count' | 'bytes' | 'packets' | 'droppedBytes' | 'droppedPackets';
export type FlowScope = 'app' | 'host' | 'namespace' | 'owner' | 'resource';
export type AggregateBy = FlowScope | 'droppedCause' | 'droppedState';
export type NodeType = FlowScope | 'unknown';
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
  aggregateBy?: AggregateBy;
  groups?: Groups;
  rateInterval?: string;
  step?: string;
}

export const groupFilters = (filters: Filters, matchAny: boolean): string => {
  let result = filtersToString(filters.list, matchAny);
  if (filters.backAndForth) {
    const { swapped, overlaps } = swap(filters.list, matchAny);
    if (swapped.length > 0) {
      result = `${result}|${filtersToString(swapped, matchAny)}`;
      if (overlaps.length > 0) {
        result = `${result}&${filtersToString(overlaps, matchAny)}`;
      }
    }
  }
  return encodeURIComponent(result);
};

const filtersToString = (filters: Filter[], matchAny: boolean): string => {
  const matches: string[] = [];
  filters.forEach(f => {
    const str = f.def.encoder(f.values, matchAny, f.not || false);
    matches.push(str);
  });
  return matches.join(matchAny ? '|' : '&');
};

const swap = (filters: Filter[], matchAny: boolean): { swapped: Filter[]; overlaps: Filter[] } => {
  // include swapped traffic
  const swapped = swapFilters((k: string) => k, filters);
  if (matchAny) {
    return {
      // In match-any mode, remove non-swappable filters as they would result in duplicates
      swapped: swapped.filter(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_')),
      overlaps: [] // overlap not handled in match-any
    };
  }
  // match-all mode
  const { overlaps, cancelSwap } = determineOverlap(filters, swapped);
  if (cancelSwap) {
    return { swapped: [], overlaps: [] };
  }
  return {
    swapped,
    overlaps
  };
};

const determineOverlap = (orig: Filter[], swapped: Filter[]): { overlaps: Filter[]; cancelSwap: boolean } => {
  // With "back and forth", the input query is "doubled" with an analoguous query that captures the return traffic
  // Overlap detection consists in excluding from that added query the overlapping part, by adding the opposite of the 1st query to the second
  // E.g. src=A => src=A OR (dst=A AND src!=A)
  //      |        |         |         |-> excluding overlaping part
  //      |        |         |-> flipped part (return traffic)
  //      |        |-> resulting query
  //      |-> initial query
  //
  // When the input query is fully symetric (same filters as src and dst), this is a special case: we don't want this:
  // E.g. src=A AND dst=A => (src=A AND dst=A) OR (dst=A AND src=A AND src!=A AND dst !=A)
  //                                              |-> this is void => omit that part, ie. cancel swapping
  //
  // When the input query is only partially symetric, we need to keep swapping but remove symetric parts from the overlap:
  // E.g. src=A AND dst=A AND dstnode=N => (src=A AND dst=A AND dstnode=N) OR (dst=A AND src=A AND srcnode=N AND dstnode!=N)
  //                                                                          |-> keep swapping, but do not exclude overlap
  //                                   ie. do not write "... OR (dst=A AND src=A AND srcnode=N AND src!=A AND dst!=A AND dstnode!=N)"
  //                                       as that would result in an always empty set.
  let cancelSwap = true;
  const overlaps: Filter[] = [];
  orig.forEach(o => {
    if (o.def.overlap) {
      const valuesFromSwapped = swapped.find(s => filtersEqual(o, s))?.values.map(v => v.v);
      const overlap: Filter = valuesFromSwapped
        ? {
            def: o.def,
            not: o.not !== true,
            // only include non-symetric values
            values: o.values.filter(ov => !valuesFromSwapped.includes(ov.v))
          }
        : { ...o, not: o.not !== true };
      if (overlap.values.length > 0) {
        // if there's some overlap here, it's because we found at least one non-symetric value
        cancelSwap = false;
        overlaps.push(overlap);
      }
    } else {
      cancelSwap = false;
    }
  });
  return { overlaps, cancelSwap };
};

export const filterByHashId = (hashId: string): string => {
  return encodeURIComponent(`_HashId="${hashId}"`);
};
