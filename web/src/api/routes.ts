import axios from 'axios';
import { buildExportQuery } from '../model/export-query';
import { FlowQuery, MetricFunction } from '../model/flow-query';
import { Record } from './ipfix';
import { calculateMatrixTotals, parseStream, StreamResult, TopologyMetrics } from './loki';
import { Config, defaultConfig } from '../model/config';
import { TimeRange } from '../utils/datetime';

const host = '/api/proxy/plugin/network-observability-plugin/backend/';

export const getFlows = (params: FlowQuery): Promise<Record[]> => {
  return axios.get(host + '/api/loki/flows', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data.result as StreamResult[]).flatMap(r => parseStream(r));
  });
};

export const getExportFlowsURL = (params: FlowQuery, columns?: string[]): string => {
  const exportQuery = buildExportQuery(params, columns);
  return `${host}api/loki/export?${exportQuery}`;
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

export const getTopology = (params: FlowQuery, range: number | TimeRange): Promise<TopologyMetrics[]> => {
  return axios.get(host + '/api/loki/topology', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data.result as TopologyMetrics[]).flatMap(r =>
      calculateMatrixTotals(r, params.function as MetricFunction, range)
    );
  });
};

export const getConfig = (): Promise<Config> => {
  return axios.get(host + '/api/frontend-config').then(r => {
    if (r.status >= 400) {
      throw Error(`${r.statusText} [code=${r.status}]`);
    }
    if (!r.data) {
      return defaultConfig;
    }
    return <Config>{
      portNaming: {
        enable: r.data.portNaming.enable ?? defaultConfig.portNaming.enable,
        portNames: r.data.portNaming.portNames
          ? new Map(Object.entries(r.data.portNaming.portNames))
          : defaultConfig.portNaming.portNames
      }
    };
  });
};
