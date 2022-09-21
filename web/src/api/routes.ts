import axios from 'axios';
import { buildExportQuery } from '../model/export-query';
import { FlowQuery, MetricFunction } from '../model/flow-query';
import {
  AggregatedQueryResponse,
  calculateMatrixTotals,
  parseStream,
  RecordsResult,
  StreamResult,
  Metrics,
  MetricsResult
} from './loki';
import { Config, defaultConfig } from '../model/config';
import { ContextSingleton } from '../utils/context';

export const getFlows = (params: FlowQuery): Promise<RecordsResult> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/flows', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    const aggQR: AggregatedQueryResponse = r.data;
    return {
      records: (aggQR.result as StreamResult[]).flatMap(r => parseStream(r)),
      stats: aggQR.stats
    };
  });
};

export const getExportFlowsURL = (params: FlowQuery, columns?: string[]): string => {
  const exportQuery = buildExportQuery(params, columns);
  return `${ContextSingleton.getHost()}api/loki/export?${exportQuery}`;
};

export const getNamespaces = (): Promise<string[]> => {
  return axios.get(ContextSingleton.getHost() + '/api/resources/namespaces').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getResources = (namespace: string, kind: string): Promise<string[]> => {
  const url = namespace
    ? `${ContextSingleton.getHost()}/api/resources/namespace/${namespace}/kind/${kind}/names`
    : `${ContextSingleton.getHost()}/api/resources/kind/${kind}/names`;
  return axios.get(url).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getMetrics = (params: FlowQuery): Promise<MetricsResult> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/metrics', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    const aggQR: AggregatedQueryResponse = r.data;
    const metrics = (aggQR.result as Metrics[]).flatMap(r =>
      calculateMatrixTotals(r, params.function as MetricFunction)
    );
    return {
      metrics: metrics.filter(m => !m.metric.app),
      appMetrics: metrics.find(m => m.metric.app),
      stats: aggQR.stats
    };
  });
};

export const getConfig = (): Promise<Config> => {
  return axios.get(ContextSingleton.getHost() + '/api/frontend-config').then(r => {
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

export const getLokiStatusReady = (): Promise<string> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/status/ready').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getLokiStatusMetrics = (): Promise<string> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/status/metrics').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getLokiBuildInfo = (): Promise<unknown> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/buildinfo').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getLimits = (): Promise<unknown> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/config/limits').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};
