import { findFilter } from '../filter-definitions';
import { Filters } from '../../model/filters';
import { getFiltersFromURL, setURLFilters } from '../router';
import { setNavFunction } from '../../components/dynamic-loader/dynamic-loader';
import { FilterDefinitionSample } from '../../components/__tests-data__/filters';

const nav = jest.fn();
setNavFunction(nav);

describe('Filters URL', () => {
  it('should set Filters -> URL', async () => {
    const filters: Filters = {
      backAndForth: true,
      list: [
        {
          def: findFilter(FilterDefinitionSample, 'src_namespace')!,
          values: [{ v: 'test' }]
        },
        {
          def: findFilter(FilterDefinitionSample, 'dst_name')!,
          values: [{ v: 'test' }],
          not: true
        }
      ]
    };
    setURLFilters(filters, false);

    expect(nav).toHaveBeenCalledWith('/?filters=src_namespace%3Dtest%3Bdst_name%21%3Dtest&bnf=true', {
      replace: false
    });
  });

  it('should get URL -> Filters', async () => {
    const location = {
      ...window.location,
      search: '?filters=src_namespace%3Dtest%3Bdst_name%21%3Dtest&bnf=true'
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location
    });

    const prom = getFiltersFromURL(FilterDefinitionSample, {});
    expect(prom).toBeDefined();
    return prom!.then(filters => {
      expect(filters.backAndForth).toBe(true);
      expect(filters.list).toHaveLength(2);
    });
  });
});
