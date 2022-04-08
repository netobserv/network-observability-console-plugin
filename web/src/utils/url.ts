import { createBrowserHistory } from 'history';

export const netflowTrafficPath = '/netflow-traffic';

// React-router query argument (not backend routes)
export enum URLParam {
  StartTime = 'startTime',
  EndTime = 'endTime',
  TimeRange = 'timeRange',
  Filters = 'filters',
  RefreshInterval = 'refresh',
  Limit = 'limit',
  Match = 'match',
  Reporter = 'reporter'
}
export type URLParams = { [k in URLParam]?: unknown };

export const history = createBrowserHistory();

export const getURLParam = (arg: URLParam) => {
  return new URLSearchParams(window.location.search).get(arg);
};

export const getURLParamAsNumber = (arg: URLParam) => {
  const q = new URLSearchParams(window.location.search).get(arg);
  if (q && !isNaN(Number(q))) {
    return Number(q);
  }
  return null;
};

export const setURLParam = (param: URLParam, value: string) => {
  const url = new URL(window.location.href);
  const params = new URLSearchParams(window.location.search);
  params.set(param, value);
  history.push(`${url.pathname}?${params.toString()}${url.hash}`);
};

export const removeURLParam = (param: URLParam) => {
  const params = new URLSearchParams(window.location.search);
  if (params.has(param)) {
    params.delete(param);
    const url = new URL(window.location.href);
    history.replace(`${url.pathname}?${params.toString()}${url.hash}`);
  }
};

export const getPathWithParams = (pathName: string) => {
  return `${pathName}?${new URLSearchParams(window.location.search).toString()}`;
};
