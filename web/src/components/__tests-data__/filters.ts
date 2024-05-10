/* eslint-disable max-len */
import { findFilter, getFilterDefinitions } from '../../utils/filter-definitions';
import { Filter, FilterId, FilterValue } from '../../model/filters';
import { ColumnConfigSampleDefs } from './columns';

export const FilterConfigSampleDefs = [
  {
    id: 'src_namespace',
    name: 'Namespace',
    component: 'autocomplete',
    autoCompleteAddsQuotes: true,
    category: 'source',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'dst_namespace',
    name: 'Namespace',
    component: 'autocomplete',
    autoCompleteAddsQuotes: true,
    category: 'destination',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'src_name',
    name: 'name',
    component: 'text',
    category: 'source',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'dst_name',
    name: 'name',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'src_kind',
    name: 'Kind',
    component: 'autocomplete',
    autoCompleteAddsQuotes: true,
    category: 'source'
  },
  {
    id: 'dst_kind',
    name: 'Kind',
    component: 'autocomplete',
    autoCompleteAddsQuotes: true,
    category: 'destination'
  },
  {
    id: 'src_owner_name',
    name: 'Owner Name',
    component: 'text',
    category: 'source',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'dst_owner_name',
    name: 'Owner Name',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'src_resource',
    name: 'Resource',
    component: 'autocomplete',
    category: 'source',
    placeholder: 'E.g: Pod.default.my-pod',
    hint: 'Specify an existing resource from its kind, namespace and name.',
    examples:
      'Specify a kind, namespace and name from existing:\n        - Select kind first from suggestions\n        - Then Select namespace from suggestions\n        - Finally select name from suggestions\n        You can also directly specify a kind, namespace and name like pod.openshift.apiserver'
  },
  {
    id: 'dst_resource',
    name: 'Resource',
    component: 'autocomplete',
    category: 'destination',
    placeholder: 'E.g: Pod.default.my-pod',
    hint: 'Specify an existing resource from its kind, namespace and name.',
    examples:
      'Specify a kind, namespace and name from existing:\n        - Select kind first from suggestions\n        - Then Select namespace from suggestions\n        - Finally select name from suggestions\n        You can also directly specify a kind, namespace and name like pod.openshift.apiserver'
  },
  {
    id: 'src_address',
    name: 'IP',
    component: 'text',
    category: 'source',
    hint: 'Specify a single IP or range.',
    examples:
      'Specify IP following one of these rules:\n    - A single IPv4 or IPv6 address like 192.0.2.0, ::1\n    - An IP address range like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8\n    - A CIDR specification like 192.51.100.0/24, 2001:db8::/32\n    - Empty double quotes "" for an empty IP'
  },
  {
    id: 'dst_address',
    name: 'IP',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single IP or range.',
    examples:
      'Specify IP following one of these rules:\n    - A single IPv4 or IPv6 address like 192.0.2.0, ::1\n    - An IP address range like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8\n    - A CIDR specification like 192.51.100.0/24, 2001:db8::/32\n    - Empty double quotes "" for an empty IP'
  },
  {
    id: 'src_port',
    name: 'Port',
    component: 'autocomplete',
    category: 'source',
    hint: 'Specify a single port number or name.',
    examples:
      'Specify a single port following one of these rules:\n        - A port number like 80, 21\n        - A IANA name like HTTP, FTP',
    docUrl: 'https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml'
  },
  {
    id: 'dst_port',
    name: 'Port',
    component: 'autocomplete',
    category: 'destination',
    hint: 'Specify a single port number or name.',
    examples:
      'Specify a single port following one of these rules:\n        - A port number like 80, 21\n        - A IANA name like HTTP, FTP',
    docUrl: 'https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml'
  },
  {
    id: 'src_mac',
    name: 'MAC',
    component: 'text',
    category: 'source',
    hint: 'Specify a single MAC address.'
  },
  {
    id: 'dst_mac',
    name: 'MAC',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single MAC address.'
  },
  {
    id: 'src_host_address',
    name: 'Node IP',
    component: 'text',
    category: 'source',
    hint: 'Specify a single IP or range.',
    examples:
      'Specify IP following one of these rules:\n    - A single IPv4 or IPv6 address like 192.0.2.0, ::1\n    - An IP address range like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8\n    - A CIDR specification like 192.51.100.0/24, 2001:db8::/32\n    - Empty double quotes "" for an empty IP'
  },
  {
    id: 'dst_host_address',
    name: 'Node IP',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single IP or range.',
    examples:
      'Specify IP following one of these rules:\n    - A single IPv4 or IPv6 address like 192.0.2.0, ::1\n    - An IP address range like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8\n    - A CIDR specification like 192.51.100.0/24, 2001:db8::/32\n    - Empty double quotes "" for an empty IP'
  },
  {
    id: 'src_host_name',
    name: 'Node Name',
    component: 'text',
    category: 'source',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'dst_host_name',
    name: 'Node Name',
    component: 'text',
    category: 'destination',
    hint: 'Specify a single kubernetes name.',
    examples:
      'Specify a single kubernetes name following these rules:\n    - Containing any alphanumeric, hyphen, underscrore or dot character\n    - Partial text like cluster, cluster-image, image-registry\n    - Exact match using quotes like "cluster-image-registry"\n    - Case sensitive match using quotes like "Deployment"\n    - Starting text like cluster, "cluster-*"\n    - Ending text like "*-registry"\n    - Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-'
  },
  {
    id: 'protocol',
    name: 'Protocol',
    component: 'autocomplete',
    hint: 'Specify a single protocol number or name.',
    examples:
      'Specify a single protocol following one of these rules:\n        - A protocol number like 6, 17\n        - A IANA name like TCP, UDP\n        - Empty double quotes "" for undefined protocol',
    docUrl: 'https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml'
  },
  {
    id: 'direction',
    name: 'Direction',
    component: 'autocomplete',
    hint: 'Specify the direction of the Flow observed at the Node observation point.'
  },
  {
    id: 'interface',
    name: 'Network interface',
    component: 'text',
    hint: 'Specify a network interface.'
  },
  {
    id: 'dscp',
    name: 'DSCP value',
    component: 'number',
    hint: 'Specify a Differentiated Services Code Point value as integer number.'
  },
  {
    id: 'id',
    name: 'Conversation Id',
    component: 'text',
    hint: 'Specify a single conversation hash Id.'
  },
  {
    id: 'pkt_drop_state',
    name: 'Packet drop TCP state',
    component: 'autocomplete',
    hint: 'Specify a single TCP state.',
    examples:
      'Specify a single TCP state name like:\n        - A _LINUX_TCP_STATES_H number like 1, 2, 3\n        - A _LINUX_TCP_STATES_H TCP name like ESTABLISHED, SYN_SENT, SYN_RECV',
    docUrl: 'https://github.com/torvalds/linux/blob/master/include/net/tcp_states.h'
  },
  {
    id: 'pkt_drop_cause',
    name: 'Packet drop latest cause',
    component: 'autocomplete',
    hint: 'Specify a single packet drop cause.',
    examples:
      'Specify a single packet drop cause like:\n        - A _LINUX_DROPREASON_CORE_H number like 2, 3, 4\n        - A _LINUX_DROPREASON_CORE_H SKB_DROP_REASON name like NOT_SPECIFIED, NO_SOCKET, PKT_TOO_SMALL',
    docUrl: 'https://github.com/torvalds/linux/blob/master/include/net/dropreason-core.h'
  },
  {
    id: 'dns_id',
    name: 'DNS Id',
    component: 'number',
    hint: 'Specify a single DNS Id.'
  },
  {
    id: 'dns_latency',
    name: 'DNS Latency',
    component: 'number',
    hint: 'Specify a DNS Latency in miliseconds.'
  },
  {
    id: 'dns_flag_response_code',
    name: 'DNS Response Code',
    component: 'autocomplete',
    hint: 'Specify a single DNS RCODE name.',
    examples:
      'Specify a single DNS RCODE name like:\n        - A IANA RCODE number like 0, 3, 9\n        - A IANA RCODE name like NoError, NXDomain, NotAuth',
    docUrl: 'https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6'
  },
  {
    id: 'time_flow_rtt',
    name: 'Flow RTT',
    component: 'number',
    hint: 'Specify a TCP handshake Round Trip Time in nanoseconds.'
  }
];

export const FilterDefinitionSample = getFilterDefinitions(FilterConfigSampleDefs, ColumnConfigSampleDefs, v => v);

const filter = (id: FilterId, values: FilterValue[]): Filter => {
  return {
    def: findFilter(FilterDefinitionSample, id)!,
    values: values
  };
};

export const FiltersSample: Filter[] = [
  filter('src_port', [{ v: '1234' }]),
  filter('dst_port', [{ v: '5678' }]),
  filter('src_name', [{ v: 'pod or service' }]),
  filter('dst_name', [{ v: 'another pod or service' }])
];

export const FTPSrcPortSample = filter('src_port', [{ v: '21', display: 'ftp' }]);
