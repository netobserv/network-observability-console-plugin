import { TFunction } from 'i18next';
import { Filter, FilterDefinition, FilterId } from '../model/filters';
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

export const swapFilters = (filterDefinitions: FilterDefinition[], filters: Filter[]): Filter[] => {
  return filters.map(f => {
    let swappedId: FilterId | undefined;
    if (f.def.id.startsWith('src_')) {
      swappedId = f.def.id.replace('src_', 'dst_') as FilterId;
    } else if (f.def.id.startsWith('dst_')) {
      swappedId = f.def.id.replace('dst_', 'src_') as FilterId;
    }
    if (swappedId) {
      const def = findFilter(filterDefinitions, swappedId);
      if (def) {
        return { ...f, def };
      }
    }
    return f;
  });
};
