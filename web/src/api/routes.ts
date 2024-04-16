import axios from 'axios';
import { Config, defaultConfig } from '../model/config';
import { buildExportQuery } from '../model/export-query';
import { FlowQuery, FlowScope, isTimeMetric } from '../model/flow-query';
import { ContextSingleton } from '../utils/context';
import { TimeRange } from '../utils/datetime';
import { parseTopologyMetrics, parseGenericMetrics } from '../utils/metrics';
import { AlertsResult, SilencedAlert } from './alert';
import { Field } from './ipfix';
import {
  AggregatedQueryResponse,
  GenericMetricsResult,
  parseStream,
  RawTopologyMetrics,
  RecordsResult,
  Stats,
  StreamResult,
  FlowMetricsResult
} from './loki';

export const getFlowRecords = (params: FlowQuery): Promise<RecordsResult> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/flow/records', { params }).then(r => {
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

export const getClusters = (): Promise<string[]> => {
  return axios.get(ContextSingleton.getHost() + '/api/resources/clusters').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};

export const getZones = (): Promise<string[]> => {
  return axios.get(ContextSingleton.getHost() + '/api/resources/zones').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
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

export const getFlowMetrics = (params: FlowQuery, range: number | TimeRange): Promise<FlowMetricsResult> => {
  return getFlowMetricsGeneric(params, res => {
    return parseTopologyMetrics(
      res.result as RawTopologyMetrics[],
      range,
      params.aggregateBy as FlowScope,
      res.unixTimestamp,
      !isTimeMetric(params.type),
      res.dataSources.includes('mock')
    );
  });
};

export const getFlowGenericMetrics = (params: FlowQuery, range: number | TimeRange): Promise<GenericMetricsResult> => {
  return getFlowMetricsGeneric(params, res => {
    return parseGenericMetrics(
      res.result as RawTopologyMetrics[],
      range,
      params.aggregateBy as Field,
      res.unixTimestamp,
      !isTimeMetric(params.type),
      res.dataSources.includes('mock')
    );
  });
};

const getFlowMetricsGeneric = <T>(
  params: FlowQuery,
  mapper: (raw: AggregatedQueryResponse) => T
): Promise<{ metrics: T; stats: Stats }> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/flow/metrics', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    const aggQR: AggregatedQueryResponse = r.data;
    return { metrics: mapper(aggQR), stats: aggQR.stats };
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
    console.debug('BuildVersion:', r.data.buildVersion, 'BuildDate:', r.data.buildDate);
    return <Config>{
      buildVersion: r.data.buildVersion,
      buildDate: r.data.buildDate,
      recordTypes: r.data.recordTypes,
      panels: r.data.panels,
      columns: r.data.columns,
      portNaming: {
        enable: r.data.portNaming.enable ?? defaultConfig.portNaming.enable,
        portNames: r.data.portNaming.portNames
          ? new Map(Object.entries(r.data.portNaming.portNames))
          : defaultConfig.portNaming.portNames
      },
      filters: r.data.filters,
      quickFilters: r.data.quickFilters,
      alertNamespaces: r.data.alertNamespaces,
      sampling: r.data.sampling,
      features: r.data.features || defaultConfig.features,
      deduper: {
        mark: r.data.deduper.mark ?? defaultConfig.deduper.mark,
        merge: r.data.deduper.merge ?? defaultConfig.deduper.merge
      },
      fields: r.data.fields
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

export const getLokiMetrics = (): Promise<string> => {
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

export const getIngesterMaxChunkAge = (): Promise<string> => {
  return axios.get(ContextSingleton.getHost() + '/api/loki/config/ingester/max_chunk_age').then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return r.data;
  });
};
