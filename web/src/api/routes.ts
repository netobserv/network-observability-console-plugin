import axios from 'axios';
import { getFiltersParams } from '../utils/router';
import { Filter } from '../utils/columns';
import { LokiResponse, ParsedStream, parseStream } from './loki';

const host = '/api/proxy/namespace/network-observability/service/network-observability-plugin:9001';

export const getFlows = (filters?: Filter[]): Promise<ParsedStream[]> => {
  return axios.get(host + '/api/loki/flows', { params: getFiltersParams(filters) }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data as LokiResponse).result.flatMap(r => parseStream(r));
  });
};
