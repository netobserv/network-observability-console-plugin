import { createBrowserHistory } from 'history';
import * as _ from 'lodash';
import { Column, ColumnsId } from './columns';
import { createFilterValue, Filter, FilterType, FilterValue } from './filters';
import { TimeRange } from './datetime';
import { QueryOptions, Reporter } from '../model/query-options';

const SPLIT_FILTER_CHAR = ',';
const DEFAULT_TIME_RANGE = 300;
const DEFAULT_LIMIT = 100;
const DEFAULT_FLOWDIR = '0';
export const NETFLOW_TRAFFIC_PATH = '/netflow-traffic';

export enum QueryArgument {
  StartTime = 'startTime',
  EndTime = 'endTime',
  TimeRange = 'timeRange',
  RefreshInterval = 'refresh',
  Limit = 'limit'
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

const flowdirToReporter: { [flowdir: string]: Reporter } = {
  '0': 'destination',
  '1': 'source',
  '': 'both'
};
const reporterToFlowdir = _.invert(flowdirToReporter);

export const buildQueryArguments = (
  filters: Filter[],
  range: number | TimeRange,
  opts: QueryOptions
): QueryArguments => {
  // Note: at the moment the browser query params and API query params are tied together;
  // we may want to decouple them in the future.
  const params: QueryArguments = {};
  _.each(filters, (f: Filter) => {
    params[f.colId] = f.values.map(value => value.v);
  });
  if (range) {
    if (typeof range === 'number') {
      params[QueryArgument.TimeRange] = range;
    } else if (typeof range === 'object') {
      params[QueryArgument.StartTime] = range.from.toString();
      params[QueryArgument.EndTime] = range.to.toString();
    }
  }
  params[ColumnsId.flowdir] = reporterToFlowdir[opts.reporter];
  params[QueryArgument.Limit] = opts.limit;
  return params;
};

export const setURLQueryArguments = (qa: QueryArguments) => {
  const urlParams = new URLSearchParams();
  _.each(qa, (v, k) => {
    urlParams.set(k, String(v));
  });
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
    limit: getURLQueryArgumentAsNumber(QueryArgument.Limit) ?? DEFAULT_LIMIT,
    reporter: flowdirToReporter[getURLQueryArgument(ColumnsId.flowdir) ?? DEFAULT_FLOWDIR]
  };
};

export const getPathWithParams = (pathName: string) => {
  return `${pathName}?${new URLSearchParams(window.location.search).toString()}`;
};
