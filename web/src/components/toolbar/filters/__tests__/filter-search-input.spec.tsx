import { SearchInput } from '@patternfly/react-core';
import { mount } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample } from '../../../__tests-data__/filters';
import { actOn } from '../../../__tests__/common.spec';
import { FilterCompare } from '../compare-filter';
import FilterSearchInput, { FilterSearchInputProps } from '../filter-search-input';

describe('<FilterSearchInput />', () => {
  const props: FilterSearchInputProps = {
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
    expect(popper.find('#direction-filter-toggle').last().text()).toBe('Source');
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
});
