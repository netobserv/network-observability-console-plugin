import axios from 'axios';
import { LokiResponse, ParsedStream, parseStream } from './loki';

const host = '/api/proxy/namespace/network-observability/service/network-observability-plugin:9001';

export const getFlows = (): Promise<ParsedStream[]> => {
  return axios.get(host + '/api/loki/flows', {}).then(r => {
    if (r.status >= 400) {
      throw new Error(`${r.statusText} [code=${r.status}]`);
    }
    return (r.data.data as LokiResponse).result.flatMap(r => parseStream(r));
  });
};
