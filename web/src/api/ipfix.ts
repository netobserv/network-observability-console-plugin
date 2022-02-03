export interface Record {
  labels: Labels;
  key: number;
  timestamp: number;
  fields: Fields;
}

export interface Labels {
  SrcNamespace?: string;
  DstNamespace?: string;
  SrcWorkload?: string;
  DstWorkload?: string;
}

export enum FlowDirection {
  Ingress = 0,
  Egress = 1
}

export interface Fields {
  SrcAddr: string;
  DstAddr: string;
  SrcMac: string;
  DstMac: string;
  SrcPod?: string;
  DstPod?: string;
  SrcPort: number;
  DstPort: number;
  SrcWorkloadKind?: string;
  DstWorkloadKind?: string;
  SrcHostIP?: string;
  DstHostIP?: string;
  Packets: number;
  Proto: number;
  Bytes: number;
  FlowDirection: FlowDirection;
}
