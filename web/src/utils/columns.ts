import { ParsedStream } from '../api/loki';

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
  DATETIME,
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
      filterType: FilterType.DATETIME
    },
    {
      id: ColumnsId.srcpod,
      name: t('Src pod'),
      isSelected: true,
      defaultOrder: 2,
      filterType: FilterType.POD
    },
    {
      id: ColumnsId.dstpod,
      name: t('Dst pod'),
      isSelected: true,
      defaultOrder: 3,
      filterType: FilterType.POD
    },
    {
      id: ColumnsId.srcnamespace,
      name: t('Src namespace'),
      isSelected: true,
      defaultOrder: 4,
      filterType: FilterType.NAMESPACE
    },
    {
      id: ColumnsId.dstnamespace,
      name: t('Dst namespace'),
      isSelected: true,
      defaultOrder: 5,
      filterType: FilterType.NAMESPACE
    },
    {
      id: ColumnsId.srcaddr,
      name: t('Src address'),
      isSelected: true,
      defaultOrder: 6,
      filterType: FilterType.ADDRESS
    },
    {
      id: ColumnsId.dstaddr,
      name: t('Dst address'),
      isSelected: true,
      defaultOrder: 7,
      filterType: FilterType.ADDRESS
    },
    {
      id: ColumnsId.srcport,
      name: t('Src port'),
      isSelected: true,
      defaultOrder: 8,
      filterType: FilterType.PORT
    },
    {
      id: ColumnsId.dstport,
      name: t('Dst port'),
      isSelected: true,
      defaultOrder: 9,
      filterType: FilterType.PORT
    },
    {
      id: ColumnsId.proto,
      name: t('Protocol'),
      isSelected: true,
      defaultOrder: 10,
      filterType: FilterType.PROTOCOL
    },
    {
      id: ColumnsId.bytes,
      name: t('Bytes'),
      isSelected: true,
      defaultOrder: 11,
      filterType: FilterType.NONE
    },
    {
      id: ColumnsId.packets,
      name: t('Packets'),
      isSelected: true,
      defaultOrder: 12,
      filterType: FilterType.NONE
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
