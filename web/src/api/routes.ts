import axios from 'axios';
import { QueryArguments } from '../utils/router';
import { Record } from './ipfix';
import { LokiResponse, parseStream } from './loki';

const host = '/api/proxy/plugin/network-observability-plugin/backend/';

export const getFlows = (params: QueryArguments): Promise<Record[]> => {
  return axios.get(host + '/api/loki/flows', { params }).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data as LokiResponse).result.flatMap(r => parseStream(r));
  });
};
