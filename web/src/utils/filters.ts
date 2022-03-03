import * as _ from 'lodash';
import protocols from 'protocol-numbers';
import { getPort } from 'port-numbers';
import { ColumnsId } from './columns';
import { getProtectedService } from './port';

export enum FilterType {
  NONE,
  ADDRESS,
  PORT,
  PROTOCOL,
  NUMBER,
  K8S_NAMES,
  FQDN
}

export interface FilterValue {
  v: string;
  display?: string;
}

export interface Filter {
  colId: ColumnsId;
  values: FilterValue[];
}

export interface FilterOption {
  name: string;
  value: string;
}

export const getActiveColumnFilters = (columnId: ColumnsId, filters: Filter[]) => {
  return filters.filter(f => f.colId === columnId).flatMap(f => f.values.map(v => v.v));
};

const protocolOptions: FilterOption[] = Object.values(protocols)
  .map(proto => ({ name: proto.name, value: proto.value }))
  .filter(proto => !_.isEmpty(proto.name))
  .filter(proto => Number(proto.value) < 1024);
_.orderBy(protocolOptions, 'name');

const getProtocolOptions = (value: string) => {
  return protocolOptions.filter(
    opt => opt.value.startsWith(value) || opt.name.toLowerCase().startsWith(value.toLowerCase())
  );
};

const getPortOptions = (value: string) => {
  const isNumber = !isNaN(Number(value));
  const foundService = isNumber ? getProtectedService(Number(value)) : null;
  const foundPort = !isNumber ? getPort(value) : null;
  if (foundService) {
    return [{ name: foundService.name, value: value }];
  } else if (foundPort) {
    return [{ name: value, value: foundPort.port.toString() }];
  }
  return [];
};

const filterOptions: Map<FilterType, (value: string) => FilterOption[]> = new Map([
  [FilterType.PROTOCOL, getProtocolOptions],
  [FilterType.PORT, getPortOptions]
]);

export const getFilterOptions = (type: FilterType, value: string, max: number) => {
  if (filterOptions.has(type)) {
    let options = filterOptions.get(type)!(value);
    if (options.length > max) {
      options = options.slice(0, max);
    }
    return options;
  }
  return [];
};

export const createFilterValue = (type: FilterType, value: string): FilterValue => {
  if (filterOptions.has(type)) {
    const option = filterOptions.get(type)!(value).find(p => p.name === value || p.value === value);
    if (option) {
      return {
        v: option.value,
        display: option.name
      };
    } else {
      console.warn('filter not found', type, value);
    }
  }
  return { v: value };
};

export const findProtocolOption = (nameOrVal: string) => {
  return protocolOptions.find(p => p.name.toLowerCase() === nameOrVal.toLowerCase() || p.value === nameOrVal);
};
