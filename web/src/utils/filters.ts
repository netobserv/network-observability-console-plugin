import * as _ from 'lodash';
import protocols from 'protocol-numbers';
import { getPort } from 'port-numbers';
import { ColumnsId } from './columns';
import { getProtectedService } from './port';

export enum FilterType {
  NONE,
  ADDRESS_PORT,
  ADDRESS,
  PORT,
  PROTOCOL,
  NUMBER,
  K8S_NAMES,
  KIND_NAMESPACE_NAME,
  K8S_OBJECT,
  NAMESPACE,
  KIND
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

export const getFilterOption = (name: string): FilterOption => {
  return { name, value: name };
};

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

const namespaces: Set<FilterOption> = new Set<FilterOption>();

export const clearNamespaces = () => {
  namespaces.clear();
};

export const setNamespaces = (ns: string[]) => {
  namespaces.clear();
  ns.forEach(n => namespaces.add(getFilterOption(n)));
};

const objectsMap: Map<string, FilterOption[]> = new Map<string, FilterOption[]>();

export const clearPods = () => {
  objectsMap.clear();
};

export const hasPods = (namespace: string) => {
  return objectsMap.has(namespace);
};

export const setObjects = (kindNamespace: string, objects: string[]) => {
  const options = objects.map(p => getFilterOption(p));
  objectsMap.set(kindNamespace, options);
};

export const hasNamespace = (namespace: string) => {
  return Array.from(namespaces.values()).find(n => n.name === namespace) != undefined;
};

export const getNamespaceOptions = (value: string) => {
  const options = Array.from(namespaces.values());
  if (value.length) {
    return options.filter(n => n.name.toLowerCase().startsWith(value.toLowerCase()));
  } else {
    return options;
  }
};

export const getObjectsOptions = (filterValue: string) => {
  // search objects by namespace
  if (filterValue.includes('.')) {
    const kindNamespaceAndPod = filterValue.split('.');
    const pods = objectsMap.get(`${kindNamespaceAndPod[0]}.${kindNamespaceAndPod[1]}`);
    if (!pods) {
      return [];
    } else if (kindNamespaceAndPod[1]) {
      // search all pods in namespace in cache
      return pods.filter(p =>
        p.name.toLowerCase().startsWith(kindNamespaceAndPod[kindNamespaceAndPod.length - 1].toLowerCase())
      );
    } else {
      // directly show pods for "namespace & pod" when namespace is set
      return pods;
    }
  } else if (filterValue.length) {
    // search all objects in cache
    return Array.from(objectsMap.values())
      .flat()
      .filter(p => p.name.toLowerCase().startsWith(filterValue.toLowerCase()));
  } else {
    // don't show list if field is empty
    return [];
  }
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

const getK8SKindOptions = (value: string) => {
  return ['Pod', 'Service', 'Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob']
    .filter(k => k.toLowerCase().startsWith(value.toLowerCase()))
    .map(p => getFilterOption(p));
};

const filterOptions: Map<FilterType, (value: string) => FilterOption[]> = new Map([
  [FilterType.PROTOCOL, getProtocolOptions],
  [FilterType.PORT, getPortOptions],
  [FilterType.KIND_NAMESPACE_NAME, getK8SKindOptions],
  [FilterType.KIND, getK8SKindOptions],
  [FilterType.NAMESPACE, getNamespaceOptions],
  [FilterType.K8S_OBJECT, getObjectsOptions] //must filter by namespace first, else it will be empty
]);

export const getFilterOptions = (type: FilterType, value: string, max = 10) => {
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
