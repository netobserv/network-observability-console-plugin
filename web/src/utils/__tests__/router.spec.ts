import { setNavFunction } from '../../components/dynamic-loader/dynamic-loader';
import { FilterDefinitionSample } from '../../components/__tests-data__/filters';
import { FilterCompare, Filters } from '../../model/filters';
import { findFilter } from '../filter-definitions';
import { getFiltersFromURL, setURLFilters } from '../router';

const nav = jest.fn();
setNavFunction(nav);

describe('Filters URL', () => {
  it('should set Filters -> URL', async () => {
    const filters: Filters = {
      match: 'bidirectionnal',
      list: [
        {
          def: findFilter(FilterDefinitionSample, 'src_namespace')!,
          compare: FilterCompare.equal,
          values: [{ v: 'test' }]
        },
        {
          def: findFilter(FilterDefinitionSample, 'dst_name')!,
          compare: FilterCompare.notEqual,
          values: [{ v: 'test' }]
        }
      ]
    };
    setURLFilters(filters, false);

    expect(nav).toHaveBeenCalledWith('/?filters=src_namespace%3Dtest%3Bdst_name%21%3Dtest&match=bidirectionnal', {
      replace: false
    });
  });

  it('should get URL -> Filters', async () => {
    const location = {
      ...window.location,
      search: '?filters=src_namespace%3Dtest%3Bdst_name%21%3Dtest&match=bidirectionnal'
    };
    Object.defineProperty(window, 'location', {
      writable: true,
      value: location
    });

    const prom = getFiltersFromURL(FilterDefinitionSample, {});
    expect(prom).toBeDefined();
    return prom!.then(filters => {
      expect(filters.match).toBe('bidirectionnal');
      expect(filters.list).toHaveLength(2);
    });
  });
});
