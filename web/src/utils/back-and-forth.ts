import { RecordsResult, TopologyMetricsResult } from '../api/loki';
import { getFlows, getTopologyMetrics } from '../api/routes';
import { swapFilters } from '../components/filters/filters-helper';
import { Filter, Filters } from '../model/filters';
import { FlowQuery, filtersToString } from '../model/flow-query';
import { TimeRange, computeStepInterval } from './datetime';
import { mergeStats, substractMetrics, sumMetrics } from './metrics';

export const getFetchFunctions = (filters: Filters, matchAny: boolean) => {
  // check back-and-forth
  if (filters.backAndForth) {
    const swapped = swap(filters.list, matchAny);
    if (swapped.length > 0) {
      return {
        getFlows: (q: FlowQuery) => {
          return getFlowsBNF(q, filters.list, swapped, matchAny);
        },
        getTopologyMetrics: (q: FlowQuery, range: number | TimeRange) => {
          return getTopologyMetricsBNF(q, range, filters.list, swapped, matchAny);
        }
      };
    }
  }
  return {
    getFlows: getFlows,
    getTopologyMetrics: getTopologyMetrics
  };
};

const encodedPipe = encodeURIComponent('|');
const getFlowsBNF = (
  initialQuery: FlowQuery,
  orig: Filter[],
  swapped: Filter[],
  matchAny: boolean
): Promise<RecordsResult> => {
  // Combine original filters and swapped. Note that we leave any potential overlapping flows: they can be deduped with "showDuplicates: false".
  const newFilters = filtersToString(orig, matchAny) + encodedPipe + filtersToString(swapped, matchAny);
  return getFlows({ ...initialQuery, filters: newFilters });
};

const getTopologyMetricsBNF = (
  initialQuery: FlowQuery,
  range: number | TimeRange,
  orig: Filter[],
  swapped: Filter[],
  matchAny: boolean
): Promise<TopologyMetricsResult> => {
  // When bnf is on, this replaces the usual getTopologyMetrics with a function with same arguments that runs 3 queries and merge their results
  // in order to get the ORIGINAL + SWAPPED - OVERLAP
  // OVERLAP being ORIGINAL AND SWAPPED.
  // E.g: if ORIGINAL is "SrcNs=foo", SWAPPED is "DstNs=foo" and OVERLAP is "SrcNs=foo AND DstNs=foo"
  const overlapFilters = matchAny ? undefined : [...orig, ...swapped];
  const promOrig = getTopologyMetrics(initialQuery, range);
  const promSwapped = getTopologyMetrics({ ...initialQuery, filters: filtersToString(swapped, matchAny) }, range);
  const promOverlap = overlapFilters
    ? getTopologyMetrics(
        {
          ...initialQuery,
          filters: filtersToString(overlapFilters, matchAny)
        },
        range
      )
    : Promise.resolve(undefined);
  return Promise.all([promOrig, promSwapped, promOverlap]).then(([rsOrig, rsSwapped, rsOverlap]) =>
    mergeTopologyMetricsBNF(range, rsOrig, rsSwapped, rsOverlap)
  );
};

// exported for testing
export const mergeTopologyMetricsBNF = (
  range: number | TimeRange,
  rsOrig: TopologyMetricsResult,
  rsSwapped: TopologyMetricsResult,
  rsOverlap?: TopologyMetricsResult
): TopologyMetricsResult => {
  const { stepSeconds } = computeStepInterval(range);
  // Sum ORIGINAL + SWAPPED
  const metrics = sumMetrics(rsOrig.metrics, rsSwapped.metrics, stepSeconds);
  const stats = mergeStats(rsOrig.stats, rsSwapped.stats);
  if (rsOverlap) {
    // Substract OVERLAP
    return {
      metrics: substractMetrics(metrics, rsOverlap.metrics, stepSeconds),
      stats: mergeStats(stats, rsOverlap.stats)
    };
  }
  return { metrics, stats };
};

const swap = (filters: Filter[], matchAny: boolean): Filter[] => {
  // include swapped traffic
  const swapped = swapFilters((k: string) => k, filters);
  if (matchAny) {
    // In match-any mode, remove non-swappable filters as they would result in duplicates
    return swapped.filter(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_'));
  }
  return swapped;
};
