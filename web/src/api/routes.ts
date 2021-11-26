import axios from "axios";
import { LokiResponse, ParsedStream, parseStream } from "./loki";

// TODO: setup env file to switch between in-cluster access and on-host (dev mode) access ?
// TODO: use console proxying, cf https://issues.redhat.com/browse/CONSOLE-2892 / https://github.com/openshift/console/pull/10215
// const host = "/api/proxy/namespace/network-observability/service/network-observability-plugin:9001"
const host = "http://localhost:9001";

export const getFlows = (): Promise<ParsedStream[]> => {
  return axios.get(host + '/api/loki/flows', {})
    .then(r => {
      if (r.status >= 400) {
        throw new Error(`${r.statusText} [code=${r.status}]`);
      }
      return (r.data.data as LokiResponse).result.map(r => parseStream(r));
    });
}
