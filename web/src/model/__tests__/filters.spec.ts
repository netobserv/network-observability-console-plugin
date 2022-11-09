import { findFilter } from '../../utils/filter-definitions';
import { doesIncludeFilter, Filter } from '../filters';

describe('doesIncludeFilter', () => {
  const srcNameFilter = findFilter((a: string) => a, 'src_name')!;
  const notDstNameFilter = findFilter((a: string) => a, 'dst_name')!;
  const activeFilters: Filter[] = [
    {
      def: srcNameFilter,
      not: false,
      values: [{ v: 'abc' }, { v: 'def' }]
    },
    {
      def: notDstNameFilter,
      not: true,
      values: [{ v: 'abc' }, { v: 'def' }]
    }
  ];

  it('should not include filter due to different key', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: findFilter((a: string) => a, 'protocol')! }, [
      { v: 'abc' },
      { v: 'def' }
    ]);
    expect(isIncluded).toBeFalsy();
  });

  it('should not include filter due to missing value', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: srcNameFilter, not: false }, [
      { v: 'abc' },
      { v: 'def' },
      { v: 'ghi' }
    ]);
    expect(isIncluded).toBeFalsy();
  });

  it('should include filter with exact values', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: srcNameFilter, not: false }, [
      { v: 'abc' },
      { v: 'def' }
    ]);
    expect(isIncluded).toBeTruthy();
  });

  it('should include filter with values included', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: srcNameFilter, not: false }, [{ v: 'abc' }]);
    expect(isIncluded).toBeTruthy();
  });

  it('should not include filter due to different key (not)', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: notDstNameFilter, not: false }, [
      { v: 'abc' },
      { v: 'def' }
    ]);
    expect(isIncluded).toBeFalsy();
  });

  it('should include filter with same key (not)', () => {
    const isIncluded = doesIncludeFilter(activeFilters, { def: notDstNameFilter, not: true }, [
      { v: 'abc' },
      { v: 'def' }
    ]);
    expect(isIncluded).toBeTruthy();
  });
});
