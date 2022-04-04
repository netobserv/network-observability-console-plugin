import { createBrowserHistory } from 'history';
import * as _ from 'lodash';
import { Column, ColumnsId } from './columns';
import { createFilterValue, Filter, FilterType, FilterValue } from './filters';
import { TimeRange } from './datetime';
import { Match, QueryOptions, Reporter } from '../model/query-options';

const SPLIT_FILTER_CHAR = ',';
export const DEFAULT_TIME_RANGE = 300;
export const DEFAULT_LIMIT = 100;
export const DEFAULT_FLOWDIR = '0';
export const DEFAULT_MATCH = 'all';
export const NETFLOW_TRAFFIC_PATH = '/netflow-traffic';

export enum QueryArgument {
  StartTime = 'startTime',
  EndTime = 'endTime',
  TimeRange = 'timeRange',
  RefreshInterval = 'refresh',
  Limit = 'limit',
  Match = 'match'
}
type AnyQueryArgs = ColumnsId | QueryArgument;
export type QueryArguments = { [k in AnyQueryArgs]?: unknown };

export const history = createBrowserHistory();

export const getURLQueryArgument = (arg: AnyQueryArgs) => {
  return new URLSearchParams(window.location.search).get(arg);
};

export const getURLQueryArgumentAsNumber = (arg: AnyQueryArgs) => {
  const q = new URLSearchParams(window.location.search).get(arg);
  if (q && !isNaN(Number(q))) {
    return Number(q);
  }
  return null;
};

export const flowdirToReporter: { [flowdir: string]: Reporter } = {
  '0': 'destination',
  '1': 'source',
  '': 'both'
};

export const reporterToFlowdir = _.invert(flowdirToReporter);

const stringToMatch: { [match: string]: Match } = {
  all: 'all',
  any: 'any'
};

export const buildQueryArguments = (
  filters: Filter[],
  range: number | TimeRange,
  opts: QueryOptions
): QueryArguments => {
  // Note: at the moment the browser query params and API query params are tied together;
  // we may want to decouple them in the future.
  const params: QueryArguments = {};
  _.each(filters, (f: Filter) => {
    params[f.colId] = f.values.map(value => value.v).join(SPLIT_FILTER_CHAR);
  });
  if (range) {
    if (typeof range === 'number') {
      params[QueryArgument.TimeRange] = range;
    } else if (typeof range === 'object') {
      params[QueryArgument.StartTime] = range.from.toString();
      params[QueryArgument.EndTime] = range.to.toString();
    }
  }
  if (opts.reporter !== 'both') {
    params[ColumnsId.flowdir] = reporterToFlowdir[opts.reporter];
  }
  params[QueryArgument.Limit] = opts.limit;
  params[QueryArgument.Match] = opts.match;
  return params;
};

export const getURLParams = (qa: QueryArguments) => {
  const urlParams = new URLSearchParams();
  _.each(qa, (v, k) => {
    urlParams.set(k, String(v));
  });
  return urlParams;
};

export const setURLQueryArguments = (qa: QueryArguments) => {
  const urlParams = getURLParams(qa);
  const url = new URL(window.location.href);
  history.replace(`${url.pathname}?${urlParams.toString()}${url.hash}`);
};

export const removeURLQueryArguments = (keys: AnyQueryArgs[]) => {
  const params = new URLSearchParams(window.location.search);
  let update = false;
  keys.forEach(k => {
    if (params.has(k)) {
      update = true;
      params.delete(k);
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const getRangeFromURL = (): number | TimeRange => {
  const timeRange = getURLQueryArgumentAsNumber(QueryArgument.TimeRange);
  const startTime = getURLQueryArgumentAsNumber(QueryArgument.StartTime);
  const endTime = getURLQueryArgumentAsNumber(QueryArgument.EndTime);
  if (timeRange) {
    return timeRange;
  } else if (startTime && endTime) {
    return { from: startTime, to: endTime };
  }
  return DEFAULT_TIME_RANGE;
};

export const getFiltersFromURL = (columns: Column[]) => {
  const filters: Filter[] = [];
  columns
    .filter(col => col.filterType !== FilterType.NONE)
    .forEach(col => {
      const colFilterValues = getURLQueryArgument(col.id)?.split(SPLIT_FILTER_CHAR) ?? [];
      if (!_.isEmpty(colFilterValues)) {
        const filterValues: FilterValue[] = [];
        colFilterValues.forEach(paramValue => {
          const value = createFilterValue(col.filterType, paramValue);
          if (value) {
            filterValues.push(value);
          }
        });
        if (!_.isEmpty(filterValues)) {
          filters.push({
            colId: col.id,
            values: filterValues
          });
        }
      }
    });
  return filters;
};

export const getQueryOptionsFromURL = (): QueryOptions => {
  return {
    match: stringToMatch[getURLQueryArgument(QueryArgument.Match) ?? DEFAULT_MATCH] ?? DEFAULT_MATCH,
    limit: getURLQueryArgumentAsNumber(QueryArgument.Limit) ?? DEFAULT_LIMIT,
    reporter: flowdirToReporter[getURLQueryArgument(ColumnsId.flowdir) ?? DEFAULT_FLOWDIR]
  };
};

export const getPathWithParams = (pathName: string) => {
  return `${pathName}?${new URLSearchParams(window.location.search).toString()}`;
};
