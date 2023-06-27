import { TFunction } from 'i18next';
import { findFilter } from './filter-definitions';
import { TimeRange } from './datetime';
import { Match, MetricFunction, MetricType, RecordType, Reporter } from '../model/flow-query';
import { getURLParam, getURLParamAsNumber, removeURLParam, setURLParam, URLParam } from './url';
import { createFilterValue, DisabledFilters, Filter, filterKey, fromFilterKey } from '../model/filters';
import { NavigateFunction } from 'react-router-dom-v5-compat';

const filtersSeparator = ';';
const filterKVSeparator = '=';
const filterValuesSeparator = ',';
export const defaultTimeRange = 300;
export const defaultRecordType: RecordType = 'flowLog';
export const defaultReporter: Reporter = 'destination';
const defaultMatch: Match = 'all';
export const defaultMetricFunction: MetricFunction = 'last';
export const defaultMetricType: MetricType = 'bytes';

export const flowdirToReporter: { [flowdir: string]: Reporter } = {
  '0': 'destination',
  '1': 'source',
  '': 'both'
};

export const getRangeFromURL = (): number | TimeRange => {
  const timeRange = getURLParamAsNumber(URLParam.TimeRange);
  const startTime = getURLParamAsNumber(URLParam.StartTime);
  const endTime = getURLParamAsNumber(URLParam.EndTime);
  if (timeRange) {
    return timeRange;
  } else if (startTime && endTime) {
    return { from: startTime, to: endTime };
  }
  return defaultTimeRange;
};

export const getRecordTypeFromURL = (): RecordType => {
  return (getURLParam(URLParam.RecordType) as RecordType | null) || defaultRecordType;
};

export const getReporterFromURL = (): Reporter => {
  return (getURLParam(URLParam.Reporter) as Reporter | null) || defaultReporter;
};

export const getLimitFromURL = (fallback: number): number => {
  return getURLParamAsNumber(URLParam.Limit) || fallback;
};

export const getMatchFromURL = (): Match => {
  return (getURLParam(URLParam.Match) as Match | null) || defaultMatch;
};

export const getFiltersFromURL = (t: TFunction, disabledFilters: DisabledFilters): Promise<Filter[]> | undefined => {
  const urlParam = getURLParam(URLParam.Filters);
  //skip filters only if url param is missing
  if (urlParam === null) {
    return undefined;
  }
  const filterPromises: Promise<Filter>[] = [];
  const filters = urlParam.split(filtersSeparator);
  filters.forEach(keyValue => {
    const pair = keyValue.split(filterKVSeparator);
    if (pair.length === 2) {
      const { id, not } = fromFilterKey(pair[0]);
      const def = findFilter(t, id);
      if (def) {
        const disabledValues = disabledFilters[pair[0]]?.split(',') || [];
        const values = pair[1].split(filterValuesSeparator);
        filterPromises.push(
          Promise.all(values.map(v => createFilterValue(def, v))).then(filterValues => {
            filterValues.forEach(fv => {
              if (disabledValues.includes(fv.v)) {
                fv.disabled = true;
              }
            });
            const f: Filter = {
              def: def,
              not: not,
              values: filterValues
            };
            return f;
          })
        );
      }
    }
  });
  return Promise.all(filterPromises);
};

export const setURLFilters = (filters: Filter[], navigateFunc: NavigateFunction, replace?: boolean) => {
  const urlFilters = filters
    .map(filter => {
      return filterKey(filter) + filterKVSeparator + filter.values.map(v => v.v).join(filterValuesSeparator);
    })
    .join(filtersSeparator);
  setURLParam(URLParam.Filters, urlFilters, navigateFunc, replace);
};

export const setURLRange = (range: number | TimeRange, navigateFunc: NavigateFunction, replace?: boolean) => {
  if (typeof range === 'number') {
    setURLParam(URLParam.TimeRange, String(range), navigateFunc, replace);
    removeURLParam(URLParam.StartTime, navigateFunc, true);
    removeURLParam(URLParam.EndTime, navigateFunc, true);
  } else if (typeof range === 'object') {
    setURLParam(URLParam.StartTime, String(range.from), navigateFunc, replace);
    setURLParam(URLParam.EndTime, String(range.to), navigateFunc, true);
    removeURLParam(URLParam.TimeRange, navigateFunc, true);
  }
};

export const setURLRecortType = (recordType: RecordType, navigateFunc: NavigateFunction, replace?: boolean) => {
  setURLParam(URLParam.RecordType, recordType, navigateFunc, replace);
};

export const setURLReporter = (reporter: Reporter, navigateFunc: NavigateFunction, replace?: boolean) => {
  setURLParam(URLParam.Reporter, reporter, navigateFunc, replace);
};

export const setURLLimit = (limit: number, navigateFunc: NavigateFunction, replace?: boolean) => {
  setURLParam(URLParam.Limit, String(limit), navigateFunc, replace);
};

export const setURLMatch = (match: Match, navigateFunc: NavigateFunction, replace?: boolean) => {
  setURLParam(URLParam.Match, match, navigateFunc, replace);
};

export const setURLMetricFunction = (
  metricFunction: MetricFunction,
  navigateFunc: NavigateFunction,
  replace?: boolean
) => {
  if (metricFunction) {
    setURLParam(URLParam.MetricFunction, metricFunction, navigateFunc, replace);
  } else {
    removeURLParam(URLParam.MetricFunction, navigateFunc, replace);
  }
};

export const setURLMetricType = (metricType: MetricType, navigateFunc: NavigateFunction, replace?: boolean) => {
  if (metricType) {
    setURLParam(URLParam.MetricType, metricType, navigateFunc, replace);
  } else {
    removeURLParam(URLParam.MetricType, navigateFunc, replace);
  }
};
