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

export interface LokiStats {

}

// LokiResult is an union type of potential other types depending on resultType
export type LokiResult = StreamResult[];

export type StreamResult = {
  stream: {[ key: string ]: string },
  values: string[][]
}

export interface ParsedStream {
  labels: {[ key: string ]: string };
  values: ParsedStreamValue[];
}

export interface ParsedStreamValue {
  timestamp: number;
  blob: string; // TODO: expand to IPFIX fields
}

export const parseStream = (raw: StreamResult): ParsedStream => {
  return {
    labels: raw.stream,
    values: raw.values.map(v => ({
      timestamp: +v[0],
      blob: v[1]
    }))
  };
};
