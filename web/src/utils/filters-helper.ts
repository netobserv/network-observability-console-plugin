import { TFunction } from 'i18next';
import { Filter, FilterDefinition, FilterId, FilterValue } from '../model/filters';
import { findFilter } from './filter-definitions';

export type Indicator = 'default' | 'success' | 'warning' | 'error' | undefined;

export type FilterGroup = {
  title: string;
  filters: FilterDefinition[];
};

export const buildGroups = (filterDefinitions: FilterDefinition[], t: TFunction): FilterGroup[] => {
  return [
    {
      title: t('Source'),
      filters: filterDefinitions.filter(def => def.category === 'source')
    },
    {
      title: t('Destination'),
      filters: filterDefinitions.filter(def => def.category === 'destination')
    },
    {
      title: t('Back and forth'),
      filters: filterDefinitions.filter(def => def.category === 'bnf')
    },
    {
      title: t('Common'),
      filters: filterDefinitions.filter(def => !def.category)
    }
  ].filter(g => g.filters.length);
};

export const getFilterFullName = (f: FilterDefinition, t: TFunction) => {
  switch (f.category) {
    case 'source':
      return `${t('Source')} ${f.name}`;
    case 'destination':
      return `${t('Destination')} ${f.name}`;
    default:
      // back and forth is implicit here
      return f.name;
  }
};

export const hasMultipleSrcDstFilters = (filters: Filter[]): boolean => {
  return filters.filter(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_')).length > 1;
};

export const swapFilter = (filterDefinitions: FilterDefinition[], filter: Filter, target?: 'src' | 'dst'): Filter => {
  let swappedId: FilterId | undefined;
  if (filter.def.id.startsWith('src_')) {
    swappedId = filter.def.id.replace('src_', 'dst_') as FilterId;
  } else if (filter.def.id.startsWith('dst_')) {
    swappedId = filter.def.id.replace('dst_', 'src_') as FilterId;
  } else if (filter.def.category === 'bnf' && target) {
    // swap targetable filters only when target is set
    swappedId = `${target}_${filter.def.id}` as FilterId;
  }
  if (swappedId) {
    const def = findFilter(filterDefinitions, swappedId);
    if (def) {
      return { ...filter, def };
    }
  }
  return filter;
};

export const swapFilters = (filterDefinitions: FilterDefinition[], filters: Filter[]): Filter[] => {
  return filters.map(f => swapFilter(filterDefinitions, f));
};

export const setTargeteableFilters = (
  filterDefinitions: FilterDefinition[],
  filters: Filter[],
  target: 'src' | 'dst'
): Filter[] => {
  return filters.map(f => (f.def.category === 'bnf' ? swapFilter(filterDefinitions, f, target) : f));
};

export const swapFilterValue = (
  filterDefinitions: FilterDefinition[],
  filters: Filter[],
  id: FilterId,
  value: FilterValue,
  defaultTarget?: 'src' | 'dst'
): Filter[] => {
  // remove value from existing filter
  const found = filters.find(f => f.def.id === id);
  if (!found) {
    console.error("Can't find filter id", id);
    return filters;
  }
  found.values = found.values.filter(val => val.v !== value.v);

  // remove filter if no more values
  if (!found.values.length) {
    filters = filters.filter(f => f !== found);
  }

  // add new swapped filter
  const swapped = swapFilter(filterDefinitions, { ...found, values: [value] }, defaultTarget);
  const existing = filters.find(f => f.def.id === swapped.def.id);
  if (existing) {
    existing.values.push(swapped.values[0]);
  } else {
    filters.push(swapped);
  }

  return filters;
};

export const bnfFilterValue = (
  filterDefinitions: FilterDefinition[],
  filters: Filter[],
  id: FilterId,
  value: FilterValue
): Filter[] => {
  // remove value from existing filter
  const found = filters.find(f => f.def.id === id);
  if (!found) {
    console.error("Can't find filter id", id);
    return filters;
  }
  found.values = found.values.filter(val => val.v !== value.v);

  // remove filter if no more values
  if (!found.values.length) {
    filters = filters.filter(f => f !== found);
  }

  // add new back and forth filter value
  const bnfId = id.replace('src_', '').replace('dst_', '') as FilterId;
  const def = findFilter(filterDefinitions, bnfId);
  if (!def) {
    console.error("Can't find filter def", bnfId);
    return filters;
  }
  const existing = filters.find(f => f.def.id === bnfId);
  if (!existing) {
    filters.push({ ...found, def, values: [value] });
  } else if (existing.values.includes(value)) {
    existing.values.push(value);
  }

  return filters;
};
