import axios from 'axios';
import { Config, defaultConfig } from '../model/config';
import { buildExportQuery } from '../model/export-query';
import { FlowQuery } from '../model/flow-query';
import { ContextSingleton } from '../utils/context';
import { TimeRange } from '../utils/datetime';
import { parseMetrics } from '../utils/metrics';
import { AlertsResult, SilencedAlert } from './alert';
import {
  AggregatedQueryResponse,
  parseStream,
  RawTopologyMetrics,
  RecordsResult,
  StreamResult,
  TopologyResult
} from './loki';

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

export const getAlerts = (): Promise<AlertsResult> => {
  return axios.get('/api/prometheus/api/v1/rules?type=alert').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getSilencedAlerts = (): Promise<SilencedAlert[]> => {
  return axios.get('/api/alertmanager/api/v2/silences').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getExportFlowsURL = (params: FlowQuery, columns?: string[]): string => {
  const exportQuery = buildExportQuery(params, columns);
  return `${ContextSingleton.getHost()}/api/loki/export?${exportQuery}`;
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

export const getTopology = (params: FlowQuery, range: number | TimeRange): Promise<TopologyResult> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/topology', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    const aggQR: AggregatedQueryResponse = r.data;
    const metrics = parseMetrics(
      aggQR.result as RawTopologyMetrics[],
      range,
      params.scope!,
      aggQR.unixTimestamp,
      aggQR.isMock
    );
    return { metrics: metrics, stats: aggQR.stats };
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
      recordTypes: r.data.recordTypes,
      portNaming: {
        enable: r.data.portNaming.enable ?? defaultConfig.portNaming.enable,
        portNames: r.data.portNaming.portNames
          ? new Map(Object.entries(r.data.portNaming.portNames))
          : defaultConfig.portNaming.portNames
      },
      quickFilters: r.data.quickFilters,
      alertNamespaces: r.data.alertNamespaces,
      sampling: r.data.sampling
    };
  });
};

export const getLokiReady = (): Promise<string> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/ready').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getMetrics = (): Promise<string> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/metrics').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getBuildInfo = (): Promise<unknown> => {
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
