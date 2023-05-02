import _ from 'lodash';

export type FiltersEncoder = (values: FilterValue[], matchAny: boolean, not: boolean) => string;

export enum FilterComponent {
  Autocomplete,
  Text
}

export enum FilterCategory {
  Source,
  Destination,
  Common,
  None
}

export type FilterId =
  | 'namespace'
  | 'src_namespace'
  | 'dst_namespace'
  | 'name'
  | 'src_name'
  | 'dst_name'
  | 'kind'
  | 'src_kind'
  | 'dst_kind'
  | 'owner_name'
  | 'src_owner_name'
  | 'dst_owner_name'
  | 'resource'
  | 'src_resource'
  | 'dst_resource'
  | 'address'
  | 'src_address'
  | 'dst_address'
  | 'mac'
  | 'src_mac'
  | 'dst_mac'
  | 'port'
  | 'src_port'
  | 'dst_port'
  | 'host_address'
  | 'src_host_address'
  | 'dst_host_address'
  | 'host_name'
  | 'src_host_name'
  | 'dst_host_name'
  | 'protocol'
  | 'interface'
  | 'type'
  | 'id';

export interface FilterDefinition {
  id: FilterId;
  name: string;
  component: FilterComponent;
  category: FilterCategory;
  getOptions: (value: string) => Promise<FilterOption[]>;
  validate: (value: string) => { val?: string; err?: string };
  checkCompletion?: (value: string, selected: string) => { completed: boolean; option: FilterOption };
  autoCompleteAddsQuotes?: boolean;
  hint?: string;
  examples?: string;
  placeholder?: string;
  encoders: { simpleEncode?: FiltersEncoder; common?: { srcEncode: FiltersEncoder; dstEncode: FiltersEncoder } };
}

export interface FilterValue {
  v: string;
  disabled?: boolean;
  display?: string;
}

export interface Filter {
  def: FilterDefinition;
  not?: boolean;
  values: FilterValue[];
}

export interface FilterOption {
  name: string;
  value: string;
}

export const createFilterValue = (def: FilterDefinition, value: string): Promise<FilterValue> => {
  return def.getOptions(value).then(opts => {
    const option = opts.find(opt => opt.name === value || opt.value === value);
    return option ? { v: option.value, display: option.name } : { v: value };
  });
};

export const hasEnabledFilterValues = (filter: Filter) => {
  if (filter.values.find(fv => fv.disabled !== true)) {
    return true;
  }
  return false;
};

export const getEnabledFilters = (filters: Filter[]) => {
  //clone to avoid values updated in filters
  const clonedFilters = _.cloneDeep(filters);
  return clonedFilters
    .map(f => {
      f.values = f.values.filter(fv => fv.disabled !== true);
      return f;
    })
    .filter(f => !_.isEmpty(f.values));
};

export type DisabledFilters = Record<string, string>;

export const filterKey = (filter: Filter) => filter.def.id + (filter.not ? '!' : '');
export const fromFilterKey = (key: string) => {
  if (key.endsWith('!')) {
    return { id: key.substring(0, key.length - 1) as FilterId, not: true };
  }
  return { id: key as FilterId };
};

export const getDisabledFiltersRecord = (filters: Filter[]) => {
  const disabledFilters: DisabledFilters = {};
  filters.forEach(f => {
    const values = f.values
      .filter(fv => fv.disabled === true)
      .map(fv => fv.v)
      .join(',');
    if (!_.isEmpty(values)) {
      disabledFilters[filterKey(f)] = values;
    }
  });
  return disabledFilters;
};

const isIndexed = (f: Filter) => {
  return f.def.id.includes('namespace') || f.def.id.includes('owner') || f.def.id.includes('resource');
};

export const hasIndexFields = (filters: Filter[]) => {
  return filters.some(isIndexed);
};

export const hasNonIndexFields = (filters: Filter[]) => {
  return filters.some(f => !isIndexed(f));
};

type FilterKey = Omit<Filter, 'values'>;

export const findFromFilters = (activeFilters: Filter[], search: FilterKey): Filter | undefined => {
  return activeFilters.find(f => filtersEqual(f, search));
};

export const removeFromFilters = (activeFilters: Filter[], search: FilterKey): Filter[] => {
  return activeFilters.filter(f => !filtersEqual(f, search));
};

export const filtersEqual = (f1: FilterKey, f2: FilterKey): boolean => {
  return f1.def.id === f2.def.id && f1.not == f2.not;
};

export const doesIncludeFilter = (activeFilters: Filter[], search: FilterKey, values: FilterValue[]): boolean => {
  const found = findFromFilters(activeFilters, search);
  if (found) {
    // Return true if every value in "values" is found in "found.values"
    return values.every(mustMatch => found.values.some(v => v.v === String(mustMatch.v)));
  }
  return false;
};
