import { createBrowserHistory } from 'history';
import * as _ from 'lodash';
import { ColumnsId, Filter } from './columns';
import { TimeRange } from './datetime';

export enum QueryArguments {
  StartTime = 'startTime',
  EndTime = 'endTime',
  TimeRange = 'timeRange',
  RefreshInterval = 'refresh'
}
type AnyQueryArgs = ColumnsId | QueryArguments;
export type QueryParams = { [k in AnyQueryArgs]?: unknown };

export const history = createBrowserHistory();

export const getQueryArgument = (arg: AnyQueryArgs) => {
  return new URLSearchParams(window.location.search).get(arg);
};

export const getQueryArgumentAsNumber = (arg: AnyQueryArgs) => {
  const q = new URLSearchParams(window.location.search).get(arg);
  if (q && !isNaN(Number(q))) {
    return Number(q);
  }
  return null;
};

export const getAPIQueryParams = (filters: Filter[], range: number | TimeRange): QueryParams => {
  // Note: at the moment the browser query params and API query params are tied together;
  // we may want to decouple them in the future.
  const params: QueryParams = {};
  _.each(filters, (f: Filter) => {
    params[f.colId] = f.values.map(value => value.v);
  });
  if (range) {
    if (typeof range === 'number') {
      params[QueryArguments.TimeRange] = range;
    } else if (typeof range === 'object') {
      params[QueryArguments.StartTime] = range.from.toString();
      params[QueryArguments.EndTime] = range.to.toString();
    }
  }
  return params;
};

export const setQueryArguments = (newParams: QueryParams) => {
  const params = new URLSearchParams(window.location.search);
  let update = false;
  _.each(newParams, (v, k) => {
    if (params.get(k) !== v) {
      update = true;
      params.set(k, String(v));
    }
  });
  if (update) {
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const removeQueryArguments = (keys: AnyQueryArgs[]) => {
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
