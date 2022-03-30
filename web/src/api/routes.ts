import axios from 'axios';
import { getURLParams, QueryArguments } from '../utils/router';
import { Record } from './ipfix';
import { calculateMatrixTotals, parseStream, StreamResult, TopologyMetrics } from './loki';
import { Config } from '../model/config';

const host = '/api/proxy/plugin/network-observability-plugin/backend/';

export const getFlows = (params: QueryArguments): Promise<Record[]> => {
  return axios.get(host + '/api/loki/flows', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data.result as StreamResult[]).flatMap(r => parseStream(r));
  });
};

export const getExportFlowsURL = (params: QueryArguments, filteredColumns?: string[]): string => {
  const urlParams = getURLParams(params);
  urlParams.set('format', 'csv');
  if (filteredColumns) {
    urlParams.set('columns', String(filteredColumns));
  }
  return `${host}api/loki/export?${urlParams.toString()}`;
};

export const getNamespaces = (): Promise<string[]> => {
  return axios.get(host + '/api/resources/namespaces').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getResources = (namespace: string, kind: string): Promise<string[]> => {
  return axios.get(`${host}/api/resources/namespace/${namespace}/kind/${kind}/names`).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getTopology = (params: QueryArguments): Promise<TopologyMetrics[]> => {
  return axios.get(host + '/api/loki/topology', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data.result as TopologyMetrics[]).flatMap(r => calculateMatrixTotals(r));
  });
};

export const getConfig = (): Promise<Config> => {
  return axios
    .get(host + '/api/frontend-config')
    .then(r => {
      if (r.status >= 400) {
        throw Error(`${r.statusText} [code=${r.status}]`);
      }
      return r.data;
    })
    .catch(err => {
      console.log(err);
    })
    .then(c => {
      if (c != undefined) {
        c.portNaming.portNames = new Map(Object.entries(c.portNaming.portNames));
      }
      return c;
    });
};
