import { SearchInput } from '@patternfly/react-core';
import { mount } from 'enzyme';
import * as React from 'react';
import { defaultConfig } from '../../../../model/config';
import { createFilterValue, FilterCompare } from '../../../../model/filters';
import { FilterDefinitionSample } from '../../../__tests-data__/filters';
import { actOn } from '../../../__tests__/common.spec';
import FilterSearchInput, { FilterSearchInputProps } from '../filter-search-input';

// Mock createFilterValue to verify it's called
jest.mock('../../../../model/filters', () => ({
  ...jest.requireActual('../../../../model/filters'),
  createFilterValue: jest.fn((def, value) => {
    // Use real implementation for most tests
    const actualModule = jest.requireActual('../../../../model/filters');
    return actualModule.createFilterValue(def, value);
  })
}));

describe('<FilterSearchInput />', () => {
  const props: FilterSearchInputProps = {
    config: defaultConfig,
    filters: { match: 'all', list: [] },
    filterDefinitions: FilterDefinitionSample,
    searchInputValue: '',
    indicator: undefined,
    direction: undefined,
    filter: FilterDefinitionSample[0],
    compare: FilterCompare.match,
    value: '',
    setValue: jest.fn(),
    setCompare: jest.fn(),
    setFilter: jest.fn(),
    setDirection: jest.fn(),
    setIndicator: jest.fn(),
    setSearchInputValue: jest.fn(),
    setFilters: jest.fn(),
    setMessage: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse search input', async () => {
    const wrapper = mount(<FilterSearchInput {...props} />);
    const searchInput = wrapper.find(SearchInput).at(0);
    expect(searchInput).toBeDefined();

    // set a complete filter
    await actOn(() => searchInput.props().onChange!(null!, 'src_name=loki'), wrapper);
    expect(props.setSearchInputValue).toHaveBeenNthCalledWith(1, 'src_name=loki');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ searchInputValue: 'src_name=loki' });

    const srcNameFilter = FilterDefinitionSample.find(f => f.id === 'src_name');
    expect(props.setDirection).toHaveBeenNthCalledWith(1, 'source');
    expect(props.setFilter).toHaveBeenNthCalledWith(1, srcNameFilter);
    expect(props.setCompare).toHaveBeenNthCalledWith(1, '=');
    expect(props.setValue).toHaveBeenNthCalledWith(1, 'loki');

    // update props as if the value was stored in parent component
    wrapper.setProps({ direction: 'source', filter: srcNameFilter, compare: '=', value: 'loki' });

    //open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    //check form content
    const popper = wrapper.find('#filter-popper');
    expect(popper.find('#radio-source').last().props().checked).toBe(true);
    expect(popper.find('#column-filter-toggle').last().text()).toBe('Name');
    expect(popper.find('#filter-compare-toggle-button').last().text()).toBe('Equals=');
    expect(popper.find('#search').last().props().value).toBe('loki');

    // add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);
    expect(props.setFilters).toHaveBeenNthCalledWith(1, {
      list: [{ compare: '=', def: srcNameFilter, values: [{ v: 'loki' }] }],
      match: 'all'
    });
    expect(props.setSearchInputValue).toHaveBeenCalledWith('');
    expect(props.setValue).toHaveBeenCalledWith('');
  });

  it('should use createFilterValue when adding filter', async () => {
    const protocolFilter = FilterDefinitionSample.find(f => f.id === 'protocol')!;
    const wrapper = mount(
      <FilterSearchInput {...props} filter={protocolFilter} value="6" compare={FilterCompare.equal} />
    );

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify createFilterValue was called
    expect(createFilterValue).toHaveBeenCalledWith(protocolFilter, '6');
  });

  it('should add autocomplete filter with display text for protocol', async () => {
    const protocolFilter = FilterDefinitionSample.find(f => f.id === 'protocol')!;
    const wrapper = mount(
      <FilterSearchInput {...props} filter={protocolFilter} value="6" compare={FilterCompare.equal} />
    );

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify filter was added with display text (TCP for protocol 6)
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: protocolFilter,
          values: [{ v: '6', display: 'TCP' }]
        }
      ],
      match: 'all'
    });
  });

  it('should add autocomplete filter with display text for DSCP', async () => {
    const dscpFilter = FilterDefinitionSample.find(f => f.id === 'dscp')!;
    const wrapper = mount(<FilterSearchInput {...props} filter={dscpFilter} value="0" compare={FilterCompare.equal} />);

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify filter was added with display text (Standard for DSCP 0)
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: dscpFilter,
          values: [{ v: '0', display: 'Standard' }]
        }
      ],
      match: 'all'
    });
  });

  it('should add filter without display text for text fields', async () => {
    const nameFilter = FilterDefinitionSample.find(f => f.id === 'src_name')!;
    const wrapper = mount(
      <FilterSearchInput {...props} filter={nameFilter} value="my-pod" compare={FilterCompare.equal} />
    );

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify filter was added without display text (text fields don't have options)
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: nameFilter,
          values: [{ v: 'my-pod' }]
        }
      ],
      match: 'all'
    });
  });

  it('should add filter via search submit', async () => {
    const protocolFilter = FilterDefinitionSample.find(f => f.id === 'protocol')!;
    const wrapper = mount(<FilterSearchInput {...props} />);
    const searchInput = wrapper.find(SearchInput).at(0);

    // Type protocol=6
    await actOn(() => searchInput.props().onChange!(null!, 'protocol=6'), wrapper);
    wrapper.setProps({ searchInputValue: 'protocol=6', filter: protocolFilter, value: '6', compare: '=' });

    // Submit search by calling onSearch
    await actOn(() => {
      const input = wrapper.find(SearchInput).at(0);
      // @ts-expect-error - SearchInput type mismatch
      input.props().onSearch(null, 'protocol=6');
    }, wrapper);

    // Verify filter was added with display text
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: protocolFilter,
          values: [{ v: '6', display: 'TCP' }]
        }
      ],
      match: 'all'
    });
  });

  it('should handle empty value with n/a display', async () => {
    const nameFilter = FilterDefinitionSample.find(f => f.id === 'src_name')!;
    const wrapper = mount(<FilterSearchInput {...props} filter={nameFilter} value="" compare={FilterCompare.equal} />);

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter with empty value
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify filter was added with n/a display for empty value
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: nameFilter,
          values: [{ v: '""', display: 'n/a' }]
        }
      ],
      match: 'all'
    });
  });

  it('should add filter with normalized value from findOption', async () => {
    const protocolFilter = FilterDefinitionSample.find(f => f.id === 'protocol')!;
    const wrapper = mount(
      <FilterSearchInput
        {...props}
        filter={protocolFilter}
        value="TCP" // Name instead of value
        compare={FilterCompare.equal}
      />
    );

    // Open popper
    await actOn(() => wrapper.find('[aria-label="Open advanced search"]').last().simulate('click'), wrapper);

    // Add filter
    await actOn(() => wrapper.find('#add-form-filter').last().simulate('click'), wrapper);

    // Verify filter was added with normalized value (6) and display text (TCP)
    expect(props.setFilters).toHaveBeenCalledWith({
      list: [
        {
          compare: '=',
          def: protocolFilter,
          values: [{ v: '6', display: 'TCP' }]
        }
      ],
      match: 'all'
    });
  });
});
