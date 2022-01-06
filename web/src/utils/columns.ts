import { TFunction } from 'i18next';
import { ParsedStream } from '../api/loki';
import protocols from 'protocol-numbers';
import { ipCompare } from '../utils/ip';
import { comparePort } from '../utils/port';

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
  id: string;
  name: string;
  isSelected: boolean;
  defaultOrder: number;
  filterType: FilterType;
  value: (flow: ParsedStream) => string | number;
  sort(a: ParsedStream, b: ParsedStream, col: Column): number;
}

export interface FilterValue {
  v: string;
  display?: string;
}

export interface Filter {
  colId: string;
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
      sort: (a, b, col) => sortNumbers(col.value(a) as number, col.value(b) as number)
    },
    {
      id: ColumnsId.srcpod,
      name: t('Src pod'),
      isSelected: true,
      defaultOrder: 2,
      filterType: FilterType.POD,
      value: f => f.ipfix.SrcPod,
      sort: (a, b, col) => sortStrings(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.dstpod,
      name: t('Dst pod'),
      isSelected: true,
      defaultOrder: 3,
      filterType: FilterType.POD,
      value: f => f.ipfix.DstPod,
      sort: (a, b, col) => sortStrings(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.srcnamespace,
      name: t('Src namespace'),
      isSelected: true,
      defaultOrder: 4,
      filterType: FilterType.NAMESPACE,
      value: f => f.labels.SrcNamespace,
      sort: (a, b, col) => sortStrings(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.dstnamespace,
      name: t('Dst namespace'),
      isSelected: true,
      defaultOrder: 5,
      filterType: FilterType.NAMESPACE,
      value: f => f.labels.DstNamespace,
      sort: (a, b, col) => sortStrings(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.srcaddr,
      name: t('Src address'),
      isSelected: true,
      defaultOrder: 6,
      filterType: FilterType.ADDRESS,
      value: f => f.ipfix.SrcAddr,
      sort: (a, b, col) => ipCompare(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.dstaddr,
      name: t('Dst address'),
      isSelected: true,
      defaultOrder: 7,
      filterType: FilterType.ADDRESS,
      value: f => f.ipfix.DstAddr,
      sort: (a, b, col) => ipCompare(col.value(a) as string, col.value(b) as string)
    },
    {
      id: ColumnsId.srcport,
      name: t('Src port'),
      isSelected: true,
      defaultOrder: 8,
      filterType: FilterType.PORT,
      value: f => f.ipfix.SrcPort,
      sort: (a, b, col) => comparePort(col.value(a), col.value(b))
    },
    {
      id: ColumnsId.dstport,
      name: t('Dst port'),
      isSelected: true,
      defaultOrder: 9,
      filterType: FilterType.PORT,
      value: f => f.ipfix.DstPort,
      sort: (a, b, col) => comparePort(col.value(a), col.value(b))
    },
    {
      id: ColumnsId.proto,
      name: t('Protocol'),
      isSelected: true,
      defaultOrder: 10,
      filterType: FilterType.PROTOCOL,
      value: f => f.ipfix.Proto,
      sort: (a, b, col) => sortProtocols(col.value(a) as number, col.value(b) as number)
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      isSelected: true,
      defaultOrder: 11,
      filterType: FilterType.NONE,
      value: f => f.ipfix.Bytes,
      sort: (a, b, col) => sortNumbers(col.value(a) as number, col.value(b) as number)
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      isSelected: true,
      defaultOrder: 12,
      filterType: FilterType.NONE,
      value: f => f.ipfix.Packets,
      sort: (a, b, col) => sortNumbers(col.value(a) as number, col.value(b) as number)
    }
  ];
};

const sortNumbers = (a: number, b: number) => {
  if (!isNaN(a) && !isNaN(b)) {
    return a - b;
  } else if (!isNaN(a)) {
    return 1;
  }
  return -1;
};

const sortStrings = (a: string, b: string) => {
  if (a && b) {
    return a.localeCompare(b);
  } else if (a) {
    return 1;
  }
  return -1;
};

const sortProtocols = (a: number, b: number) => {
  return sortStrings(protocols[a]?.name, protocols[b]?.name);
};
