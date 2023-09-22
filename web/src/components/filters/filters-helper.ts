import { TFunction } from 'i18next';
import { findFilter, getFilterDefinitions } from '../../utils/filter-definitions';
import { Filter, FilterCategory, FilterDefinition, FilterId } from '../../model/filters';

export type Indicator = 'default' | 'success' | 'warning' | 'error' | undefined;

export type FilterGroup = {
  title: string;
  filters: FilterDefinition[];
};

export const buildGroups = (
  t: TFunction,
  allowConnectionFilter?: boolean,
  allowDNSFilter?: boolean,
  allowPktDrops?: boolean,
  allowRTTFilter?: boolean,
  allowTCPRetrans?: boolean
): FilterGroup[] => {
  const defs = getFilterDefinitions(
    t,
    allowConnectionFilter,
    allowDNSFilter,
    allowPktDrops,
    allowRTTFilter,
    allowTCPRetrans
  );
  return [
    {
      title: t('Source'),
      filters: defs.filter(def => def.category == FilterCategory.Source)
    },
    {
      title: t('Destination'),
      filters: defs.filter(def => def.category == FilterCategory.Destination)
    },
    {
      title: t('Common'),
      filters: defs.filter(def => def.category === FilterCategory.None)
    }
  ];
};

export const getFilterFullName = (f: FilterDefinition, t: TFunction) => {
  switch (f.category) {
    case FilterCategory.Source:
      return `${t('Source')} ${f.name}`;
    case FilterCategory.Destination:
      return `${t('Destination')} ${f.name}`;
    default:
      return f.name;
  }
};

export const hasSrcDstFilters = (filters: Filter[]): boolean => {
  return filters.some(f => f.def.id.startsWith('src_') || f.def.id.startsWith('dst_'));
};

export const swapFilters = (t: TFunction, filters: Filter[]): Filter[] => {
  return filters.map(f => {
    let swappedId: FilterId | undefined;
    if (f.def.id.startsWith('src_')) {
      swappedId = f.def.id.replace('src_', 'dst_') as FilterId;
    } else if (f.def.id.startsWith('dst_')) {
      swappedId = f.def.id.replace('dst_', 'src_') as FilterId;
    }
    if (swappedId) {
      const def = findFilter(t, swappedId);
      if (def) {
        return { ...f, def };
      }
    }
    return f;
  });
};
