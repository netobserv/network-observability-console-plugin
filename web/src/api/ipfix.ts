/* eslint-disable max-len */
import { TFunction } from 'i18next';
import { RecordType } from '../model/flow-query';

// Please keep this file documented: it is used in doc generation
// To regenerate doc, run `make generate-doc` - and also check this page:
// https://github.com/netobserv/network-observability-operator/blob/main/docs/GeneratingAsciidocAPI.md#generate-asciidoc-for-flows-json-format-reference

export interface Record {
  labels: Labels;
  key: number;
  fields: Fields;
}

export const getRecordValue = (record: Record, fieldOrLabel: string, defaultValue?: string | number) => {
  /* TODO: fix following behavior:
   * Check if field exists first since /flow endpoint return fields as labels when using filters
   * This is mandatory to ensure fields types
   */
  if (record.fields[fieldOrLabel as keyof Fields] !== undefined) {
    return record.fields[fieldOrLabel as keyof Fields];
  }
  // check if label exists
  if (record.labels[fieldOrLabel as keyof Labels] !== undefined) {
    return record.labels[fieldOrLabel as keyof Labels];
  }
  // fallback on default
  return defaultValue;
};

export interface Labels {
  /** Source namespace */
  SrcK8S_Namespace?: string;
  /** Destination namespace */
  DstK8S_Namespace?: string;
  /** Source owner, such as Deployment, StatefulSet, etc. */
  SrcK8S_OwnerName?: string;
  /** Destination owner, such as Deployment, StatefulSet, etc. */
  DstK8S_OwnerName?: string;
  /** Kind of the source matched Kubernetes object, such as Pod, Service, etc. */
  SrcK8S_Type?: string;
  /** Kind of the destination matched Kubernetes object, such as Pod name, Service name, etc. */
  DstK8S_Type?: string;
  /** Flow direction from the node observation point*/
  FlowDirection?: FlowDirection;
  /** Type of record: 'flowLog' for regular flow logs, or 'allConnections',
   * 'newConnection', 'heartbeat', 'endConnection' for conversation tracking */
  _RecordType?: RecordType;
}

export enum FlowDirection {
  /** Incoming traffic, from the node observation point */
  Ingress = '0',
  /** Outgoing traffic, from the node observation point */
  Egress = '1',
  /** Inner traffic, with the same source and destination node */
  Inner = '2'
}

export const getDirectionDisplayString = (value: FlowDirection, t: TFunction) => {
  return value === FlowDirection.Ingress
    ? t('Ingress')
    : value === FlowDirection.Egress
    ? t('Egress')
    : value === FlowDirection.Inner
    ? t('Inner')
    : t('n/a');
};

export enum IfDirection {
  /** Incoming traffic, from the network interface observation point */
  Ingress = '0',
  /** Outgoing traffic, from the network interface observation point */
  Egress = '1'
}

export interface Fields {
  /** Source IP address (ipv4 or ipv6) */
  SrcAddr?: string;
  /** Destination IP address (ipv4 or ipv6) */
  DstAddr?: string;
  /** Source MAC address */
  SrcMac?: string;
  /** Destination MAC address */
  DstMac?: string;
  /** Name of the source matched Kubernetes object, such as Pod name, Service name, etc. */
  SrcK8S_Name?: string;
  /** Name of the destination matched Kubernetes object, such as Pod name, Service name, etc. */
  DstK8S_Name?: string;
  /** Source port */
  SrcPort?: number;
  /** Destination port */
  DstPort?: number;
  /** Kind of the source Kubernetes owner, such as Deployment, StatefulSet, etc. */
  SrcK8S_OwnerType?: string;
  /** Kind of the destination Kubernetes owner, such as Deployment, StatefulSet, etc. */
  DstK8S_OwnerType?: string;
  /** Source node IP */
  SrcK8S_HostIP?: string;
  /** Destination node IP */
  DstK8S_HostIP?: string;
  /** Source node name */
  SrcK8S_HostName?: string;
  /** Destination node name */
  DstK8S_HostName?: string;
  /** Source zone */
  SrcK8S_Zone?: string;
  /** Destination zone */
  DstK8S_Zone?: string;
  /** Cluster name */
  K8S_ClusterName?: string;
  /** L4 protocol */
  Proto?: number;
  /** Network interface array */
  Interfaces?: string[];
  /** Flow direction array from the network interface observation point */
  IfDirections?: IfDirection[];
  /** Network Events */
  NetworkEvents?: string[];
  /** Logical OR combination of unique TCP flags comprised in the flow, as per RFC-9293, with additional custom flags to represent the following per-packet combinations: SYN+ACK (0x100), FIN+ACK (0x200) and RST+ACK (0x400). */
  Flags?: number;
  /** Number of packets */
  Packets?: number;
  /** In conversation tracking, A to B packets counter per conversation */
  Packets_AB?: number;
  /** In conversation tracking, B to A packets counter per conversation */
  Packets_BA?: number;
  /** Number of bytes */
  Bytes?: number;
  /** In conversation tracking, A to B bytes counter per conversation */
  Bytes_AB?: number;
  /** In conversation tracking, B to A bytes counter per conversation */
  Bytes_BA?: number;
  /** Differentiated Services Code Point Value  */
  Dscp?: number;
  /** ICMP type */
  IcmpType?: number;
  /** ICMP code */
  IcmpCode?: number;
  /** Pkt TCP state for drops */
  PktDropLatestState?: string;
  /** Pkt cause for drops */
  PktDropLatestDropCause?: string;
  /** Pkt TCP flags for drops */
  PktDropLatestFlags?: number;
  /** Number of packets dropped by the kernel */
  PktDropPackets?: number;
  /** In conversation tracking, A to B packets dropped counter per conversation */
  PktDropPackets_AB?: number;
  /** In conversation tracking, B to A packets dropped counter per conversation */
  PktDropPackets_BA?: number;
  /** Number of bytes dropped by the kernel */
  PktDropBytes?: number;
  /** In conversation tracking, A to B bytes dropped counter per conversation */
  PktDropBytes_AB?: number;
  /** In conversation tracking, B to A bytes dropped counter per conversation */
  PktDropBytes_BA?: number;
  /** DNS record id */
  DnsId?: number;
  /** DNS flags for DNS record */
  DnsFlags?: number;
  /** Parsed DNS header RCODEs name */
  DnsFlagsResponseCode?: string;
  /** Calculated time between response and request, in milliseconds */
  DnsLatencyMs?: number;
  /** Error number returned from DNS tracker ebpf hook function */
  DnsErrno?: number;
  /** Start timestamp of this flow, in milliseconds */
  TimeFlowStartMs?: number;
  /** End timestamp of this flow, in milliseconds */
  TimeFlowEndMs?: number;
  /** Timestamp when this flow was received and processed by the flow collector, in seconds */
  TimeReceived?: number;
  /** TCP smoothed Round Trip Time (sRTT) in nanoseconds */
  TimeFlowRttNs?: number;
  /** In conversation tracking, the conversation identifier */
  _HashId?: string;
  /** In conversation tracking, a flag identifying the first flow */
  _IsFirst?: string;
  /** In conversation tracking, a counter of flow logs per conversation */
  numFlowLogs?: number;
}

export type Field = keyof Fields | keyof Labels;
