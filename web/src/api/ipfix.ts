export interface Record {
  labels: Labels;
  key: number;
  fields: Fields;
}

export interface Labels {
  SrcK8S_Namespace?: string;
  DstK8S_Namespace?: string;
  SrcK8S_OwnerName?: string;
  DstK8S_OwnerName?: string;
  FlowDirection: FlowDirection;
}

export enum FlowDirection {
  Ingress = '0',
  Egress = '1'
}

export interface Fields {
  SrcAddr: string;
  DstAddr: string;
  SrcMac: string;
  DstMac: string;
  SrcK8S_Name?: string;
  DstK8S_Name?: string;
  SrcK8S_Type?: string;
  DstK8S_Type?: string;
  SrcPort: number;
  DstPort: number;
  SrcK8S_OwnerType?: string;
  DstK8S_OwnerType?: string;
  SrcK8S_HostIP?: string;
  DstK8S_HostIP?: string;
  Packets: number;
  Proto: number;
  Bytes: number;
  TimeFlowStart: number;
  TimeFlowEnd: number;
  TimeReceived: number;
}
