import { cyrb53 } from '../utils/hash';
import { Fields, Labels, Record } from './ipfix';

export interface LokiResponse {
  resultType: string;
  result: StreamResult[] | TopologyMetrics[];
  stats: LokiStats;
}

export interface LokiStats {}

export type StreamResult = {
  stream: { [key: string]: string };
  values: string[][];
};

export const parseStream = (raw: StreamResult): Record[] => {
  return raw.values.map(v => {
    const fields = JSON.parse(v[1]) as Fields;
    return {
      labels: raw.stream as unknown as Labels,
      key: cyrb53(v.join(',')),
      timestamp: +v[0].slice(0, 13),
      fields: fields
    };
  });
};

export interface TopologyMetric {
  DstAddr: string;
  DstK8S_Name: string;
  DstK8S_Namespace: string;
  DstK8S_OwnerName: string;
  DstK8S_OwnerType: string;
  DstK8S_Type: string;
  SrcAddr: string;
  SrcK8S_Name: string;
  SrcK8S_Namespace: string;
  SrcK8S_OwnerName: string;
  SrcK8S_OwnerType: string;
  SrcK8S_Type: string;
}

export interface TopologyMetrics {
  metric: TopologyMetric;
  values: (string | number)[][];
  total: number;
}

export const calculateMatrixTotals = (tm: TopologyMetrics) => {
  tm.total = 0;
  tm.values.forEach(v => (tm.total += Number(v[1])));
  return tm;
};
