import _ from 'lodash';
import { Fields, Labels } from '../api/ipfix';

type Field = keyof Fields | keyof Labels;
export type FieldMapping = (values: FilterValue[]) => { key: Field; values: string[] }[];
type FieldMatching = {
  always?: FieldMapping;
  ifSrc?: FieldMapping;
  ifDst?: FieldMapping;
};

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
  | 'port'
  | 'src_port'
  | 'dst_port'
  | 'host_address'
  | 'src_host_address'
  | 'dst_host_address'
  | 'host_name'
  | 'src_host_name'
  | 'dst_host_name'
  | 'protocol';

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
  fieldMatching: FieldMatching;
}

export interface FilterValue {
  v: string;
  disabled?: boolean;
  display?: string;
}

export interface Filter {
  def: FilterDefinition;
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
export const GroupDisabledKey = 'all';

export const getDisabledFiltersRecord = (filters: Filter[]) => {
  const disabledFilters: DisabledFilters = {};
  filters.forEach(f => {
    const values = f.values
      .filter(fv => fv.disabled === true)
      .map(fv => fv.v)
      .join(',');
    if (!_.isEmpty(values)) {
      disabledFilters[f.def.id] = values;
    }
  });
  return disabledFilters;
};

export const hasIndexFields = (filters: Filter[]) => {
  return (
    filters.find(
      f =>
        f.def.id.includes('namespace') ||
        f.def.id.includes('owner') ||
        ['name', 'src_name', 'dst_name'].includes(f.def.id.toString())
    ) !== undefined
  );
};
