import axios from 'axios';
import { QueryParams } from '../utils/router';
import { LokiResponse, Record, parseStream } from './loki';

const host = '/api/proxy/namespace/network-observability/service/network-observability-plugin:9001';

export const getFlows = (params: QueryParams): Promise<Record[]> => {
  return axios.get(host + '/api/loki/flows', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data as LokiResponse).result.flatMap(r => parseStream(r));
  });
};
