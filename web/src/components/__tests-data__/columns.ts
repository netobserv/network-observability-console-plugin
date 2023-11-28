import * as _ from 'lodash';
import { Column, ColumnsId, getDefaultColumns } from '../../utils/columns';

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
    default: false,
    width: 15
  },
  {
    id: 'SrcK8S_Object',
    group: 'Source',
    name: 'Kubernetes Object',
    default: false,
    width: 15
  },
  {
    id: 'SrcK8S_OwnerObject',
    group: 'Source',
    name: 'Owner Kubernetes Object',
    default: false,
    width: 15
  },
  {
    id: 'SrcAddrPort',
    group: 'Source',
    name: 'IP & Port',
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_Name',
    group: 'Destination',
    name: 'Name',
    tooltip: 'The destination name of the related kubernetes resource.',
    docURL: 'http://kubernetes.io/docs/user-guide/identifiers#names',
    field: 'DstK8S_Name',
    filter: 'dst_name',
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
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_Object',
    group: 'Destination',
    name: 'Kubernetes Object',
    default: false,
    width: 15
  },
  {
    id: 'DstK8S_OwnerObject',
    group: 'Destination',
    name: 'Owner Kubernetes Object',
    default: false,
    width: 15
  },
  {
    id: 'DstAddrPort',
    group: 'Destination',
    name: 'IP & Port',
    default: false,
    width: 15
  },
  {
    id: 'K8S_Name',
    name: 'Names',
    default: false,
    width: 15
  },
  {
    id: 'K8S_Type',
    name: 'Kinds',
    default: false,
    width: 10
  },
  {
    id: 'K8S_OwnerName',
    name: 'Owners',
    default: false,
    width: 15
  },
  {
    id: 'K8S_OwnerType',
    name: 'Owner Kinds',
    default: false,
    width: 10
  },
  {
    id: 'K8S_Namespace',
    name: 'Namespaces',
    default: false,
    width: 15
  },
  {
    id: 'Addr',
    name: 'IP',
    default: false,
    width: 10
  },
  {
    id: 'Port',
    name: 'Ports',
    default: false,
    width: 10
  },
  {
    id: 'Mac',
    name: 'MAC',
    default: false,
    width: 10
  },
  {
    id: 'K8S_HostIP',
    name: 'Node IP',
    default: false,
    width: 10
  },
  {
    id: 'K8S_HostName',
    name: 'Node Name',
    default: false,
    width: 15
  },
  {
    id: 'K8S_Object',
    name: 'Kubernetes Objects',
    default: false,
    width: 15
  },
  {
    id: 'K8S_OwnerObject',
    name: 'Owner Kubernetes Objects',
    default: false,
    width: 15
  },
  {
    id: 'AddrPort',
    name: 'IPs & Ports',
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
    tooltip: 'TCP handshake Round Trip Time',
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
    default: false,
    width: 5
  },
  {
    id: 'DNSLatency',
    group: 'DNS',
    name: 'DNS Latency',
    tooltip: 'Time elapsed between DNS request and response.',
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
    default: false,
    width: 5
  }
];

// Customize columns order
export const DefaultColumnSample = getDefaultColumns(ColumnConfigSampleDefs);
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
