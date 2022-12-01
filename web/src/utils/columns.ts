import { TFunction } from 'i18next';
import _ from 'lodash';
import { FilterId } from '../model/filters';
import { Fields, Labels, Record } from '../api/ipfix';
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
  hostaddr = 'K8S_HostIP',
  srchostaddr = 'SrcK8S_HostIP',
  dsthostaddr = 'DstK8S_HostIP',
  hostname = 'K8S_HostName',
  srchostname = 'SrcK8S_HostName',
  dsthostname = 'DstK8S_HostName',
  flowdir = 'FlowDirection',
  recordtype = 'RecordType',
  connectionid = 'ConnectionID',
  bytesab = 'Bytes_AB',
  bytesba = 'Bytes_BA',
  packetsab = 'Packets_AB',
  packetsba = 'Packets_BA',
  isfirst = 'IsFirst'
}

export interface Column {
  id: ColumnsId;
  ids?: ColumnsId[];
  group?: string;
  name: string;
  fieldName?: keyof Fields | keyof Labels;
  tooltip?: string;
  quickFilter?: FilterId;
  isSelected: boolean;
  value: (flow: Record) => string | number | string[] | number[];
  sort(a: Record, b: Record, col: Column): number;
  // width in "em"
  width: number;
}

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

export const getFullColumnName = (col?: Column) => {
  if (col) {
    return !col.group ? col.name : `${col.group} ${col.name}`;
  } else {
    return '';
  }
};

export const getSrcOrDstValue = (v1?: string | number, v2?: string | number): string[] | number[] => {
  if (v1 && Number(v1) != NaN && v2 && Number(v2) != NaN) {
    return [v1 as number, v2 as number];
  } else if (v1 || v2) {
    return [v1 ? (v1 as string) : '', v2 ? (v2 as string) : ''];
  } else {
    return [];
  }
};

/* concatenate kind / namespace / pod or ip / port for display
 *  Kind Namespace & Pod field will fallback on ip port if kubernetes objects are not resolved
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
  return `${ip}:${String(port)}`;
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
      value: f => getSrcOrDstValue(f.fields.SrcK8S_Type, f.fields.DstK8S_Type),
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
            f.fields.SrcPort,
            f.fields.SrcK8S_Type,
            f.labels.SrcK8S_Namespace,
            f.fields.SrcK8S_Name
          ),
          ...getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort,
            f.fields.DstK8S_Type,
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
            f.fields.SrcPort,
            f.fields.SrcK8S_OwnerType,
            f.labels.SrcK8S_Namespace,
            f.labels.SrcK8S_OwnerName
          ),
          ...getConcatenatedValue(
            f.fields.DstAddr,
            f.fields.DstPort,
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
          ...getConcatenatedValue(f.fields.SrcAddr, f.fields.SrcPort),
          ...getConcatenatedValue(f.fields.DstAddr, f.fields.DstPort)
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
  return [
    {
      id: ColumnsId.srcname,
      group: t('Source'),
      name: t('Name'),
      fieldName: 'SrcK8S_Name',
      quickFilter: 'src_name',
      isSelected: true,
      value: f => f.fields.SrcK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srctype,
      group: t('Source'),
      name: t('Kind'),
      fieldName: 'SrcK8S_Type',
      quickFilter: 'src_kind',
      isSelected: false,
      value: f => f.fields.SrcK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcowner,
      group: t('Source'),
      name: t('Owner'),
      fieldName: 'SrcK8S_OwnerName',
      quickFilter: 'src_owner_name',
      isSelected: false,
      value: f => f.labels.SrcK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcownertype,
      group: t('Source'),
      name: t('Owner Kind'),
      fieldName: 'SrcK8S_OwnerType',
      quickFilter: 'src_kind',
      isSelected: false,
      value: f => f.fields.SrcK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcnamespace,
      group: t('Source'),
      name: t('Namespace'),
      fieldName: 'SrcK8S_Namespace',
      quickFilter: 'src_namespace',
      isSelected: false,
      value: f => f.labels.SrcK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcaddr,
      group: t('Source'),
      name: t('IP'),
      fieldName: 'SrcAddr',
      quickFilter: 'src_address',
      isSelected: false,
      value: f => f.fields.SrcAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcport,
      group: t('Source'),
      name: t('Port'),
      fieldName: 'SrcPort',
      quickFilter: 'src_port',
      isSelected: true,
      value: f => f.fields.SrcPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.srcmac,
      group: t('Source'),
      name: t('MAC'),
      fieldName: 'SrcMac',
      quickFilter: 'src_mac',
      isSelected: false,
      value: f => f.fields.SrcMac,
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srchostaddr,
      group: t('Source'),
      name: t('Node IP'),
      fieldName: 'SrcK8S_HostIP',
      quickFilter: 'src_host_address',
      isSelected: false,
      value: f => f.fields.SrcK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srchostname,
      group: t('Source'),
      name: t('Node Name'),
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
  return [
    {
      id: ColumnsId.dstname,
      group: t('Destination'),
      name: t('Name'),
      fieldName: 'DstK8S_Name',
      quickFilter: 'dst_name',
      isSelected: true,
      value: f => f.fields.DstK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstowner,
      group: t('Destination'),
      name: t('Owner'),
      fieldName: 'DstK8S_OwnerName',
      quickFilter: 'dst_owner_name',
      isSelected: false,
      value: f => f.labels.DstK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dsttype,
      group: t('Destination'),
      name: t('Kind'),
      fieldName: 'DstK8S_Type',
      quickFilter: 'dst_kind',
      isSelected: false,
      value: f => f.fields.DstK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstownertype,
      group: t('Destination'),
      name: t('Owner Kind'),
      fieldName: 'DstK8S_OwnerType',
      quickFilter: 'dst_kind',
      isSelected: false,
      value: f => f.fields.DstK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstnamespace,
      group: t('Destination'),
      name: t('Namespace'),
      fieldName: 'DstK8S_Namespace',
      quickFilter: 'dst_namespace',
      isSelected: false,
      value: f => f.labels.DstK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstaddr,
      group: t('Destination'),
      name: t('IP'),
      fieldName: 'DstAddr',
      quickFilter: 'dst_address',
      isSelected: false,
      value: f => f.fields.DstAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstport,
      group: t('Destination'),
      name: t('Port'),
      fieldName: 'DstPort',
      quickFilter: 'dst_port',
      isSelected: true,
      value: f => f.fields.DstPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.dstmac,
      group: t('Destination'),
      name: t('MAC'),
      fieldName: 'DstMac',
      quickFilter: 'dst_mac',
      isSelected: false,
      value: f => f.fields.DstMac,
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dsthostaddr,
      group: t('Destination'),
      name: t('Node IP'),
      fieldName: 'DstK8S_HostIP',
      quickFilter: 'dst_host_address',
      isSelected: false,
      value: f => f.fields.DstK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dsthostname,
      group: t('Destination'),
      name: t('Node Name'),
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
            f.fields.SrcPort,
            f.fields.SrcK8S_Type,
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
            f.fields.SrcPort,
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
        value: f => getConcatenatedValue(f.fields.SrcAddr, f.fields.SrcPort),
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
            f.fields.DstPort,
            f.fields.DstK8S_Type,
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
            f.fields.DstPort,
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
        value: f => getConcatenatedValue(f.fields.DstAddr, f.fields.DstPort),
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
      fieldName: 'FlowDirection',
      isSelected: true,
      value: f => f.labels.FlowDirection,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      fieldName: 'Bytes',
      isSelected: true,
      value: f => f.fields.Bytes,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      fieldName: 'Packets',
      isSelected: true,
      value: f => f.fields.Packets,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.duration,
      name: t('Duration'),
      tooltip: t('Time elapsed between flow Start Time and End Time.'),
      isSelected: false,
      value: f => f.fields.TimeFlowEndMs - f.fields.TimeFlowStartMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.collectiontime,
      name: t('Collection Time'),
      tooltip: t('Reception time of the flow by the flow collector.'),
      fieldName: 'TimeReceived',
      isSelected: true,
      value: f => f.fields.TimeReceived * 1000,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 15
    },
    {
      id: ColumnsId.collectionlatency,
      name: t('Collection Latency'),
      tooltip: t('Time elapsed between flow End Time and Collection Time.'),
      isSelected: false,
      value: f => f.fields.TimeReceived * 1000 - f.fields.TimeFlowEndMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.recordtype,
      name: t('Record Type'),
      isSelected: true,
      value: f => f.labels._RecordType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.connectionid,
      name: t('Connection ID'),
      isSelected: true,
      value: f => f.fields._HashId || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 12
    },
    {
      id: ColumnsId.bytesab,
      name: t('Bytes AB'),
      isSelected: true,
      value: f => f.fields.Bytes_AB || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.bytesba,
      name: t('Bytes BA'),
      isSelected: true,
      value: f => f.fields.Bytes_BA || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.packetsab,
      name: t('Packets AB'),
      isSelected: true,
      value: f => f.fields.Packets_AB || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.packetsba,
      name: t('Packets BA'),
      isSelected: true,
      value: f => f.fields.Packets_BA || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.isfirst,
      name: t('Is First'),
      isSelected: true,
      value: f => f.fields._IsFirst || '',
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
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
        'Time of the first packet observed per flow. Unlike End Time, it is not used in queries to select flows in an interval.'
      ),
      fieldName: 'TimeFlowStartMs',
      isSelected: false,
      value: f => f.fields.TimeFlowStartMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 15
    },
    {
      id: ColumnsId.endtime,
      name: t('End Time'),
      tooltip: t(
        // eslint-disable-next-line max-len
        'Time of the last packet observed per flow. This is what is used in queries to select flows in an interval.'
      ),
      fieldName: 'TimeFlowEndMs',
      isSelected: true,
      value: f => f.fields.TimeFlowEndMs,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 15
    }
  ];

  if (withCommonFields) {
    return [
      ...timeCols,
      ...getSrcDstColumns(t, withConcatenatedFields),
      ...getCommonColumns(t, withConcatenatedFields),
      ...getExtraColumns(t)
    ];
  } else {
    return [...timeCols, ...getSrcDstColumns(t, withConcatenatedFields), ...getExtraColumns(t)];
  }
};
