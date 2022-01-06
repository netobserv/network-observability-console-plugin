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
  sort(a: ParsedStream, b: ParsedStream, isDesc: boolean): number;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDefaultColumns = (t?: any) => {
  if (!t) {
    t = (key: string) => key;
  }

  return [
    {
      id: ColumnsId.timestamp,
      name: t('Date & time'),
      isSelected: true,
      defaultOrder: 1,
      filterType: FilterType.NONE,
      sort: getSortFunctionFromColumnId(ColumnsId.timestamp)
    },
    {
      id: ColumnsId.srcpod,
      name: t('Src pod'),
      isSelected: true,
      defaultOrder: 2,
      filterType: FilterType.POD,
      sort: getSortFunctionFromColumnId(ColumnsId.srcpod)
    },
    {
      id: ColumnsId.dstpod,
      name: t('Dst pod'),
      isSelected: true,
      defaultOrder: 3,
      filterType: FilterType.POD,
      sort: getSortFunctionFromColumnId(ColumnsId.dstpod)
    },
    {
      id: ColumnsId.srcnamespace,
      name: t('Src namespace'),
      isSelected: true,
      defaultOrder: 4,
      filterType: FilterType.NAMESPACE,
      sort: getSortFunctionFromColumnId(ColumnsId.srcnamespace)
    },
    {
      id: ColumnsId.dstnamespace,
      name: t('Dst namespace'),
      isSelected: true,
      defaultOrder: 5,
      filterType: FilterType.NAMESPACE,
      sort: getSortFunctionFromColumnId(ColumnsId.dstnamespace)
    },
    {
      id: ColumnsId.srcaddr,
      name: t('Src address'),
      isSelected: true,
      defaultOrder: 6,
      filterType: FilterType.ADDRESS,
      sort: getSortFunctionFromColumnId(ColumnsId.srcaddr)
    },
    {
      id: ColumnsId.dstaddr,
      name: t('Dst address'),
      isSelected: true,
      defaultOrder: 7,
      filterType: FilterType.ADDRESS,
      sort: getSortFunctionFromColumnId(ColumnsId.dstaddr)
    },
    {
      id: ColumnsId.srcport,
      name: t('Src port'),
      isSelected: true,
      defaultOrder: 8,
      filterType: FilterType.PORT,
      sort: getSortFunctionFromColumnId(ColumnsId.srcport)
    },
    {
      id: ColumnsId.dstport,
      name: t('Dst port'),
      isSelected: true,
      defaultOrder: 9,
      filterType: FilterType.PORT,
      sort: getSortFunctionFromColumnId(ColumnsId.dstport)
    },
    {
      id: ColumnsId.proto,
      name: t('Protocol'),
      isSelected: true,
      defaultOrder: 10,
      filterType: FilterType.PROTOCOL,
      sort: getSortFunctionFromColumnId(ColumnsId.proto)
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      isSelected: true,
      defaultOrder: 11,
      filterType: FilterType.NONE,
      sort: getSortFunctionFromColumnId(ColumnsId.bytes)
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      isSelected: true,
      defaultOrder: 12,
      filterType: FilterType.NONE,
      sort: getSortFunctionFromColumnId(ColumnsId.packets)
    }
  ];
};

export const getFlowValueFromColumnId = (flow: ParsedStream, colId: string) => {
  switch (colId) {
    case ColumnsId.timestamp: {
      return flow.value.timestamp;
    }
    case ColumnsId.srcpod: {
      return flow.value.IPFIX.SrcPod;
    }
    case ColumnsId.dstpod: {
      return flow.value.IPFIX.DstPod;
    }
    case ColumnsId.srcnamespace: {
      return flow.labels['SrcNamespace'];
    }
    case ColumnsId.dstnamespace: {
      return flow.labels['DstNamespace'];
    }
    case ColumnsId.srcaddr: {
      return flow.value.IPFIX.SrcAddr;
    }
    case ColumnsId.dstaddr: {
      return flow.value.IPFIX.DstAddr;
    }
    case ColumnsId.srcport: {
      return flow.value.IPFIX.SrcPort;
    }
    case ColumnsId.dstport: {
      return flow.value.IPFIX.DstPort;
    }
    case ColumnsId.proto: {
      return flow.value.IPFIX.Proto;
    }
    case ColumnsId.bytes: {
      return flow.value.IPFIX.Bytes;
    }
    case ColumnsId.packets: {
      return flow.value.IPFIX.Packets;
    }
  }
};

export const getSortFunctionFromColumnId = (colId: ColumnsId) => {
  switch (colId) {
    case ColumnsId.srcport:
    case ColumnsId.dstport: {
      return (a: ParsedStream, b: ParsedStream, isDesc: boolean) => {
        return comparePort(
          getFlowValueFromColumnId(isDesc ? a : b, colId),
          getFlowValueFromColumnId(isDesc ? b : a, colId)
        );
      };
    }
    case ColumnsId.srcaddr:
    case ColumnsId.dstaddr: {
      return (a: ParsedStream, b: ParsedStream, isDesc: boolean) => {
        return ipCompare(
          getFlowValueFromColumnId(isDesc ? a : b, colId) as string,
          getFlowValueFromColumnId(isDesc ? b : a, colId) as string
        );
      };
    }
    case ColumnsId.proto: {
      return (a: ParsedStream, b: ParsedStream, isDesc: boolean) => {
        const f1Name: string = protocols[getFlowValueFromColumnId(isDesc ? a : b, colId)]?.name;
        const f2Name: string = protocols[getFlowValueFromColumnId(isDesc ? b : a, colId)]?.name;
        if (f1Name && f2Name) {
          return f1Name.localeCompare(f2Name);
        } else if (f1Name) {
          return 1;
        } else {
          return -1;
        }
      };
    }
    case ColumnsId.timestamp:
    case ColumnsId.bytes:
    case ColumnsId.packets: {
      return (a: ParsedStream, b: ParsedStream, isDesc: boolean) => {
        const f1Value = Number(getFlowValueFromColumnId(isDesc ? a : b, colId));
        const f2Value = Number(getFlowValueFromColumnId(isDesc ? b : a, colId));
        if (!isNaN(f1Value) && !isNaN(f2Value)) {
          return f1Value - f2Value;
        } else if (!isNaN(f1Value)) {
          return 1;
        } else {
          return -1;
        }
      };
    }
    default: {
      return (a: ParsedStream, b: ParsedStream, isDesc: boolean) => {
        const f1Value = getFlowValueFromColumnId(isDesc ? a : b, colId) as string;
        const f2Value = getFlowValueFromColumnId(isDesc ? b : a, colId) as string;
        if (f1Value && f2Value) {
          return f1Value.localeCompare(f2Value);
        } else if (f1Value) {
          return 1;
        } else {
          return -1;
        }
      };
    }
  }
};
