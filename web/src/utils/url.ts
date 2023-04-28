import { createBrowserHistory } from 'history';
import _ from 'lodash';

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
  PacketLoss = 'packetLoss',
  RecordType = 'recordType',
  Reporter = 'reporter',
  MetricFunction = 'function',
  MetricType = 'type'
}
export type URLParams = { [k in URLParam]?: unknown };

export const history = createBrowserHistory();

export const hasEmptyParams = () => {
  return _.isEmpty(window.location.search);
};

export const getURLParams = () => {
  return new URLSearchParams(window.location.search);
};

export const getURLParam = (arg: URLParam) => {
  return getURLParams().get(arg);
};

export const getURLParamAsNumber = (arg: URLParam) => {
  const q = getURLParam(arg);
  if (q && !isNaN(Number(q))) {
    return Number(q);
  }
  return null;
};

export const setURLParams = (params: string) => {
  const url = new URL(window.location.href);
  history.push(`${url.pathname}?${params}${url.hash}`);
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

export const clearURLParams = () => {
  const url = new URL(window.location.href);
  console.info('clearing url parameters ' + url);
  history.push(url.pathname);
};

export const getPathWithParams = (pathName = '') => {
  return `${pathName}?${new URLSearchParams(window.location.search).toString()}`;
};
