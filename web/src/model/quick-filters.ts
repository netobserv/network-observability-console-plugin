import { findFilter } from '../utils/filter-definitions';
import { Filter, FilterDefinition, fromFilterKey } from './filters';

export type RawQuickFilter = {
  name: string;
  default: string;
  filter: { [key: string]: string };
};

export type QuickFilter = {
  name: string;
  default: string;
  filters: Filter[];
};

export const parseQuickFilters = (filterDefinitions: FilterDefinition[], raw: RawQuickFilter[]): QuickFilter[] => {
  const ret: QuickFilter[] = [];
  raw.forEach(qf => {
    const filters: (Filter | undefined)[] = Object.entries(qf.filter).map(([key, values]) => {
      const { id, not, moreThan } = fromFilterKey(key);
      const def = findFilter(filterDefinitions, id);
      if (!def) {
        console.warn(`Configured quick filter "${qf.name}" contains unknown filter id ${id}.`);
        return undefined;
      }
      const filter: Filter = {
        def: def,
        not: not,
        moreThan: moreThan,
        values: values.split(',').map(v => ({ v: v }))
      };
      return filter;
    });
    if (!filters.some(f => f === undefined)) {
      ret.push({
        name: qf.name,
        default: qf.default,
        filters: filters as Filter[]
      });
    }
  });
  return ret;
};
