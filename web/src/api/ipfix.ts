import { RecordType } from '../model/flow-query';

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
  _RecordType?: RecordType;
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
  SrcK8S_HostName?: string;
  DstK8S_HostName?: string;
  Packets: number;
  Packets_AB?: number;
  Packets_BA?: number;
  Proto: number;
  Bytes: number;
  Bytes_AB?: number;
  Bytes_BA?: number;
  TimeFlowStartMs: number;
  TimeFlowEndMs: number;
  TimeReceived: number;
  _HashId?: string;
  _IsFirst?: string;
  numFlowLogs?: number;
  Interface?: string;
}
