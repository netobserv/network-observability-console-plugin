import * as _ from 'lodash';

export interface LokiQuery {
  query: string;
  limit?: number;
  start?: number;
  end?: number;
}

export interface LokiResponse {
  resultType: string;
  result: LokiResult;
  stats: LokiStats;
}

export interface LokiStats {}

// LokiResult is an union type of potential other types depending on resultType
export type LokiResult = StreamResult[];

export type StreamResult = {
  stream: { [key: string]: string };
  values: string[][];
};

export interface Record {
  labels: Labels;
  key: string;
  timestamp: number;
  fields: Fields;
}

export interface Labels {
  SrcNamespace?: string;
  DstNamespace?: string;
}

export interface Fields {
  SrcAddr: string;
  DstAddr: string;
  SrcPod?: string;
  DstPod?: string;
  SrcPort: number;
  DstPort: number;
  Packets: number;
  Proto: number;
  Bytes: number;
}

export const parseStream = (raw: StreamResult): Record[] => {
  return raw.values.map(v => {
    const fields = JSON.parse(v[1]) as Fields;
    return {
      labels: raw.stream as unknown as Labels,
      key: _.uniqueId('flow-'),
      timestamp: +v[0].slice(0, 13),
      fields: fields
    };
  });
};
