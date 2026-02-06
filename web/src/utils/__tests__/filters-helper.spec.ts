import { FilterDefinitionSample } from '../../components/__tests-data__/filters';
import { Filter, FilterCompare, FilterDefinition, FilterId, FilterValue } from '../../model/filters';
import { findFilter } from '../filter-definitions';
import {
  bnfFilterValue,
  hasSrcAndDstFilters,
  hasSrcOrDstFilters,
  setEndpointFilters,
  swapFilter,
  swapFilterDefinition,
  swapFilters,
  swapFilterValue
} from '../filters-helper';

describe('hasSrcOrDstFilters', () => {
  it('should return true when src filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'src_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];
    expect(hasSrcOrDstFilters(filters)).toBe(true);
  });

  it('should return true when dst filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'dst_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];
    expect(hasSrcOrDstFilters(filters)).toBe(true);
  });

  it('should return false when no src/dst filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'protocol' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'TCP' }]
      }
    ];
    expect(hasSrcOrDstFilters(filters)).toBe(false);
  });

  it('should return false for empty array', () => {
    expect(hasSrcOrDstFilters([])).toBe(false);
  });
});

describe('hasSrcAndDstFilters', () => {
  it('should return true when both src and dst filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'src_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      },
      {
        def: { id: 'dst_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test2' }]
      }
    ];
    expect(hasSrcAndDstFilters(filters)).toBe(true);
  });

  it('should return false when only src filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'src_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];
    expect(hasSrcAndDstFilters(filters)).toBe(false);
  });

  it('should return false when only dst filters exist', () => {
    const filters: Filter[] = [
      {
        def: { id: 'dst_namespace' } as FilterDefinition,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];
    expect(hasSrcAndDstFilters(filters)).toBe(false);
  });
});

describe('swapFilterDefinition', () => {
  it('should swap src to dst', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const swapped = swapFilterDefinition(FilterDefinitionSample, srcDef);
    expect(swapped.id).toBe('dst_namespace');
  });

  it('should swap dst to src', () => {
    const dstDef = findFilter(FilterDefinitionSample, 'dst_namespace')!;
    const swapped = swapFilterDefinition(FilterDefinitionSample, dstDef);
    expect(swapped.id).toBe('src_namespace');
  });

  it('should swap src to specific target', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const swapped = swapFilterDefinition(FilterDefinitionSample, srcDef, 'src');
    expect(swapped.id).toBe('src_namespace');
  });

  it('should convert endpoint to src', () => {
    const endpointDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const swapped = swapFilterDefinition(FilterDefinitionSample, endpointDef, 'src');
    expect(swapped.id).toBe('src_namespace');
  });

  it('should convert endpoint to dst', () => {
    const endpointDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const swapped = swapFilterDefinition(FilterDefinitionSample, endpointDef, 'dst');
    expect(swapped.id).toBe('dst_namespace');
  });

  it('should return original if swap not found', () => {
    const customDef = { id: 'custom_filter' as FilterId, category: undefined } as FilterDefinition;
    const swapped = swapFilterDefinition(FilterDefinitionSample, customDef);
    expect(swapped).toBe(customDef);
  });
});

describe('swapFilter', () => {
  it('should swap filter with new definition', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const filter: Filter = {
      def: srcDef,
      compare: FilterCompare.equal,
      values: [{ v: 'test' }]
    };

    const swapped = swapFilter(FilterDefinitionSample, filter);
    expect(swapped.def.id).toBe('dst_namespace');
    expect(swapped.values).toEqual([{ v: 'test' }]);
    expect(swapped.compare).toBe(FilterCompare.equal);
  });
});

describe('swapFilters', () => {
  it('should swap all filters in array', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const dstDef = findFilter(FilterDefinitionSample, 'dst_namespace')!;
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [{ v: 'test1' }]
      },
      {
        def: dstDef,
        compare: FilterCompare.equal,
        values: [{ v: 'test2' }]
      }
    ];

    const swapped = swapFilters(FilterDefinitionSample, filters);
    expect(swapped[0].def.id).toBe('dst_namespace');
    expect(swapped[1].def.id).toBe('src_namespace');
  });
});

describe('setEndpointFilters', () => {
  it('should convert endpoint filters to src', () => {
    const endpointDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const protocolDef = findFilter(FilterDefinitionSample, 'protocol')!;
    const filters: Filter[] = [
      {
        def: endpointDef,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      },
      {
        def: protocolDef,
        compare: FilterCompare.equal,
        values: [{ v: 'TCP' }]
      }
    ];

    const converted = setEndpointFilters(FilterDefinitionSample, filters, 'src');
    expect(converted[0].def.id).toBe('src_namespace');
    expect(converted[1].def.id).toBe('protocol'); // non-endpoint unchanged
  });

  it('should convert endpoint filters to dst', () => {
    const endpointDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const filters: Filter[] = [
      {
        def: endpointDef,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];

    const converted = setEndpointFilters(FilterDefinitionSample, filters, 'dst');
    expect(converted[0].def.id).toBe('dst_namespace');
  });
});

describe('swapFilterValue', () => {
  it('should move value from src to dst', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const value: FilterValue = { v: 'test' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value, { v: 'other' }]
      }
    ];

    const result = swapFilterValue(FilterDefinitionSample, filters, 'src_namespace', value, 'dst');

    // Original filter should have 'other' only
    const srcFilter = result.find(f => f.def.id === 'src_namespace');
    expect(srcFilter?.values).toHaveLength(1);
    expect(srcFilter?.values[0].v).toBe('other');

    // New dst filter should have 'test'
    const dstFilter = result.find(f => f.def.id === 'dst_namespace');
    expect(dstFilter?.values).toHaveLength(1);
    expect(dstFilter?.values[0].v).toBe('test');
  });

  it('should remove src filter when last value is moved', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const value: FilterValue = { v: 'test' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      }
    ];

    const result = swapFilterValue(FilterDefinitionSample, filters, 'src_namespace', value, 'dst');

    // Original filter should be removed
    const srcFilter = result.find(f => f.def.id === 'src_namespace');
    expect(srcFilter).toBeUndefined();

    // New dst filter should exist
    const dstFilter = result.find(f => f.def.id === 'dst_namespace');
    expect(dstFilter?.values).toHaveLength(1);
    expect(dstFilter?.values[0].v).toBe('test');
  });

  it('should add to existing dst filter', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const dstDef = findFilter(FilterDefinitionSample, 'dst_namespace')!;
    const value: FilterValue = { v: 'test' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      },
      {
        def: dstDef,
        compare: FilterCompare.equal,
        values: [{ v: 'existing' }]
      }
    ];

    const result = swapFilterValue(FilterDefinitionSample, filters, 'src_namespace', value, 'dst');

    // dst filter should have both values
    const dstFilter = result.find(f => f.def.id === 'dst_namespace');
    expect(dstFilter?.values).toHaveLength(2);
    expect(dstFilter?.values.map(v => v.v)).toContain('test');
    expect(dstFilter?.values.map(v => v.v)).toContain('existing');
  });

  it('should return unchanged filters when source filter not found', () => {
    const filters: Filter[] = [];
    const result = swapFilterValue(FilterDefinitionSample, filters, 'src_namespace', { v: 'test' }, 'dst');
    expect(result).toEqual(filters);
  });
});

describe('bnfFilterValue', () => {
  it('should convert src_namespace to namespace (Either)', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const value: FilterValue = { v: 'netobserv' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_namespace', value);

    // Original src filter should be removed
    const srcFilter = result.find(f => f.def.id === 'src_namespace');
    expect(srcFilter).toBeUndefined();

    // Base namespace filter should exist
    const baseFilter = result.find(f => f.def.id === 'namespace');
    expect(baseFilter).toBeDefined();
    expect(baseFilter?.values).toHaveLength(1);
    expect(baseFilter?.values[0].v).toBe('netobserv');
  });

  it('should convert dst_namespace to namespace (Either)', () => {
    const dstDef = findFilter(FilterDefinitionSample, 'dst_namespace')!;
    const value: FilterValue = { v: 'test' };
    const filters: Filter[] = [
      {
        def: dstDef,
        compare: FilterCompare.equal,
        values: [value]
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'dst_namespace', value);

    // Original dst filter should be removed
    const dstFilter = result.find(f => f.def.id === 'dst_namespace');
    expect(dstFilter).toBeUndefined();

    // Base namespace filter should exist
    const baseFilter = result.find(f => f.def.id === 'namespace');
    expect(baseFilter).toBeDefined();
    expect(baseFilter?.values[0].v).toBe('test');
  });

  it('should keep other values in src filter', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const value: FilterValue = { v: 'netobserv' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value, { v: 'other' }]
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_namespace', value);

    // Original src filter should still exist with 'other'
    const srcFilter = result.find(f => f.def.id === 'src_namespace');
    expect(srcFilter).toBeDefined();
    expect(srcFilter?.values).toHaveLength(1);
    expect(srcFilter?.values[0].v).toBe('other');

    // Base namespace filter should have 'netobserv'
    const baseFilter = result.find(f => f.def.id === 'namespace');
    expect(baseFilter?.values[0].v).toBe('netobserv');
  });

  it('should add to existing base filter', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const namespaceDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const value: FilterValue = { v: 'netobserv' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      },
      {
        def: namespaceDef,
        compare: FilterCompare.equal,
        values: [{ v: 'existing' }]
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_namespace', value);

    // Base namespace filter should have both values
    const baseFilter = result.find(f => f.def.id === 'namespace');
    expect(baseFilter?.values).toHaveLength(2);
    expect(baseFilter?.values.map(v => v.v)).toContain('netobserv');
    expect(baseFilter?.values.map(v => v.v)).toContain('existing');
  });

  it('should not add duplicate value to existing base filter', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const namespaceDef = findFilter(FilterDefinitionSample, 'namespace')!;
    const value: FilterValue = { v: 'netobserv' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      },
      {
        def: namespaceDef,
        compare: FilterCompare.equal,
        values: [value] // Same value already exists
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_namespace', value);

    // Base namespace filter should still have only one value
    const baseFilter = result.find(f => f.def.id === 'namespace');
    expect(baseFilter?.values).toHaveLength(1);
    expect(baseFilter?.values[0].v).toBe('netobserv');
  });

  it('should return unchanged filters when base filter definition not found', () => {
    const customDef = { id: 'src_custom' as FilterId } as FilterDefinition;
    const filters: Filter[] = [
      {
        def: customDef,
        compare: FilterCompare.equal,
        values: [{ v: 'test' }]
      }
    ];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_custom' as FilterId, { v: 'test' });

    // Filters should be unchanged (base filter 'custom' doesn't exist)
    expect(result).toEqual(filters);
  });

  it('should return unchanged filters when source filter not found', () => {
    const filters: Filter[] = [];

    const result = bnfFilterValue(FilterDefinitionSample, filters, 'src_namespace', { v: 'test' });

    // Filters should be unchanged
    expect(result).toEqual(filters);
  });

  it('should handle def missing', () => {
    const srcDef = findFilter(FilterDefinitionSample, 'src_namespace')!;
    const value: FilterValue = { v: 'netobserv' };
    const filters: Filter[] = [
      {
        def: srcDef,
        compare: FilterCompare.equal,
        values: [value]
      }
    ];

    // Use a filter definitions array that doesn't have the base 'namespace' filter
    const limitedDefs = FilterDefinitionSample.filter(f => f.id !== 'namespace');

    const result = bnfFilterValue(limitedDefs, filters, 'src_namespace', value);

    // Original filter should NOT be removed
    const srcFilter = result.find(f => f.def.id === 'src_namespace');
    expect(srcFilter).toBeDefined();
    expect(srcFilter?.values).toHaveLength(1);
    expect(srcFilter?.values[0].v).toBe('netobserv');
  });
});
