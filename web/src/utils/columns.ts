import { TFunction } from 'i18next';
import _ from 'lodash';
import { Fields, Labels, Record } from '../api/ipfix';
import { FilterId } from '../model/filters';
import { compareIPs } from '../utils/ip';
import { comparePorts } from '../utils/port';
import { compareProtocols } from '../utils/protocol';
import { compareNumbers, compareStrings } from './base-compare';

export enum ColumnsId {
  starttime = 'StartTime',
  endtime = 'EndTime',
  type = 'K8S_Type',
  srctype = 'SrcK8S_Type',
  dsttype = 'DstK8S_Type',
  namespace = 'K8S_Namespace',
  srcnamespace = 'SrcK8S_Namespace',
  dstnamespace = 'DstK8S_Namespace',
  name = 'K8S_Name',
  srcname = 'SrcK8S_Name',
  dstname = 'DstK8S_Name',
  kubeobject = 'K8S_Object',
  srckubeobject = 'SrcK8S_Object',
  dstkubeobject = 'DstK8S_Object',
  addr = 'Addr',
  srcaddr = 'SrcAddr',
  dstaddr = 'DstAddr',
  mac = 'Mac',
  srcmac = 'SrcMac',
  dstmac = 'DstMac',
  port = 'Port',
  srcport = 'SrcPort',
  dstport = 'DstPort',
  addrport = 'AddrPort',
  srcaddrport = 'SrcAddrPort',
  dstaddrport = 'DstAddrPort',
  proto = 'Proto',
  bytes = 'Bytes',
  packets = 'Packets',
  owner = 'K8S_OwnerName',
  srcowner = 'SrcK8S_OwnerName',
  dstowner = 'DstK8S_OwnerName',
  ownertype = 'K8S_OwnerType',
  srcownertype = 'SrcK8S_OwnerType',
  dstownertype = 'DstK8S_OwnerType',
  ownerkubeobject = 'K8S_OwnerObject',
  srcownerkubeobject = 'SrcK8S_OwnerObject',
  dstownerkubeobject = 'DstK8S_OwnerObject',
  host = 'K8S_HostIP',
  duration = 'FlowDuration',
  collectiontime = 'CollectionTime',
  collectionlatency = 'CollectionLatency',
  dnsid = 'DNSId',
  dnslatency = 'DNSLatency',
  dnsresponsecode = 'DNSResponseCode',
  hostaddr = 'K8S_HostIP',
  srchostaddr = 'SrcK8S_HostIP',
  dsthostaddr = 'DstK8S_HostIP',
  hostname = 'K8S_HostName',
  srchostname = 'SrcK8S_HostName',
  dsthostname = 'DstK8S_HostName',
  clustername = 'K8S_ClusterName',
  flowdir = 'FlowDirection',
  rttTime = 'TimeFlowRttMs',
  connectionToken = 'ConnectionToken',
  hashid = '_HashId',
  interface = 'Interface',
  recordtype = 'RecordType',
  bytesab = 'Bytes_AB',
  bytesba = 'Bytes_BA',
  packetsab = 'Packets_AB',
  packetsba = 'Packets_BA',
  isfirst = 'IsFirst',
  numflow = 'numFlowLogs'
}

export interface Column {
  id: ColumnsId;
  ids?: ColumnsId[];
  group?: string;
  name: string;
  fieldName?: keyof Fields | keyof Labels;
  tooltip?: string;
  docURL?: string;
  quickFilter?: FilterId;
  isSelected: boolean;
  value: (flow: Record) => string | number | string[] | number[];
  sort(a: Record, b: Record, col: Column): number;
  // width in "em"
  width: number;
}

export type ColumnSizeMap = {
  [id in ColumnsId]?: string;
};

export type ColumnGroup = {
  title?: string;
  columns: Column[];
  expanded?: boolean;
};

export const getColumnGroups = (columns: Column[], commonGroupName?: string, sortColumns = false) => {
  const groups: ColumnGroup[] = [];

  if (commonGroupName) {
    //groups name is unique
    //ie dropdown filters
    //add empty expanded group at first
    groups.push({ columns: [], expanded: true });
    _.each(columns, col => {
      const found = groups.find(g => g.title === col.group);
      if (found) {
        found.columns.push(col);
      } else {
        groups.push({ title: col.group, columns: [col] });
      }
    });
    //set the name at the end to allow title match
    groups[0].title = commonGroupName;
  } else {
    //group with same name can be added multiple times
    //ie nested columns groups
    _.each(columns, col => {
      if (col.group && _.last(groups)?.title === col.group) {
        _.last(groups)!.columns.push(col);
      } else {
        groups.push({ title: col.group, columns: [col] });
      }
    });
  }

  if (sortColumns) {
    //sort columns by name to find filter easily
    _.each(groups, g => {
      g.columns = g.columns.sort((a, b) => a.name.localeCompare(b.name));
    });
  }
  return groups;
};

/* prefix group to column name if available
 * and column name doesn't start with group
 */
export const getFullColumnName = (col?: Column): string => {
  if (col) {
    if (col.group && !col.name.startsWith(col.group)) {
      return `${col.group} ${col.name}`;
    }
    return col.name;
  }
  return '';
};

/* remove group from column name if prefixed
 * ie DNS Response Code -> Response Code
 */
export const getShortColumnName = (col?: Column): string => {
  if (col) {
    if (col.group && col.name.startsWith(col.group)) {
      return col.name.replace(col.group, '');
    }
    return col.name;
  }
  return '';
};

export const getSrcOrDstValue = (v1?: string | number, v2?: string | number): string[] | number[] => {
  if (v1 && !Number.isNaN(v1) && v2 && !Number.isNaN(v2)) {
    return [v1 as number, v2 as number];
  } else if (v1 || v2) {
    return [v1 ? (v1 as string) : '', v2 ? (v2 as string) : ''];
  } else {
    return [];
  }
};

/* concatenate kind / namespace / pod or ip / port for display
 * if kubernetes objects Kind Namespace & Pod field are not resolved, will fallback on
 * ip:port or ip only if port is not provided
 */
export const getConcatenatedValue = (
  ip: string,
  port: number,
  kind?: string,
  namespace?: string,
  pod?: string
): string => {
  if (kind && namespace && pod) {
    return `${kind}.${namespace}.${pod}`;
  }
  if (!Number.isNaN(port)) {
    return `${ip}:${String(port)}`;
  }
  return ip;
};

export const getCommonColumns = (t: TFunction, withConcatenatedFields = true): Column[] => {
  const commonColumns: Column[] = [
    {
      id: ColumnsId.name,
      name: t('Names'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_Name, f.fields.DstK8S_Name),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.type,
      name: t('Kinds'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.labels.SrcK8S_Type, f.labels.DstK8S_Type),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.owner,
      name: t('Owners'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.labels.SrcK8S_OwnerName, f.labels.DstK8S_OwnerName),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.ownertype,
      name: t('Owner Kinds'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_OwnerType, f.fields.DstK8S_OwnerType),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.namespace,
      name: t('Namespaces'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.labels.SrcK8S_Namespace, f.labels.DstK8S_Namespace),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.addr,
      name: t('IP'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcAddr, f.fields.DstAddr),
      sort: (a, b, col) => compareIPs((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.port,
      name: t('Ports'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcPort, f.fields.DstPort),
      sort: (a, b, col) =>
        comparePorts(
          (col.value(a) as number[]).reduce((a, b) => a + b, 0),
          (col.value(b) as number[]).reduce((a, b) => a + b, 0)
        ),
      width: 10
    },
    {
      id: ColumnsId.mac,
      name: t('MAC'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcMac, f.fields.DstMac),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.hostaddr,
      name: t('Node IP'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_HostIP, f.fields.DstK8S_HostIP),
      sort: (a, b, col) => compareIPs((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.hostname,
      name: t('Node Name'),
      isSelected: false,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_HostName, f.fields.DstK8S_HostName),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    }
  ];

  if (withConcatenatedFields) {
    return [
      ...commonColumns,
      {
        id: ColumnsId.kubeobject,
        name: t('Kubernetes Objects'),
        isSelected: false,
        value: f => [
          ...getConcatenatedValue(
            f.fields.SrcAddr,
            f.fields.SrcPort || NaN,
            f.labels.SrcK8S_Type,
            f.labels.SrcK8S_Namespace,
            f.fields.SrcK8S_Name
          ),
          ...getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort || NaN,
            f.labels.DstK8S_Type,
            f.labels.DstK8S_Namespace,
            f.fields.DstK8S_Name
          )
        ],
        sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
        width: 15
      },
      {
        id: ColumnsId.ownerkubeobject,
        name: t('Owner Kubernetes Objects'),
        isSelected: false,
        value: f => [
          ...getConcatenatedValue(
            f.fields.SrcAddr,
            f.fields.SrcPort || NaN,
            f.fields.SrcK8S_OwnerType,
            f.labels.SrcK8S_Namespace,
            f.labels.SrcK8S_OwnerName
          ),
          ...getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort || NaN,
            f.fields.DstK8S_OwnerType,
            f.labels.DstK8S_Namespace,
            f.labels.DstK8S_OwnerName
          )
        ],
        sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
        width: 15
      },
      {
        id: ColumnsId.addrport,
        name: t('IPs & Ports'),
        isSelected: false,
        value: f => [
          ...getConcatenatedValue(f.fields.SrcAddr, f.fields.SrcPort || NaN),
          ...getConcatenatedValue(f.fields.DstAddr, f.fields.DstPort || NaN)
        ],
        sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
        width: 15
      }
    ];
  } else {
    return commonColumns;
  }
};

export const getSrcColumns = (t: TFunction): Column[] => {
  const group = t('Source');
  return [
    {
      id: ColumnsId.srcname,
      group,
      name: t('Name'),
      tooltip: t('The {{group}} name of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'http://kubernetes.io/docs/user-guide/identifiers#names',
      fieldName: 'SrcK8S_Name',
      quickFilter: 'src_name',
      isSelected: true,
      value: f => f.fields.SrcK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srctype,
      group,
      name: t('Kind'),
      tooltip: `${t('The {{group}} kind of the related kubernetes resource. Examples:')}
      - ${t('Pod')}
      - ${t('Service')}
      - ${t('Node')}`,
      fieldName: 'SrcK8S_Type',
      quickFilter: 'src_kind',
      isSelected: false,
      value: f => f.labels.SrcK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcowner,
      group,
      name: t('Owner'),
      tooltip: t('The {{group}} owner name of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/',
      fieldName: 'SrcK8S_OwnerName',
      quickFilter: 'src_owner_name',
      isSelected: false,
      value: f => f.labels.SrcK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcownertype,
      group,
      name: t('Owner Kind'),
      tooltip: `${t('The {{group}} owner kind of the related kubernetes resource. Examples:')}
      - ${t('Deployment')}
      - ${t('StatefulSet')}
      - ${t('DaemonSet')}
      - ${t('Job')}
      - ${t('CronJob')}`,
      fieldName: 'SrcK8S_OwnerType',
      quickFilter: 'src_kind',
      isSelected: false,
      value: f => f.fields.SrcK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcnamespace,
      group,
      name: t('Namespace'),
      tooltip: t('The {{group}} namespace of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'http://kubernetes.io/docs/user-guide/identifiers#namespaces',
      fieldName: 'SrcK8S_Namespace',
      quickFilter: 'src_namespace',
      isSelected: true,
      value: f => f.labels.SrcK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcaddr,
      group,
      name: t('IP'),
      tooltip: t('The {{group}} IP address. Can be either in IPv4 or IPv6 format.', { group: group.toLowerCase() }),
      fieldName: 'SrcAddr',
      quickFilter: 'src_address',
      isSelected: false,
      value: f => f.fields.SrcAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcport,
      group,
      name: t('Port'),
      tooltip: t('The {{group}} port number.', { group: group.toLowerCase() }),
      fieldName: 'SrcPort',
      quickFilter: 'src_port',
      isSelected: true,
      value: f => f.fields.SrcPort || NaN,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.srcmac,
      group,
      name: t('MAC'),
      tooltip: t('The {{group}} MAC address.', { group: group.toLowerCase() }),
      fieldName: 'SrcMac',
      quickFilter: 'src_mac',
      isSelected: false,
      value: f => f.fields.SrcMac,
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srchostaddr,
      group,
      name: t('Node IP'),
      tooltip: t('The {{group}} node IP address. Can be either in IPv4 or IPv6 format.', {
        group: group.toLowerCase()
      }),
      fieldName: 'SrcK8S_HostIP',
      quickFilter: 'src_host_address',
      isSelected: false,
      value: f => f.fields.SrcK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srchostname,
      group,
      name: t('Node Name'),
      tooltip: t('The {{group}} name of the node running the workload.', { group: group.toLowerCase() }),
      docURL: 'https://kubernetes.io/docs/concepts/architecture/nodes/',
      fieldName: 'SrcK8S_HostName',
      quickFilter: 'src_host_name',
      isSelected: false,
      value: f => f.fields.SrcK8S_HostName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    }
  ];
};

export const getDstColumns = (t: TFunction): Column[] => {
  const group = t('Destination');
  return [
    {
      id: ColumnsId.dstname,
      group,
      name: t('Name'),
      tooltip: t('The {{group}} name of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'http://kubernetes.io/docs/user-guide/identifiers#names',
      fieldName: 'DstK8S_Name',
      quickFilter: 'dst_name',
      isSelected: true,
      value: f => f.fields.DstK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dsttype,
      group,
      name: t('Kind'),
      tooltip: `${t('The {{group}} kind of the related kubernetes resource. Examples:')}
      - ${t('Pod')}
      - ${t('Service')}
      - ${t('Node')}`,
      fieldName: 'DstK8S_Type',
      quickFilter: 'dst_kind',
      isSelected: false,
      value: f => f.labels.DstK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstowner,
      group,
      name: t('Owner'),
      tooltip: t('The {{group}} owner name of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'https://kubernetes.io/docs/concepts/overview/working-with-objects/owners-dependents/',
      fieldName: 'DstK8S_OwnerName',
      quickFilter: 'dst_owner_name',
      isSelected: false,
      value: f => f.labels.DstK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstownertype,
      group,
      name: t('Owner Kind'),
      tooltip: `${t('The {{group}} owner kind of the related kubernetes resource. Examples:')}
      - ${t('Deployment')}
      - ${t('StatefulSet')}
      - ${t('DaemonSet')}
      - ${t('Job')}
      - ${t('CronJob')}`,
      fieldName: 'DstK8S_OwnerType',
      quickFilter: 'dst_kind',
      isSelected: false,
      value: f => f.fields.DstK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstnamespace,
      group,
      name: t('Namespace'),
      tooltip: t('The {{group}} namespace of the related kubernetes resource.', { group: group.toLowerCase() }),
      docURL: 'http://kubernetes.io/docs/user-guide/identifiers#namespaces',
      fieldName: 'DstK8S_Namespace',
      quickFilter: 'dst_namespace',
      isSelected: true,
      value: f => f.labels.DstK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstaddr,
      group,
      name: t('IP'),
      tooltip: t('The {{group}} IP address. Can be either in IPv4 or IPv6 format.', { group: group.toLowerCase() }),
      fieldName: 'DstAddr',
      quickFilter: 'dst_address',
      isSelected: false,
      value: f => f.fields.DstAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstport,
      group,
      name: t('Port'),
      tooltip: t('The {{group}} port number.', { group: group.toLowerCase() }),
      fieldName: 'DstPort',
      quickFilter: 'dst_port',
      isSelected: true,
      value: f => f.fields.DstPort || NaN,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.dstmac,
      group,
      name: t('MAC'),
      tooltip: t('The {{group}} MAC address.', { group: group.toLowerCase() }),
      fieldName: 'DstMac',
      quickFilter: 'dst_mac',
      isSelected: false,
      value: f => f.fields.DstMac,
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dsthostaddr,
      group,
      name: t('Node IP'),
      tooltip: t('The {{group}} node IP address. Can be either in IPv4 or IPv6 format.', {
        group: group.toLowerCase()
      }),
      fieldName: 'DstK8S_HostIP',
      quickFilter: 'dst_host_address',
      isSelected: false,
      value: f => f.fields.DstK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dsthostname,
      group,
      name: t('Node Name'),
      tooltip: t('The {{group}} name of the node running the workload.', { group: group.toLowerCase() }),
      docURL: 'https://kubernetes.io/docs/concepts/architecture/nodes/',
      fieldName: 'DstK8S_HostName',
      quickFilter: 'dst_host_name',
      isSelected: false,
      value: f => f.fields.DstK8S_HostName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    }
  ];
};

export const getSrcDstColumns = (t: TFunction, withConcatenatedFields = true): Column[] => {
  if (withConcatenatedFields) {
    return [
      ...getSrcColumns(t),
      {
        id: ColumnsId.srckubeobject,
        group: t('Source'),
        name: t('Kubernetes Object'),
        isSelected: false,
        value: f =>
          getConcatenatedValue(
            f.fields.SrcAddr,
            f.fields.SrcPort || NaN,
            f.labels.SrcK8S_Type,
            f.labels.SrcK8S_Namespace,
            f.fields.SrcK8S_Name
          ),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      },
      {
        id: ColumnsId.srcownerkubeobject,
        group: t('Source'),
        name: t('Owner Kubernetes Object'),
        isSelected: false,
        value: f =>
          getConcatenatedValue(
            f.fields.SrcAddr,
            f.fields.SrcPort || NaN,
            f.fields.SrcK8S_OwnerType,
            f.labels.SrcK8S_Namespace,
            f.labels.SrcK8S_OwnerName
          ),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      },
      {
        id: ColumnsId.srcaddrport,
        group: t('Source'),
        name: t('IP & Port'),
        isSelected: false,
        value: f => getConcatenatedValue(f.fields.SrcAddr, f.fields.SrcPort || NaN),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      },
      ...getDstColumns(t),
      {
        id: ColumnsId.dstkubeobject,
        group: t('Destination'),
        name: t('Kubernetes Object'),
        isSelected: false,
        value: f =>
          getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort || NaN,
            f.labels.DstK8S_Type,
            f.labels.DstK8S_Namespace,
            f.fields.DstK8S_Name
          ),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      },
      {
        id: ColumnsId.dstownerkubeobject,
        group: t('Destination'),
        name: t('Owner Kubernetes Object'),
        isSelected: false,
        value: f =>
          getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort || NaN,
            f.fields.DstK8S_OwnerType,
            f.labels.DstK8S_Namespace,
            f.labels.DstK8S_OwnerName
          ),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      },
      {
        id: ColumnsId.dstaddrport,
        group: t('Destination'),
        name: t('IP & Port'),
        isSelected: false,
        value: f => getConcatenatedValue(f.fields.DstAddr, f.fields.DstPort || NaN),
        sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
        width: 15
      }
    ];
  } else {
    return [...getSrcColumns(t), ...getDstColumns(t)];
  }
};

export const getExtraColumns = (t: TFunction): Column[] => {
  return [
    {
      id: ColumnsId.proto,
      name: t('Protocol'),
      tooltip: t('The value of the protocol number in the IP packet header'),
      fieldName: 'Proto',
      quickFilter: 'protocol',
      isSelected: false,
      value: f => f.fields.Proto,
      sort: (a, b, col) => compareProtocols(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.flowdir,
      name: t('Direction'),
      tooltip: t('The direction of the Flow observed at the Node observation point.'),
      fieldName: 'FlowDirection',
      quickFilter: 'direction',
      isSelected: false,
      value: f => f.labels.FlowDirection,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.interface,
      name: t('Interface'),
      tooltip: t('The network interface of the Flow.'),
      fieldName: 'Interface',
      quickFilter: 'interface',
      isSelected: false,
      value: f => f.fields.Interface || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      tooltip: t('The total aggregated number of bytes.'),
      fieldName: 'Bytes',
      isSelected: true,
      value: f => (f.fields.PktDropBytes ? [f.fields.Bytes || 0, f.fields.PktDropBytes] : f.fields.Bytes || 0),
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      tooltip: t('The total aggregated number of packets.'),
      fieldName: 'Packets',
      quickFilter: 'pkt_drop_cause',
      isSelected: true,
      value: f => (f.fields.PktDropPackets ? [f.fields.Packets || 0, f.fields.PktDropPackets] : f.fields.Packets || 0),
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.duration,
      name: t('Duration'),
      tooltip: t('Time elapsed between Start Time and End Time.'),
      isSelected: false,
      value: f => f.fields.TimeFlowEndMs - f.fields.TimeFlowStartMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.rttTime,
      name: t('Flow RTT'),
      tooltip: t('Flow Round Trip Time'),
      fieldName: 'TimeFlowRttNs',
      quickFilter: 'time_flow_rtt',
      isSelected: false,
      value: f => f.fields.TimeFlowRttNs || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.collectiontime,
      name: t('Collection Time'),
      tooltip: t('Reception time of the record by the collector.'),
      fieldName: 'TimeReceived',
      isSelected: false,
      value: f => f.fields.TimeReceived * 1000,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 15
    },
    {
      id: ColumnsId.collectionlatency,
      name: t('Collection Latency'),
      tooltip: t('Time elapsed between End Time and Collection Time.'),
      isSelected: false,
      value: f => f.fields.TimeReceived * 1000 - f.fields.TimeFlowEndMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.dnsid,
      group: t('DNS'),
      name: t('DNS Id'),
      tooltip: t('DNS request identifier.'),
      fieldName: 'DnsId',
      quickFilter: 'dns_id',
      isSelected: false,
      value: f => (f.fields.DnsId === undefined ? Number.NaN : f.fields.DnsId),
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.dnslatency,
      group: t('DNS'),
      name: t('DNS Latency'),
      tooltip: t('Time elapsed between DNS request and response.'),
      isSelected: false,
      value: f => (f.fields.DnsLatencyMs === undefined ? Number.NaN : f.fields.DnsLatencyMs),
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.dnsresponsecode,
      group: t('DNS'),
      name: t('DNS Response Code'),
      tooltip: t('DNS RCODE name from response header.'),
      fieldName: 'DnsFlagsResponseCode',
      quickFilter: 'dns_flag_response_code',
      isSelected: false,
      value: f => f.fields.DnsFlagsResponseCode || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.clustername,
      name: t('Cluster Name'),
      tooltip: t('The name of the cluster reporting the flow.'),
      fieldName: 'K8S_ClusterName',
      quickFilter: 'cluster_name',
      isSelected: false,
      value: f => f.fields.K8S_ClusterName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    }
  ];
};

export const getDefaultColumns = (t: TFunction, withCommonFields = true, withConcatenatedFields = true): Column[] => {
  const timeCols: Column[] = [
    {
      id: ColumnsId.starttime,
      name: t('Start Time'),
      tooltip: t(
        // eslint-disable-next-line max-len
        'Time of the first packet observed. Unlike End Time, it is not used in queries to select records in an interval.'
      ),
      fieldName: 'TimeFlowStartMs',
      isSelected: false,
      value: f => f.fields.TimeFlowStartMs,
      sort: (a, b, col) =>
        compareNumbers(col.value(a) as number, col.value(b) as number) ||
        compareStrings(b.labels._RecordType!, a.labels._RecordType!),
      width: 15
    },
    {
      id: ColumnsId.endtime,
      name: t('End Time'),
      tooltip: t(
        // eslint-disable-next-line max-len
        'Time of the last packet observed. This is what is used in queries to select records in an interval.'
      ),
      fieldName: 'TimeFlowEndMs',
      isSelected: true,
      value: f => f.fields.TimeFlowEndMs,
      sort: (a, b, col) =>
        compareNumbers(col.value(a) as number, col.value(b) as number) ||
        compareStrings(b.labels._RecordType!, a.labels._RecordType!),
      width: 15
    }
  ];

  const identifierCols: Column[] = [
    {
      id: ColumnsId.recordtype,
      name: t('Event / Type'),
      fieldName: '_RecordType',
      quickFilter: 'type',
      isSelected: true,
      value: (f): string => {
        switch (f.labels._RecordType) {
          case 'newConnection':
            return t('Conversation start');
          case 'heartbeat':
            return t('Conversation tick');
          case 'endConnection':
            return t('Conversation end');
          case 'flowLog':
          default:
            return t('Flow');
        }
      },
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.hashid,
      name: t('Conversation Id'),
      fieldName: '_HashId',
      quickFilter: 'id',
      isSelected: true,
      value: f => f.fields._HashId || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.connectionToken,
      name: t('Connection token'),
      fieldName: 'ConnectionToken',
      quickFilter: 'token',
      isSelected: false,
      value: f => f.fields.ConnectionToken || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    }
  ];

  if (withCommonFields) {
    return [
      ...timeCols,
      ...identifierCols,
      ...getSrcDstColumns(t, withConcatenatedFields),
      ...getCommonColumns(t, withConcatenatedFields),
      ...getExtraColumns(t)
    ];
  } else {
    return [...timeCols, ...identifierCols, ...getSrcDstColumns(t, withConcatenatedFields), ...getExtraColumns(t)];
  }
};
