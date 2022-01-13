import { createBrowserHistory } from 'history';
import * as _ from 'lodash';
import { Filter } from './columns';
import { TimeRange } from './datetime';

export type QueryParams = { [k: string]: unknown };
export const history = createBrowserHistory();

export const getQueryArgument = (arg: string) => {
  return new URLSearchParams(window.location.search).get(arg);
};

export const getFiltersParams = (filters: Filter[], range: number | TimeRange): URLSearchParams => {
  const queryArguments: QueryParams = {};
  _.each(filters, (f: Filter) => {
    queryArguments[f.colId] = f.values.map(value => value.v);
  });
  if (range) {
    if (typeof range === 'number') {
      queryArguments['timeRange'] = range;
    } else if (typeof range === 'object') {
      queryArguments['startTime'] = range.from.toString();
      queryArguments['endTime'] = range.to.toString();
    }
  }
  const params = new URLSearchParams(window.location.search);
  _.each(queryArguments, (v, k) => {
    if (params.get(k) !== v) {
      params.set(k, String(v));
    }
  });
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

export const removeQueryArguments = (keys: string[]) => {
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
