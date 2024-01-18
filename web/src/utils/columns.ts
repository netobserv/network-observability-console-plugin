import _ from 'lodash';
import { Field, getRecordValue, Record } from '../api/ipfix';
import { FilterId } from '../model/filters';
import { compareNumbers, compareStrings } from './base-compare';
import { compareIPs } from './ip';
import { comparePorts } from './port';
import { compareProtocols } from './protocol';

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
  icmptype = 'IcmpType',
  icmpcode = 'IcmpCode',
  dscp = 'Dscp',
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
  dnserrno = 'DNSErrNo',
  hostaddr = 'K8S_HostIP',
  srchostaddr = 'SrcK8S_HostIP',
  dsthostaddr = 'DstK8S_HostIP',
  hostname = 'K8S_HostName',
  srchostname = 'SrcK8S_HostName',
  dsthostname = 'DstK8S_HostName',
  flowdir = 'FlowDirection',
  flowdirplural = 'FlowDirections',
  rttTime = 'TimeFlowRttMs',
  hashid = '_HashId',
  interface = 'Interface',
  flowdirints = 'FlowDirInts',
  recordtype = 'RecordType',
  bytesab = 'Bytes_AB',
  bytesba = 'Bytes_BA',
  packetsab = 'Packets_AB',
  packetsba = 'Packets_BA',
  isfirst = 'IsFirst',
  numflow = 'numFlowLogs'
}

export interface ColumnConfigDef {
  id: string;
  group?: string;
  name: string;
  field?: string;
  fields?: string[];
  calculated?: string;
  tooltip?: string;
  docURL?: string;
  filter?: string;
  default?: boolean;
  width?: number;
}

export interface Column {
  id: ColumnsId;
  group?: string;
  name: string;
  fieldName?: Field;
  tooltip?: string;
  docURL?: string;
  quickFilter?: FilterId;
  isSelected: boolean;
  isCommon?: boolean;
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

export const getDefaultColumns = (columnDefs: ColumnConfigDef[]): Column[] => {
  const columns: Column[] = [];

  function getColumnOrRecordValue(record: Record, arg: string, defaultValue: string | number) {
    if (arg.startsWith('column.')) {
      const colId = arg.replace('column.', '');
      const found = columns.find(c => c.id === colId);
      if (found) {
        return found.value(record);
      }
      return defaultValue;
    }
    return getRecordValue(record, arg, defaultValue);
  }

  function calculatedValue(record: Record, calculatedValue: string) {
    if (calculatedValue.startsWith('getSrcOrDstValue')) {
      const args = calculatedValue.replaceAll(/getSrcOrDstValue|\(|\)/g, '').split(',');
      if (args.length !== 2) {
        console.error('getDefaultColumns - invalid parameters for getSrcOrDstValue calculated value', calculatedValue);
        return '';
      }
      return getSrcOrDstValue(...args.flatMap(f => getColumnOrRecordValue(record, f, '')));
    } else if (calculatedValue.startsWith('getConcatenatedValue')) {
      const args = calculatedValue.replaceAll(/getConcatenatedValue|\(|\)/g, '').split(',');
      if (args.length < 2) {
        console.error(
          'getDefaultColumns - invalid parameters for getConcatenatedValue calculated value',
          calculatedValue
        );
        return '';
      }
      return getConcatenatedValue(
        getColumnOrRecordValue(record, args[0], '') as string,
        getColumnOrRecordValue(record, args[1], NaN) as number,
        args.length > 2 ? (getColumnOrRecordValue(record, args[2], '') as string) : undefined,
        args.length > 3 ? (getColumnOrRecordValue(record, args[3], '') as string) : undefined
      );
    } else if (calculatedValue.startsWith('substract')) {
      const args = calculatedValue.replaceAll(/substract|\(|\)/g, '').split(',');
      if (args.length < 2) {
        console.error('getDefaultColumns - invalid parameters for substract calculated value', calculatedValue);
        return '';
      }
      return (
        (getColumnOrRecordValue(record, args[0], 0) as number) - (getColumnOrRecordValue(record, args[1], 0) as number)
      );
    } else if (calculatedValue.startsWith('multiply')) {
      const args = calculatedValue.replaceAll(/multiply|\(|\)/g, '').split(',');
      if (args.length < 2) {
        console.error('getDefaultColumns - invalid parameters for multiply calculated value', calculatedValue);
        return '';
      }
      return (getColumnOrRecordValue(record, args[0], 0) as number) * Number(args[1]);
    }
    return '';
  }

  // add a column for each definition
  columnDefs.forEach(d => {
    columns.push({
      id: d.id as ColumnsId,
      group: !_.isEmpty(d.group) ? d.group : undefined,
      name: d.name,
      fieldName: !_.isEmpty(d.field) ? (d.field as Field) : undefined,
      tooltip: !_.isEmpty(d.tooltip) ? d.tooltip : undefined,
      docURL: !_.isEmpty(d.docURL) ? d.docURL : undefined,
      quickFilter: !_.isEmpty(d.filter) ? (d.filter as FilterId) : undefined,
      isSelected: d.default === true,
      isCommon: !_.isEmpty(d.calculated),
      value: (r: Record) => {
        if (!_.isEmpty(d.calculated)) {
          if (d.calculated!.startsWith('[') && d.calculated!.endsWith(']')) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result: any = [];
            if (d.calculated?.includes('column')) {
              // consider all items as columns or fields
              const values = d.calculated!.replaceAll(/\[|\]/g, '').split(',');
              values.forEach(v => {
                result.push(getColumnOrRecordValue(r, v, ''));
              });
            } else {
              // consider all items as functions
              const values = d.calculated!.replaceAll(/\[|\]/g, '').split('),');
              values.forEach(v => {
                result.push(calculatedValue(r, `${v})`));
              });
            }
            return result;
          } else {
            return calculatedValue(r, d.calculated!);
          }
        } else if (d.fields) {
          const arr: (string | number | undefined)[] = [];
          d.fields.forEach(f => {
            arr.push(getRecordValue(r, f, undefined) as number);
          });
          return arr;
        } else {
          return getRecordValue(r, d.field!, '');
        }
      },
      sort: (a: Record, b: Record, col: Column) => {
        if (d.calculated) {
          return -1;
        } else {
          const valA = col.value(a);
          const valB = col.value(b);
          if (typeof valA === 'number' && typeof valB === 'number') {
            if (col.id.includes('Port')) {
              return comparePorts(valA, valB);
            } else if (col.id.includes('Proto')) {
              return compareProtocols(valA, valB);
            }
            return compareNumbers(valA, valB);
          } else if (typeof valA === 'string' && typeof valB === 'string') {
            if (col.id.includes('IP')) {
              return compareIPs(valA, valB);
            }
            return compareStrings(valA, valB);
          }
          return 0;
        }
      },
      width: d.width || 15
    });
  });
  return columns;
};
