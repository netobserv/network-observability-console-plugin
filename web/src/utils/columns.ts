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
  pod = 'Pod',
  namespace = 'Namespace',
  addr = 'Addr',
  port = 'Port',
  wkd = 'Workload',
  flowdir = 'FlowDirection',
  wkdkind = 'WorkloadKind',
  host = 'HostIP',
  proto = 'Proto',
  bytes = 'Bytes',
  packets = 'Packets',
  fqdn = 'FQDN',
  srcfqdn = 'SrcFQDN',
  dstfqdn = 'DstFQDN',
  srcpod = 'SrcPod',
  dstpod = 'DstPod',
  srcnamespace = 'SrcNamespace',
  dstnamespace = 'DstNamespace',
  srcaddr = 'SrcAddr',
  dstaddr = 'DstAddr',
  srcport = 'SrcPort',
  dstport = 'DstPort',
  srcwkd = 'SrcWorkload',
  dstwkd = 'DstWorkload',
  srcwkdkind = 'SrcWorkloadKind',
  dstwkdkind = 'DstWorkloadKind',
  srchost = 'SrcHostIP',
  dsthost = 'DstHostIP'
}

export interface Column {
  id: ColumnsId;
  ids?: ColumnsId[];
  group?: string;
  name: string;
  fieldName: string;
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

export const getColumnGroups = (columns: Column[], commonGroupName?: string) => {
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

export const getFullQualifiedNameValue = (namespace?: string, pod?: string, ip?: string, port?: number): string[] => {
  if (namespace && pod) {
    return [namespace, pod];
  } else if (ip && port) {
    return [ip, String(port)];
  } else {
    return ['', ''];
  }
};

export const getCommonColumns = (t: TFunction, withFQDNFields = true): Column[] => {
  const commonColumns: Column[] = [
    {
      id: ColumnsId.pod,
      name: t('Pods'),
      fieldName: 'Pod',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.fields.SrcPod, f.fields.DstPod),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.wkd,
      name: t('Workloads'),
      fieldName: 'Workload',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.labels.SrcWorkload, f.labels.DstWorkload),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.wkdkind,
      name: t('Kinds'),
      fieldName: 'WorkloadKind',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.fields.SrcWorkloadKind, f.fields.DstWorkloadKind),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.namespace,
      name: t('Namespaces'),
      fieldName: 'Namespace',
      isSelected: false,
      filterType: FilterType.K8S_NAMES,
      value: f => getSrcOrDstValue(f.labels.SrcNamespace, f.labels.DstNamespace),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 15
    },
    {
      id: ColumnsId.addr,
      name: t('Addresses'),
      fieldName: 'Addr',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => getSrcOrDstValue(f.fields.SrcAddr, f.fields.DstAddr),
      sort: (a, b, col) => compareIPs((col.value(a) as string[]).join('.'), (col.value(b) as string[]).join('.')),
      width: 10
    },
    {
      id: ColumnsId.port,
      name: t('Ports'),
      fieldName: 'Port',
      isSelected: false,
      filterType: FilterType.PORT,
      value: f => getSrcOrDstValue(f.fields.SrcPort, f.fields.DstPort),
      sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
      width: 10
    },
    {
      id: ColumnsId.host,
      name: t('Hosts'),
      fieldName: 'HostIP',
      isSelected: false,
      filterType: FilterType.ADDRESS,
      value: f => getSrcOrDstValue(f.fields.SrcHostIP, f.fields.DstHostIP),
      sort: (a, b, col) => compareIPs((col.value(a) as string[]).join('.'), (col.value(b) as string[]).join('.')),
      width: 10
    }
  ];

  if (withFQDNFields) {
    return [
      ...commonColumns,
      {
        id: ColumnsId.fqdn,
        name: t('FQDN'),
        fieldName: 'FQDN',
        isSelected: false,
        filterType: FilterType.FQDN,
        value: f => [
          ...getFullQualifiedNameValue(f.labels.SrcNamespace, f.fields.SrcPod, f.fields.SrcAddr, f.fields.SrcPort),
          ...getFullQualifiedNameValue(f.labels.DstNamespace, f.fields.DstPod, f.fields.DstAddr, f.fields.DstPort)
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
      id: ColumnsId.srcpod,
      group: t('Source'),
      name: t('Pod'),
      fieldName: 'SrcPod',
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
    }
  ];
};

export const getDstColumns = (t: TFunction): Column[] => {
  return [
    {
      id: ColumnsId.dstpod,
      group: t('Destination'),
      name: t('Pod'),
      fieldName: 'DstPod',
      isSelected: true,
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
      filterType: FilterType.K8S_NAMES,
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
    }
  ];
};

export const getSrcDstColumns = (t: TFunction, withFQDNFields = true): Column[] => {
  if (withFQDNFields) {
    return [
      ...getSrcColumns(t),
      {
        id: ColumnsId.srcfqdn,
        group: t('Source'),
        name: t('FQDN'),
        fieldName: 'SrcFQDN',
        isSelected: false,
        filterType: FilterType.FQDN,
        value: f =>
          getFullQualifiedNameValue(f.labels.SrcNamespace, f.fields.SrcPod, f.fields.SrcAddr, f.fields.SrcPort),
        sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
        width: 15
      },
      ...getDstColumns(t),
      {
        id: ColumnsId.dstfqdn,
        group: t('Destination'),
        name: t('FQDN'),
        fieldName: 'DstFQDN',
        isSelected: false,
        filterType: FilterType.FQDN,
        value: f =>
          getFullQualifiedNameValue(f.labels.DstNamespace, f.fields.DstPod, f.fields.DstAddr, f.fields.DstPort),
        sort: (a, b, col) => compareStrings((col.value(a) as string[]).join(''), (col.value(b) as string[]).join('')),
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

export const getDefaultColumns = (t: TFunction, withCommonFields = true, withFQDNFields = true): Column[] => {
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
      ...getSrcDstColumns(t, withFQDNFields),
      ...getCommonColumns(t, withFQDNFields),
      ...getExtraColumns(t)
    ];
  } else {
    return [timestamp, ...getSrcDstColumns(t, withFQDNFields), ...getExtraColumns(t)];
  }
};
