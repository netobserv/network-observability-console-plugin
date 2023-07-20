import _ from 'lodash';

export type FiltersEncoder = (values: FilterValue[], matchAny: boolean, not: boolean) => string;

export enum FilterComponent {
  Autocomplete,
  Text
}

export enum FilterCategory {
  Source,
  Destination,
  None
}

export type TargetedFilterId =
  | 'namespace'
  | 'name'
  | 'kind'
  | 'owner_name'
  | 'resource'
  | 'address'
  | 'mac'
  | 'port'
  | 'host_address'
  | 'host_name';

export type FilterId =
  | `src_${TargetedFilterId}`
  | `dst_${TargetedFilterId}`
  | 'protocol'
  | 'interface'
  | 'type'
  | 'id'
  | 'dns_id'
  | 'dns_flag_response_code';

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
  encoder: FiltersEncoder;
  // overlap tells if the type of entity referred to with this filter may have overlapping (duplicated)
  // flows when querying for returned traffic (back and forth) - they result in slightly more complicated queries.
  overlap: boolean;
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

export interface Filters {
  list: Filter[];
  backAndForth: boolean;
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

export const getEnabledFilters = (filters: Filters): Filters => {
  //clone to avoid values updated in filters
  const clonedFilters = _.cloneDeep(filters.list);
  return {
    list: clonedFilters
      .map(f => {
        f.values = f.values.filter(fv => fv.disabled !== true);
        return f;
      })
      .filter(f => !_.isEmpty(f.values)),
    backAndForth: filters.backAndForth
  };
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
