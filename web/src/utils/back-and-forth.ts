import { FlowMetricsResult, RecordsResult } from '../api/loki';
import { getFlowMetrics, getFlowRecords } from '../api/routes';
import { Filter, FilterDefinition, Filters } from '../model/filters';
import { filtersToString, FlowQuery } from '../model/flow-query';
import { computeStepInterval, TimeRange } from './datetime';
import { setTargeteableFilters, swapFilters } from './filters-helper';
import { mergeStats, substractMetrics, sumMetrics } from './metrics';

export const getFetchFunctions = (filterDefinitions: FilterDefinition[], filters: Filters, matchAny: boolean) => {
  // check back-and-forth
  if (filters.list.some(f => f.def.category === 'targeteable')) {
    // set targetable filters as source filters
    const srcList = setTargeteableFilters(filterDefinitions, filters.list, 'src');
    // set targetable filters as dest filters
    const dstList = setTargeteableFilters(filterDefinitions, filters.list, 'dst');

    return {
      getRecords: (q: FlowQuery) => {
        return getFlowsBNF(q, srcList, dstList, matchAny);
      },
      getMetrics: (q: FlowQuery, range: number | TimeRange) => {
        return getMetricsBNF(q, range, srcList, dstList, matchAny);
      }
    };
  } else if (filters.match === 'peers') {
    let swapped = swapFilters(filterDefinitions, filters.list);
    if (matchAny) {
      // In match-any mode, remove non-swappable filters as they would result in duplicates
      swapped = swapped.filter(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_'));
    }
    if (swapped.length > 0) {
      return {
        getRecords: (q: FlowQuery) => {
          return getFlowsBNF(q, filters.list, swapped, matchAny);
        },
        getMetrics: (q: FlowQuery, range: number | TimeRange) => {
          return getMetricsBNF(q, range, filters.list, swapped, matchAny);
        }
      };
    }
  }
  return {
    getRecords: getFlowRecords,
    getMetrics: getFlowMetrics
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
  return getFlowRecords({ ...initialQuery, filters: newFilters });
};

const getMetricsBNF = (
  initialQuery: FlowQuery,
  range: number | TimeRange,
  orig: Filter[],
  swapped: Filter[],
  matchAny: boolean
): Promise<FlowMetricsResult> => {
  // When bnf is on, this replaces the usual getMetrics with a function with same arguments that runs 3 queries and merge their results
  // in order to get the ORIGINAL + SWAPPED - OVERLAP
  // OVERLAP being ORIGINAL AND SWAPPED.
  // E.g: if ORIGINAL is "SrcNs=foo", SWAPPED is "DstNs=foo" and OVERLAP is "SrcNs=foo AND DstNs=foo"
  const overlapFilters = matchAny ? undefined : [...orig, ...swapped];
  const promOrig = getFlowMetrics({ ...initialQuery, filters: filtersToString(orig, matchAny) }, range);
  const promSwapped = getFlowMetrics({ ...initialQuery, filters: filtersToString(swapped, matchAny) }, range);
  const promOverlap = overlapFilters
    ? getFlowMetrics(
        {
          ...initialQuery,
          filters: filtersToString(overlapFilters, matchAny)
        },
        range
      )
    : Promise.resolve(undefined);
  return Promise.all([promOrig, promSwapped, promOverlap]).then(([rsOrig, rsSwapped, rsOverlap]) =>
    mergeMetricsBNF(range, rsOrig, rsSwapped, rsOverlap)
  );
};

// exported for testing
export const mergeMetricsBNF = (
  range: number | TimeRange,
  rsOrig: FlowMetricsResult,
  rsSwapped: FlowMetricsResult,
  rsOverlap?: FlowMetricsResult
): FlowMetricsResult => {
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
