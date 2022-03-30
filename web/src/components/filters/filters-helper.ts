import { TFunction } from 'i18next';
import { getFilterDefinitions } from '../../utils/filter-definitions';
import { FilterCategory, FilterDefinition } from '../../model/filters';

export type Indicator = 'default' | 'success' | 'warning' | 'error' | undefined;

export type FilterGroup = {
  title: string;
  filters: FilterDefinition[];
};

export const buildGroups = (t: TFunction): FilterGroup[] => {
  const defs = getFilterDefinitions(t);
  return [
    {
      title: t('Common'),
      filters: defs.filter(def => def.category == FilterCategory.Common || def.category === FilterCategory.None)
    },
    {
      title: t('Source'),
      filters: defs.filter(def => def.category == FilterCategory.Source)
    },
    {
      title: t('Destination'),
      filters: defs.filter(def => def.category == FilterCategory.Destination)
    }
  ];
};

export const getFilterFullName = (f: FilterDefinition, t: TFunction) => {
  switch (f.category) {
    case FilterCategory.Source:
      return `${t('Source')} ${f.name}`;
    case FilterCategory.Destination:
      return `${t('Destination')} ${f.name}`;
    case FilterCategory.Common:
      return `${t('Common')} ${f.name}`;
    default:
      return f.name;
  }
};
