import { findFilter } from '../filter-definitions';
import { Filters } from '../../model/filters';
import { getFiltersFromURL, setURLFilters } from '../router';

const t = (k: string) => k;

describe('Filters URL', () => {
  it('should get and set URL<->Filters', async () => {
    const filters: Filters = {
      backAndForth: true,
      list: [
        {
          def: findFilter(t, 'src_namespace')!,
          values: [{ v: 'test' }]
        },
        {
          def: findFilter(t, 'dst_name')!,
          values: [{ v: 'test' }],
          not: true
        }
      ]
    };
    setURLFilters(filters);

    expect(window.location.search).toBe('?filters=src_namespace%3Dtest%3Bdst_name%21%3Dtest&bnf=true');

    const prom = getFiltersFromURL(t, {});
    expect(prom).toBeDefined();
    return prom!.then(filters => {
      expect(filters.backAndForth).toBe(true);
      expect(filters.list).toHaveLength(2);
    });
  });
});
