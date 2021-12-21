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

export interface ParsedStream {
  labels: { [key: string]: string };
  value: ParsedStreamValue;
}

export interface ParsedStreamValue {
  timestamp: number;
  IPFIX: IPFIXStream;
}

export interface IPFIXStream {
  SrcAddr: string;
  DstAddr: string;
  SrcPod: string;
  DstPod: string;
  SrcPort: number;
  DstPort: number;
  Packets: number;
  Proto: number;
  Bytes: number;
}

export const parseStream = (raw: StreamResult): ParsedStream[] => {
  const values = raw.values.map(v => ({
    timestamp: +v[0].slice(0, 13),
    IPFIX: JSON.parse(v[1])
  }));
  // making each value independent make sorting and filtering easier
  return values.map(v => ({ labels: raw.stream, value: v }));
};
