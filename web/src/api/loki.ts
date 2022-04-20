import { TimeRange } from '../utils/datetime';
import { MetricFunction } from '../model/flow-query';
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
  DstK8S_HostIP: string;
  SrcAddr: string;
  SrcK8S_Name: string;
  SrcK8S_Namespace: string;
  SrcK8S_OwnerName: string;
  SrcK8S_OwnerType: string;
  SrcK8S_Type: string;
  SrcK8S_HostIP: string;
}

export interface TopologyMetrics {
  metric: TopologyMetric;
  values: (string | number)[][];
  total: number;
}

/* calculate total for selected function
 * loki will return matrix with multiple values (one per step = 60s)
 */
export const calculateMatrixTotals = (tm: TopologyMetrics, mf: MetricFunction, range: number | TimeRange) => {
  let rangeInMinutes: number;
  if (typeof range === 'number') {
    rangeInMinutes = range / 60;
  } else {
    rangeInMinutes = (range.from - range.to) / (1000 * 60);
  }

  tm.total = 0;
  switch (mf) {
    case 'max':
      tm.total = Math.max(...tm.values.map(v => Number(v[1])));
      break;
    case 'avg':
    case 'rate':
      tm.values.forEach(v => (tm.total += Number(v[1])));
      tm.total = tm.total / rangeInMinutes;
      break;
    case 'sum':
    default:
      tm.values.forEach(v => (tm.total += Number(v[1])));
      break;
  }
  return tm;
};
