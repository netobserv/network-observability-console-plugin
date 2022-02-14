import { TFunction } from 'i18next';
import _ from 'lodash';
import { Record } from '../api/ipfix';
import { compareIPs } from '../utils/ip';
import { comparePorts } from '../utils/port';
import { compareProtocols } from '../utils/protocol';
import { compareNumbers, compareStrings } from './base-compare';
import { FilterType } from './filters';

export enum ColumnsId {
  timestamp = 'timestamp',
  srcpod = 'SrcPod',
  dstpod = 'DstPod',
  srcnamespace = 'SrcNamespace',
  dstnamespace = 'DstNamespace',
  srcaddr = 'SrcAddr',
  dstaddr = 'DstAddr',
  srcport = 'SrcPort',
  dstport = 'DstPort',
  proto = 'Proto',
  bytes = 'Bytes',
  packets = 'Packets',
  srcwkd = 'SrcWorkload',
  dstwkd = 'DstWorkload',
  srcwkdkind = 'SrcWorkloadKind',
  dstwkdkind = 'DstWorkloadKind',
  srchost = 'SrcHostIP',
  dsthost = 'DstHostIP',
  flowdir = 'FlowDirection'
}

export interface Column {
  id: ColumnsId;
  group?: string;
  name: string;
  fieldName: string;
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
      id: ColumnsId.srcpod,
      group: t('Source'),
      name: t('Pod'),
      fieldName: 'SrcPod',
      isSelected: true,
      filterType: FilterType.K8S_LABEL,
      value: f => f.fields.SrcPod || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcwkd,
      group: t('Source'),
      name: t('Workload'),
      fieldName: 'SrcWorkload',
      isSelected: false,
      filterType: FilterType.K8S_LABEL,
      value: f => f.labels.SrcWorkload || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.srcwkdkind,
      group: t('Source'),
      name: t('Kind'),
      fieldName: 'SrcWorkloadKind',
      isSelected: false,
      filterType: FilterType.K8S_LABEL,
      value: f => f.fields.SrcWorkloadKind || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.srcnamespace,
      group: t('Source'),
      name: t('Namespace'),
      fieldName: 'SrcNamespace',
      isSelected: true,
      filterType: FilterType.K8S_LABEL,
      value: f => f.labels.SrcNamespace || '',
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
      fieldName: 'SrcHostIP',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.SrcHostIP || '',
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstpod,
      group: t('Destination'),
      name: t('Pod'),
      fieldName: 'DstPod',
      isSelected: true,
      filterType: FilterType.K8S_LABEL,
      value: f => f.fields.DstPod || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstwkd,
      group: t('Destination'),
      name: t('Workload'),
      fieldName: 'DstWorkload',
      isSelected: false,
      filterType: FilterType.K8S_LABEL,
      value: f => f.labels.DstWorkload || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 15
    },
    {
      id: ColumnsId.dstwkdkind,
      group: t('Destination'),
      name: t('Kind'),
      fieldName: 'DstWorkloadKind',
      isSelected: false,
      filterType: FilterType.K8S_LABEL,
      value: f => f.fields.DstWorkloadKind || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 10
    },
    {
      id: ColumnsId.dstnamespace,
      group: t('Destination'),
      name: t('Namespace'),
      fieldName: 'DstNamespace',
      isSelected: true,
      filterType: FilterType.K8S_LABEL,
      value: f => f.labels.DstNamespace || '',
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
      fieldName: 'DstHostIP',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.DstHostIP || '',
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
      value: f => f.fields.FlowDirection,
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
