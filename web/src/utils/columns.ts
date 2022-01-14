import { TFunction } from 'i18next';
import { Record } from '../api/loki';
import { compareIPs } from '../utils/ip';
import { comparePorts } from '../utils/port';
import { compareProtocols } from '../utils/protocol';
import { compareNumbers, compareStrings } from './base-compare';

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
  packets = 'Packets'
}

export interface Column {
  id: ColumnsId;
  name: string;
  isSelected: boolean;
  defaultOrder: number;
  filterType: FilterType;
  value: (flow: Record) => string | number;
  sort(a: Record, b: Record, col: Column): number;
  //specific header width - Allowed values are limited, check TableComposable BaseCellProps with definition
  width: 10 | 15 | 20 | 25 | 30 | 35 | 40 | 45 | 50 | 60 | 70 | 80 | 90 | 100;
}

export interface FilterValue {
  v: string;
  display?: string;
}

export interface Filter {
  colId: ColumnsId;
  values: FilterValue[];
}

export enum FilterType {
  NONE,
  POD,
  ADDRESS,
  NAMESPACE,
  PORT,
  PROTOCOL,
  NUMBER
}

export const getDefaultColumns = (t: TFunction): Column[] => {
  return [
    {
      id: ColumnsId.timestamp,
      name: t('Date & time'),
      isSelected: true,
      defaultOrder: 1,
      filterType: FilterType.NONE,
      value: f => f.timestamp,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 30
    },
    {
      id: ColumnsId.srcpod,
      name: t('Src pod'),
      isSelected: true,
      defaultOrder: 2,
      filterType: FilterType.POD,
      value: f => f.fields.SrcPod || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 30
    },
    {
      id: ColumnsId.dstpod,
      name: t('Dst pod'),
      isSelected: true,
      defaultOrder: 3,
      filterType: FilterType.POD,
      value: f => f.fields.DstPod || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 30
    },
    {
      id: ColumnsId.srcnamespace,
      name: t('Src namespace'),
      isSelected: true,
      defaultOrder: 4,
      filterType: FilterType.NAMESPACE,
      value: f => f.labels.SrcNamespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 30
    },
    {
      id: ColumnsId.dstnamespace,
      name: t('Dst namespace'),
      isSelected: true,
      defaultOrder: 5,
      filterType: FilterType.NAMESPACE,
      value: f => f.labels.DstNamespace || '',
      sort: (a, b, col) => compareStrings(col.value(a) as string, col.value(b) as string),
      width: 30
    },
    {
      id: ColumnsId.srcaddr,
      name: t('Src address'),
      isSelected: false,
      defaultOrder: 6,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.SrcAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 20
    },
    {
      id: ColumnsId.dstaddr,
      name: t('Dst address'),
      isSelected: false,
      defaultOrder: 7,
      filterType: FilterType.ADDRESS,
      value: f => f.fields.DstAddr,
      sort: (a, b, col) => compareIPs(col.value(a) as string, col.value(b) as string),
      width: 20
    },
    {
      id: ColumnsId.srcport,
      name: t('Src port'),
      isSelected: true,
      defaultOrder: 8,
      filterType: FilterType.PORT,
      value: f => f.fields.SrcPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 20
    },
    {
      id: ColumnsId.dstport,
      name: t('Dst port'),
      isSelected: true,
      defaultOrder: 9,
      filterType: FilterType.PORT,
      value: f => f.fields.DstPort,
      sort: (a, b, col) => comparePorts(col.value(a) as number, col.value(b) as number),
      width: 20
    },
    {
      id: ColumnsId.proto,
      name: t('Protocol'),
      isSelected: false,
      defaultOrder: 10,
      filterType: FilterType.PROTOCOL,
      value: f => f.fields.Proto,
      sort: (a, b, col) => compareProtocols(col.value(a) as number, col.value(b) as number),
      width: 20
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      isSelected: true,
      defaultOrder: 11,
      filterType: FilterType.NONE,
      value: f => f.fields.Bytes,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 10
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      isSelected: true,
      defaultOrder: 12,
      filterType: FilterType.NONE,
      value: f => f.fields.Packets,
      sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
      width: 10
    }
  ];
};
