import { TFunction } from 'i18next';
import _ from 'lodash';
import { Fields, Labels, Record } from '../api/ipfix';
import { compareIPs } from '../utils/ip';
import { comparePorts } from '../utils/port';
import { compareProtocols } from '../utils/protocol';
import { compareNumbers, compareStrings } from './base-compare';
import { FilterType } from './filters';

export enum ColumnsId {
  timestamp = 'timestamp',
  type = 'K8S_Type',
  srctype = 'SrcK8S_Type',
  dsttype = 'DstK8S_Type',
  namespace = 'Namespace',
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
  srchost = 'SrcK8S_HostIP',
  dsthost = 'DstK8S_HostIP',
  flowdir = 'FlowDirection'
}

export interface Column {
  id: ColumnsId;
  ids?: ColumnsId[];
  group?: string;
  name: string;
  fieldName?: keyof Fields | keyof Labels | 'Timestamp';
  isSelected: boolean;
  filterType: FilterType;
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
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_Name, f.fields.DstK8S_Name),
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.type,
      name: t('Kinds'),
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_Type, f.fields.DstK8S_Type),
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.owner,
      name: t('Owners'),
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.labels.SrcK8S_OwnerName, f.labels.DstK8S_OwnerName),
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.ownertype,
      name: t('Owner Kinds'),
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_OwnerType, f.fields.DstK8S_OwnerType),
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.namespace,
      name: t('Namespaces'),
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.labels.SrcK8S_Namespace, f.labels.DstK8S_Namespace),
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.addr,
      name: t('Addresses'),
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => getSrcOrDstValue(f.fields.SrcAddr, f.fields.DstAddr),
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.port,
      name: t('Ports'),
      isSelected: false,
      filterType: FilterType.PORT,
      value: f => getSrcOrDstValue(f.fields.SrcPort, f.fields.DstPort),
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.host,
      name: t('Hosts'),
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => getSrcOrDstValue(f.fields.SrcK8S_HostIP, f.fields.DstK8S_HostIP),
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    }
  ];

  if (withConcatenatedFields) {
    return [
      ...commonColumns,
      {
        id: ColumnsId.kubeobject,
        name: t('Kubernetes Objects'),
        isSelected: false,
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        name: t('Addresses & Ports'),
        isSelected: false,
        filterType: FilterType.ADDRESS_PORT,
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
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
      value: f => f.fields.SrcK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srctype,
      group: t('Source'),
      name: t('Kind'),
      fieldName: 'SrcK8S_Type',
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => f.fields.SrcK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcowner,
      group: t('Source'),
      name: t('Owner'),
      fieldName: 'SrcK8S_OwnerName',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => f.labels.SrcK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcownertype,
      group: t('Source'),
      name: t('Owner Kind'),
      fieldName: 'SrcK8S_OwnerType',
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => f.fields.SrcK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcnamespace,
      group: t('Source'),
      name: t('Namespace'),
      fieldName: 'SrcK8S_Namespace',
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
      value: f => f.labels.SrcK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcaddr,
      group: t('Source'),
      name: t('Address'),
      fieldName: 'SrcAddr',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.SrcAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcport,
      group: t('Source'),
      name: t('Port'),
      fieldName: 'SrcPort',
      isSelected: true,
      filterType: FilterType.PORT,
      value: f => f.fields.SrcPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.srchost,
      group: t('Source'),
      name: t('Host'),
      fieldName: 'SrcK8S_HostIP',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.SrcK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
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
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
      value: f => f.fields.DstK8S_Name || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstowner,
      group: t('Destination'),
      name: t('Owner'),
      fieldName: 'DstK8S_OwnerName',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => f.labels.DstK8S_OwnerName || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dsttype,
      group: t('Destination'),
      name: t('Kind'),
      fieldName: 'DstK8S_Type',
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => f.fields.DstK8S_Type || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstownertype,
      group: t('Destination'),
      name: t('Owner Kind'),
      fieldName: 'DstK8S_OwnerType',
      isSelected: false,
      filterType: FilterType.KIND,
      value: f => f.fields.DstK8S_OwnerType || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstnamespace,
      group: t('Destination'),
      name: t('Namespace'),
      fieldName: 'DstK8S_Namespace',
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
      value: f => f.labels.DstK8S_Namespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstaddr,
      group: t('Destination'),
      name: t('Address'),
      fieldName: 'DstAddr',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.DstAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstport,
      group: t('Destination'),
      name: t('Port'),
      fieldName: 'DstPort',
      isSelected: true,
      filterType: FilterType.PORT,
      value: f => f.fields.DstPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.dsthost,
      group: t('Destination'),
      name: t('Host'),
      fieldName: 'DstK8S_HostIP',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.DstK8S_HostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
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
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        name: t('Address & Port'),
        isSelected: false,
        filterType: FilterType.ADDRESS_PORT,
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
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        filterType: FilterType.KIND_NAMESPACE_NAME,
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
        name: t('Address & Port'),
        isSelected: false,
        filterType: FilterType.ADDRESS_PORT,
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
      isSelected: false,
      filterType: FilterType.PROTOCOL,
      value: f => f.fields.Proto,
      sort: (a, b, col) => compareProtocols(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.flowdir,
      name: t('Direction'),
      fieldName: 'FlowDirection',
      isSelected: false,
      // filters are managed via QuickFilters rather than per-column filter search, so set filterType to NONE
      filterType: FilterType.NONE,
      value: f => f.labels.FlowDirection,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      fieldName: 'Bytes',
      isSelected: true,
      filterType: FilterType.NONE,
      value: f => f.fields.Bytes,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      fieldName: 'Packets',
      isSelected: true,
      filterType: FilterType.NONE,
      value: f => f.fields.Packets,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 5
    }
  ];
};

export const getDefaultColumns = (t: TFunction, withCommonFields = true, withConcatenatedFields = true): Column[] => {
  const timestamp: Column = {
    id: ColumnsId.timestamp,
    name: t('Date & time'),
    fieldName: 'Timestamp',
    isSelected: true,
    filterType: FilterType.NONE,
    value: f => f.timestamp,
    sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
    width: 15
  };

  if (withCommonFields) {
    return [
      timestamp,
      ...getSrcDstColumns(t, withConcatenatedFields),
      ...getCommonColumns(t, withConcatenatedFields),
      ...getExtraColumns(t)
    ];
  } else {
    return [timestamp, ...getSrcDstColumns(t, withConcatenatedFields), ...getExtraColumns(t)];
  }
};
