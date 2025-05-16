/* eslint-disable max-len */
import * as _ from 'lodash';
import { Column, ColumnConfigDef, ColumnsId, getDefaultColumns } from '../../utils/columns';
import { FieldConfig } from '../../utils/fields';

export const ColumnConfigSampleDefs = [
  {
    id: 'StartTime',
    name: 'Start Time',
    tooltip:
      'Time of the first packet observed. Unlike End Time, it is not used in queries to select records in an interval.',
    field: 'TimeFlowStartMs',
    default: false,
    width: 15
  },
  {
    id: 'EndTime',
    name: 'End Time',
    tooltip: 'Time of the last packet observed. This is what is used in queries to select records in an interval.',
    field: 'TimeFlowEndMs',
    default: true,
    width: 15
  },
  {
    id: 'RecordType',
    name: 'Event / Type',
    field: '_RecordType',
    filter: 'type',
    default: true,
    width: 15
  },
  {
    id: '_HashId',
    name: 'Conversation Id',
    field: '_HashId',
    filter: 'id',
    default: true,
    width: 15
  },
  {
    id: 'SrcK8S_Name',
    group: 'Source',
    name: 'Name',
    tooltip: 'The source name of the related kubernetes resource.',
    docURL: 'http://kubernetes.io/docs/user-guide/identifiers#names',
    field: 'SrcK8S_Name',
    filter: 'src_name',
    calculated: 'kubeObject(SrcK8S_Type,SrcK8S_Namespace,SrcK8S_Name,0)',
    default: true,
    width: 15
  },
  {
    id: 'SrcK8S_Type',
    group: 'Source',
    name: 'Kind',
    tooltip: 'The  kind of the related kubernetes resource. Examples:\n      - Pod\n      - Service\n      - Node',
    field: 'SrcK8S_Type',
    filter: 'src_kind',
    default: false,
    width: 10
  },
  {
    id: 'SrcK8S_OwnerName',
    group: 'Source',
    name: 'Owner',
    tooltip: 'The source owner name of the related kubernetes resource.',
    docURL: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/',
    field: 'SrcK8S_OwnerName',
    filter: 'src_owner_name',
    calculated: 'kubeObject(SrcK8S_OwnerType,SrcK8S_Namespace,SrcK8S_OwnerName,0)',
    default: false,
    width: 15
  },
  {
    id: 'SrcK8S_OwnerType',
    group: 'Source',
    name: 'Owner Kind',
    tooltip:
      'The  owner kind of the related kubernetes resource. Examples:\n      - Deployment\n      - StatefulSet\n      - DaemonSet\n      - Job\n      - CronJob',
    field: 'SrcK8S_OwnerType',
    filter: 'src_kind',
    default: false,
    width: 10
  },
  {
    id: 'SrcK8S_Namespace',
    group: 'Source',
    name: 'Namespace',
    tooltip: 'The source namespace of the related kubernetes resource.',
    docURL: 'http://kubernetes.io/docs/user-guide/identifiers#namespaces',
    field: 'SrcK8S_Namespace',
    filter: 'src_namespace',
    calculated: `kubeObject('Namespace','',SrcK8S_Namespace,0)`,
    default: true,
    width: 15
  },
  {
    id: 'SrcAddr',
    group: 'Source',
    name: 'IP',
    tooltip: 'The source IP address. Can be either in IPv4 or IPv6 format.',
    field: 'SrcAddr',
    filter: 'src_address',
    default: false,
    width: 10
  },
  {
    id: 'SrcPort',
    group: 'Source',
    name: 'Port',
    tooltip: 'The source port number.',
    field: 'SrcPort',
    filter: 'src_port',
    default: true,
    width: 10
  },
  {
    id: 'SrcMac',
    group: 'Source',
    name: 'MAC',
    tooltip: 'The source MAC address.',
    field: 'SrcMac',
    filter: 'src_mac',
    default: false,
    width: 10
  },
  {
    id: 'SrcK8S_HostIP',
    group: 'Source',
    name: 'Node IP',
    tooltip: 'The source node IP address. Can be either in IPv4 or IPv6 format.',
    field: 'SrcK8S_HostIP',
    filter: 'src_host_address',
    default: false,
    width: 10
  },
  {
    id: 'SrcK8S_HostName',
    group: 'Source',
    name: 'Node Name',
    tooltip: 'The source name of the node running the workload.',
    docURL: 'https://kubernetes.io/docs/concepts/architecture/nodes/',
    field: 'SrcK8S_HostName',
    filter: 'src_host_name',
    calculated: `kubeObject('Node','',SrcK8S_HostName,0)`,
    default: false,
    width: 15
  },
  {
    id: 'SrcK8S_Object',
    group: 'Source',
    name: 'Kubernetes Object',
    calculated: `kubeObject(SrcK8S_Type,SrcK8S_Namespace,SrcK8S_Name,1) or concat(SrcAddr,':',SrcPort)`,
    default: false,
    width: 15
  },
  {
    id: 'SrcK8S_OwnerObject',
    group: 'Source',
    name: 'Owner Kubernetes Object',
    calculated: `kubeObject(SrcK8S_OwnerType,SrcK8S_Namespace,SrcK8S_OwnerName,1)`,
    default: false,
    width: 15
  },
  {
    id: 'SrcAddrPort',
    group: 'Source',
    name: 'IP & Port',
    calculated: `concat(SrcAddr,':',SrcPort)`,
    default: false,
    width: 15
  },
  {
    id: 'SrcZone',
    group: 'Source',
    name: 'Zone',
    field: 'SrcK8S_Zone',
    filter: 'src_zone',
    default: false,
    width: 15,
    feature: 'zones'
  },
  {
    id: 'DstK8S_Name',
    group: 'Destination',
    name: 'Name',
    tooltip: 'The destination name of the related kubernetes resource.',
    docURL: 'http://kubernetes.io/docs/user-guide/identifiers#names',
    field: 'DstK8S_Name',
    filter: 'dst_name',
    calculated: `kubeObject(DstK8S_Type,DstK8S_Namespace,DstK8S_Name,0)`,
    default: true,
    width: 15
  },
  {
    id: 'DstK8S_Type',
    group: 'Destination',
    name: 'Kind',
    tooltip: 'The  kind of the related kubernetes resource. Examples:\n      - Pod\n      - Service\n      - Node',
    field: 'DstK8S_Type',
    filter: 'dst_kind',
    default: false,
    width: 10
  },
  {
    id: 'DstK8S_OwnerName',
    group: 'Destination',
    name: 'Owner',
    tooltip: 'The destination owner name of the related kubernetes resource.',
    docURL: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/',
    field: 'DstK8S_OwnerName',
    filter: 'dst_owner_name',
    calculated: `kubeObject(DstK8S_OwnerType,DstK8S_Namespace,DstK8S_OwnerName,0)`,
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_OwnerType',
    group: 'Destination',
    name: 'Owner Kind',
    tooltip:
      'The  owner kind of the related kubernetes resource. Examples:\n      - Deployment\n      - StatefulSet\n      - DaemonSet\n      - Job\n      - CronJob',
    field: 'DstK8S_OwnerType',
    filter: 'dst_kind',
    default: false,
    width: 10
  },
  {
    id: 'DstK8S_Namespace',
    group: 'Destination',
    name: 'Namespace',
    tooltip: 'The destination namespace of the related kubernetes resource.',
    docURL: 'http://kubernetes.io/docs/user-guide/identifiers#namespaces',
    field: 'DstK8S_Namespace',
    filter: 'dst_namespace',
    calculated: `kubeObject('Namespace','',DstK8S_Namespace,0)`,
    default: true,
    width: 15
  },
  {
    id: 'DstAddr',
    group: 'Destination',
    name: 'IP',
    tooltip: 'The destination IP address. Can be either in IPv4 or IPv6 format.',
    field: 'DstAddr',
    filter: 'dst_address',
    default: false,
    width: 10
  },
  {
    id: 'DstPort',
    group: 'Destination',
    name: 'Port',
    tooltip: 'The destination port number.',
    field: 'DstPort',
    filter: 'dst_port',
    default: true,
    width: 10
  },
  {
    id: 'DstMac',
    group: 'Destination',
    name: 'MAC',
    tooltip: 'The destination MAC address.',
    field: 'DstMac',
    filter: 'dst_mac',
    default: false,
    width: 10
  },
  {
    id: 'DstK8S_HostIP',
    group: 'Destination',
    name: 'Node IP',
    tooltip: 'The destination node IP address. Can be either in IPv4 or IPv6 format.',
    field: 'DstK8S_HostIP',
    filter: 'dst_host_address',
    default: false,
    width: 10
  },
  {
    id: 'DstK8S_HostName',
    group: 'Destination',
    name: 'Node Name',
    tooltip: 'The destination name of the node running the workload.',
    docURL: 'https://kubernetes.io/docs/concepts/architecture/nodes/',
    field: 'DstK8S_HostName',
    filter: 'dst_host_name',
    calculated: `kubeObject('Node','',DstK8S_HostName,0)`,
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_Object',
    group: 'Destination',
    name: 'Kubernetes Object',
    calculated: `kubeObject(DstK8S_Type,DstK8S_Namespace,DstK8S_Name,1) or concat(DstAddr,':',DstPort)`,
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_OwnerObject',
    group: 'Destination',
    name: 'Owner Kubernetes Object',
    calculated: `kubeObject(DstK8S_OwnerType,DstK8S_Namespace,DstK8S_OwnerName,1)`,
    default: false,
    width: 15
  },
  {
    id: 'DstAddrPort',
    group: 'Destination',
    name: 'IP & Port',
    calculated: `concat(DstAddr,':',DstPort)`,
    default: false,
    width: 15
  },
  {
    id: 'DstZone',
    group: 'Destination',
    name: 'Zone',
    field: 'DstK8S_Zone',
    filter: 'dst_zone',
    default: false,
    width: 15,
    feature: 'zones'
  },
  {
    id: 'K8S_Name',
    name: 'Names',
    calculated: '[SrcK8S_Name,DstK8S_Name]',
    default: false,
    width: 15
  },
  {
    id: 'K8S_Type',
    name: 'Kinds',
    calculated: '[SrcK8S_Type,DstK8S_Type]',
    default: false,
    width: 10
  },
  {
    id: 'K8S_OwnerName',
    name: 'Owners',
    calculated: '[SrcK8S_OwnerName,DstK8S_OwnerName]',
    default: false,
    width: 15
  },
  {
    id: 'K8S_OwnerType',
    name: 'Owner Kinds',
    calculated: '[SrcK8S_OwnerType,DstK8S_OwnerType]',
    default: false,
    width: 10
  },
  {
    id: 'K8S_Namespace',
    name: 'Namespaces',
    calculated: '[SrcK8S_Namespace,DstK8S_Namespace]',
    default: false,
    width: 15
  },
  {
    id: 'Addr',
    name: 'IP',
    calculated: '[SrcAddr,DstAddr]',
    default: false,
    width: 10
  },
  {
    id: 'Port',
    name: 'Ports',
    calculated: '[SrcPort,DstPort]',
    default: false,
    width: 10
  },
  {
    id: 'Mac',
    name: 'MAC',
    calculated: '[SrcMac,DstMac]',
    default: false,
    width: 10
  },
  {
    id: 'K8S_HostIP',
    name: 'Node IP',
    calculated: '[SrcK8S_HostIP,DstK8S_HostIP]',
    default: false,
    width: 10
  },
  {
    id: 'K8S_HostName',
    name: 'Node Name',
    calculated: '[SrcK8S_HostName,DstK8S_HostName]',
    default: false,
    width: 15
  },
  {
    id: 'K8S_Object',
    name: 'Kubernetes Objects',
    calculated: '[column.SrcK8S_Object,column.DstK8S_Object]',
    default: false,
    width: 15
  },
  {
    id: 'K8S_OwnerObject',
    name: 'Owner Kubernetes Objects',
    calculated: '[column.SrcK8S_OwnerObject,column.DstK8S_OwnerObject]',
    default: false,
    width: 15
  },
  {
    id: 'AddrPort',
    name: 'IPs & Ports',
    calculated: '[column.SrcAddrPort,column.DstAddrPort]',
    default: false,
    width: 15
  },
  {
    id: 'Proto',
    name: 'Protocol',
    tooltip: 'The value of the protocol number in the IP packet header',
    field: 'Proto',
    filter: 'protocol',
    default: false,
    width: 10
  },
  {
    id: 'FlowDirection',
    name: 'Direction',
    tooltip: 'The direction of the Flow observed at the Node observation point.',
    field: 'FlowDirection',
    filter: 'direction',
    default: false,
    width: 10
  },
  {
    id: 'Interface',
    name: 'Interface',
    tooltip: 'The network interface of the Flow.',
    field: 'Interface',
    filter: 'interface',
    default: false,
    width: 10
  },
  {
    id: 'Bytes',
    name: 'Bytes',
    tooltip: 'The total aggregated number of bytes.',
    field: 'Bytes',
    default: true,
    width: 5
  },
  {
    id: 'Packets',
    name: 'Packets',
    tooltip: 'The total aggregated number of packets.',
    field: 'Packets',
    filter: 'pkt_drop_cause',
    default: true,
    width: 5
  },
  {
    id: 'FlowDuration',
    name: 'Duration',
    tooltip: 'Time elapsed between Start Time and End Time.',
    default: false,
    width: 5
  },
  {
    id: 'TimeFlowRttMs',
    name: 'Flow RTT',
    tooltip: 'TCP smoothed Round Trip Time',
    field: 'TimeFlowRttNs',
    filter: 'time_flow_rtt',
    default: false,
    width: 5
  },
  {
    id: 'CollectionTime',
    name: 'Collection Time',
    tooltip: 'Reception time of the record by the collector.',
    field: 'TimeReceived',
    default: false,
    width: 15
  },
  {
    id: 'CollectionLatency',
    name: 'Collection Latency',
    tooltip: 'Time elapsed between End Time and Collection Time.',
    default: false,
    width: 5
  },
  {
    id: 'DNSId',
    group: 'DNS',
    name: 'DNS Id',
    tooltip: 'DNS request identifier.',
    field: 'DnsId',
    filter: 'dns_id',
    feature: 'dnsTracking',
    default: false,
    width: 5
  },
  {
    id: 'DNSLatency',
    group: 'DNS',
    name: 'DNS Latency',
    tooltip: 'Time elapsed between DNS request and response.',
    field: 'DnsLatencyMs',
    filter: 'dns_latency',
    feature: 'dnsTracking',
    default: false,
    width: 5
  },
  {
    id: 'DNSResponseCode',
    group: 'DNS',
    name: 'DNS Response Code',
    tooltip: 'DNS RCODE name from response header.',
    field: 'DnsFlagsResponseCode',
    filter: 'dns_flag_response_code',
    feature: 'dnsTracking',
    default: false,
    width: 5
  },
  {
    id: 'IcmpType',
    group: 'ICMP',
    name: 'Type',
    tooltip: 'The type of the ICMP message.',
    field: 'IcmpType',
    filter: 'icmp_type',
    default: false,
    width: 10
  },
  {
    id: 'IcmpCode',
    group: 'ICMP',
    name: 'Code',
    tooltip: 'The code of the ICMP message.',
    field: 'IcmpCode',
    filter: 'icmp_code',
    default: false,
    width: 10
  }
] as ColumnConfigDef[];

export const FieldConfigSample = [
  {
    name: 'TimeFlowStartMs',
    type: 'number',
    description: 'Start timestamp of this flow, in milliseconds'
  },
  {
    name: 'TimeFlowEndMs',
    type: 'number',
    description: 'End timestamp of this flow, in milliseconds'
  },
  {
    name: 'TimeReceived',
    type: 'number',
    description: 'Timestamp when this flow was received and processed by the flow collector, in seconds'
  },
  {
    name: 'SrcK8S_Name',
    type: 'string',
    description: 'Name of the source Kubernetes object, such as Pod name, Service name or Node name.'
  },
  {
    name: 'SrcK8S_Type',
    type: 'string',
    description: 'Kind of the source Kubernetes object, such as Pod, Service or Node.',
    lokiLabel: true
  },
  {
    name: 'SrcK8S_OwnerName',
    type: 'string',
    description: 'Name of the source owner, such as Deployment name, StatefulSet name, etc.',
    lokiLabel: true
  },
  {
    name: 'SrcK8S_OwnerType',
    type: 'string',
    description: 'Kind of the source owner, such as Deployment, StatefulSet, etc.'
  },
  {
    name: 'SrcK8S_Namespace',
    type: 'string',
    description: 'Source namespace',
    lokiLabel: true
  },
  {
    name: 'SrcAddr',
    type: 'string',
    description: 'Source IP address (ipv4 or ipv6)'
  },
  {
    name: 'SrcPort',
    type: 'number',
    description: 'Source port'
  },
  {
    name: 'SrcMac',
    type: 'string',
    description: 'Source MAC address'
  },
  {
    name: 'SrcK8S_HostIP',
    type: 'string',
    description: 'Source node IP'
  },
  {
    name: 'SrcK8S_HostName',
    type: 'string',
    description: 'Source node name'
  },
  {
    name: 'SrcK8S_Zone',
    type: 'string',
    description: 'Source availability zone',
    lokiLabel: true
  },
  {
    name: 'DstK8S_Name',
    type: 'string',
    description: 'Name of the destination Kubernetes object, such as Pod name, Service name or Node name.'
  },
  {
    name: 'DstK8S_Type',
    type: 'string',
    description: 'Kind of the destination Kubernetes object, such as Pod, Service or Node.',
    lokiLabel: true
  },
  {
    name: 'DstK8S_OwnerName',
    type: 'string',
    description: 'Name of the destination owner, such as Deployment name, StatefulSet name, etc.',
    lokiLabel: true
  },
  {
    name: 'DstK8S_OwnerType',
    type: 'string',
    description: 'Kind of the destination owner, such as Deployment, StatefulSet, etc.'
  },
  {
    name: 'DstK8S_Namespace',
    type: 'string',
    description: 'Destination namespace',
    lokiLabel: true
  },
  {
    name: 'DstAddr',
    type: 'string',
    description: 'Destination IP address (ipv4 or ipv6)'
  },
  {
    name: 'DstPort',
    type: 'number',
    description: 'Destination port'
  },
  {
    name: 'DstMac',
    type: 'string',
    description: 'Destination MAC address'
  },
  {
    name: 'DstK8S_HostIP',
    type: 'string',
    description: 'Destination node IP'
  },
  {
    name: 'DstK8S_HostName',
    type: 'string',
    description: 'Destination node name'
  },
  {
    name: 'DstK8S_Zone',
    type: 'string',
    description: 'Destination availability zone',
    lokiLabel: true
  },
  {
    name: 'K8S_FlowLayer',
    type: 'string',
    description: "Flow layer: 'app' or 'infra'"
  },
  {
    name: 'Proto',
    type: 'number',
    description: 'L4 protocol'
  },
  {
    name: 'Dscp',
    type: 'number',
    description: 'Differentiated Services Code Point (DSCP) value'
  },
  {
    name: 'IcmpType',
    type: 'number',
    description: 'ICMP type'
  },
  {
    name: 'IcmpCode',
    type: 'number',
    description: 'ICMP code'
  },
  {
    name: 'FlowDirection',
    type: 'number',
    description:
      'Flow direction from the node observation point. Can be one of: +\n- 0: Ingress (incoming traffic, from the node observation point) +\n- 1: Egress (outgoing traffic, from the node observation point) +\n- 2: Inner (with the same source and destination node)\n',
    lokiLabel: true
  },
  {
    name: 'IfDirection',
    type: 'number',
    description:
      'Flow direction from the network interface observation point. Can be one of: +\n- 0: Ingress (interface incoming traffic) +\n- 1: Egress (interface outgoing traffic)\n'
  },
  {
    name: 'Interface',
    type: 'string',
    description: 'Network interface'
  },
  {
    name: 'Flags',
    type: 'number',
    description:
      'Logical OR combination of unique TCP flags comprised in the flow, as per RFC-9293, with additional custom flags to represent the following per-packet combinations: +\n- SYN+ACK (0x100) +\n- FIN+ACK (0x200) +\n- RST+ACK (0x400)\n'
  },
  {
    name: 'Bytes',
    type: 'number',
    description: 'Number of bytes'
  },
  {
    name: 'Packets',
    type: 'number',
    description: 'Number of packets'
  },
  {
    name: 'PktDropBytes',
    type: 'number',
    description: 'Number of bytes dropped by the kernel'
  },
  {
    name: 'PktDropPackets',
    type: 'number',
    description: 'Number of packets dropped by the kernel'
  },
  {
    name: 'PktDropLatestState',
    type: 'string',
    description: 'TCP state on last dropped packet',
    filter: 'pkt_drop_state'
  },
  {
    name: 'PktDropLatestDropCause',
    type: 'string',
    description: 'Latest drop cause',
    filter: 'pkt_drop_cause'
  },
  {
    name: 'PktDropLatestFlags',
    type: 'number',
    description: 'TCP flags on last dropped packet'
  },
  {
    name: 'DnsId',
    type: 'number',
    description: 'DNS record id'
  },
  {
    name: 'DnsLatencyMs',
    type: 'number',
    description: 'Time between a DNS request and response, in milliseconds'
  },
  {
    name: 'DnsFlags',
    type: 'number',
    description: 'DNS flags for DNS record'
  },
  {
    name: 'DnsFlagsResponseCode',
    type: 'string',
    description: 'Parsed DNS header RCODEs name'
  },
  {
    name: 'DnsErrno',
    type: 'number',
    description: 'Error number returned from DNS tracker ebpf hook function'
  },
  {
    name: 'TimeFlowRttNs',
    type: 'number',
    description: 'TCP Smoothed Round Trip Time (SRTT), in nanoseconds'
  },
  {
    name: 'K8S_ClusterName',
    type: 'string',
    description: 'Cluster name or identifier',
    lokiLabel: true
  },
  {
    name: '_RecordType',
    type: 'string',
    description:
      "Type of record: 'flowLog' for regular flow logs, or 'newConnection', 'heartbeat', 'endConnection' for conversation tracking",
    lokiLabel: true
  },
  {
    name: '_HashId',
    type: 'string',
    description: 'In conversation tracking, the conversation identifier'
  }
] as FieldConfig[];

// Customize columns order
export const DefaultColumnSample = getDefaultColumns(ColumnConfigSampleDefs, FieldConfigSample);
export const AllSelectedColumnSample = DefaultColumnSample.map(c => {
  c.isSelected = true;
  return c;
});
export const ShuffledColumnSample: Column[] = _.shuffle(DefaultColumnSample);
export function selectOrderedColumnsByIds(ids: ColumnsId[]) {
  return _.cloneDeep(DefaultColumnSample)
    .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id))
    .map(c => {
      c.isSelected = ids.includes(c.id);
      return c;
    });
}
export function filterOrderedColumnsByIds(ids: ColumnsId[]) {
  return selectOrderedColumnsByIds(ids).filter(c => c.isSelected);
}
