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
      return f.name;
  }
};

export const hasSrcDstFilters = (filters: Filter[]): boolean => {
  return filters.some(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_'));
};

export const swapFilter = (filterDefinitions: FilterDefinition[], filter: Filter): Filter => {
  let swappedId: FilterId | undefined;
  if (filter.def.id.startsWith('src_')) {
    swappedId = filter.def.id.replace('src_', 'dst_') as FilterId;
  } else if (filter.def.id.startsWith('dst_')) {
    swappedId = filter.def.id.replace('dst_', 'src_') as FilterId;
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

export const swapFilterValue = (
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

  // add new swapped filter
  const swapped = swapFilter(filterDefinitions, { ...found, values: [value] });
  const existing = filters.find(f => f.def.id === swapped.def.id);
  if (existing) {
    existing.values.push(swapped.values[0]);
  } else {
    filters.push(swapped);
  }

  return filters;
};
