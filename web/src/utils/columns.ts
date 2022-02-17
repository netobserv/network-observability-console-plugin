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
  srcname = 'SrcK8S_Name',
  dstname = 'DstK8S_Name',
  srctype = 'SrcK8S_Type',
  dsttype = 'DstK8S_Type',
  srcnamespace = 'SrcK8S_Namespace',
  dstnamespace = 'DstK8S_Namespace',
  srcaddr = 'SrcAddr',
  dstaddr = 'DstAddr',
  srcport = 'SrcPort',
  dstport = 'DstPort',
  proto = 'Proto',
  bytes = 'Bytes',
  packets = 'Packets',
  srcowner = 'SrcK8S_OwnerName',
  dstowner = 'DstK8S_OwnerName',
  srcownertype = 'SrcK8S_OwnerType',
  dstownertype = 'DstK8S_OwnerType',
  srchost = 'SrcK8S_HostIP',
  dsthost = 'DstK8S_HostIP',
  flowdir = 'FlowDirection'
}

export interface Column {
  id: ColumnsId;
  group?: string;
  name: string;
  fieldName: keyof Fields | keyof Labels | 'Timestamp';
  isSelected: boolean;
  filterType: FilterType;
  value: (flow: Record) => string | number;
  sort(a: Record, b: Record, col: Column): number;
  // width in "em"
  width: number;
}

export type ColumnGroup = {
  title?: string;
  columns: Column[];
};

export const getColumnGroups = (columns: Column[]) => {
  const groups: ColumnGroup[] = [];
  _.each(columns, col => {
    if (col.group && _.last(groups)?.title === col.group) {
      _.last(groups)!.columns.push(col);
    } else {
      groups.push({ title: col.group, columns: [col] });
    }
  });

  return groups;
};

export const getFullColumnName = (col?: Column) => {
  if (col) {
    return !col.group ? col.name : `${col.group} ${col.name}`;
  } else {
    return '';
  }
};

export const getDefaultColumns = (t: TFunction): Column[] => {
  return [
    {
      id: ColumnsId.timestamp,
      name: t('Date & time'),
      fieldName: 'Timestamp',
      isSelected: true,
      filterType: FilterType.NONE,
      value: f => f.timestamp,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 15
    },
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
    },
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
    },
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
