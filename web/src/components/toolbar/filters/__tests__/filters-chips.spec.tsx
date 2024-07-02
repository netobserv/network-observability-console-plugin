import { shallow } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample, FiltersSample } from '../../../__tests-data__/filters';
import { FiltersChips, FiltersChipsProps } from '../filters-chips';

describe('<FiltersChips />', () => {
  const props: FiltersChipsProps = {
    filters: { backAndForth: false, list: [] },
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    resetFilters: jest.fn(),
    quickFilters: [],
    filterDefinitions: FilterDefinitionSample,
    isForced: false
  };

  it('should render chips', async () => {
    const wrapper = shallow(<FiltersChips {...props} />);
    expect(wrapper.find('.custom-chip-group')).toHaveLength(props.filters!.list.length);

    //add a bunch of filters
    props.filters!.list = FiltersSample;
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find('.custom-chip-group')).toHaveLength(props.filters!.list.length);

    //update props to set a single filter
    props.filters!.list = [FiltersSample[0]];
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find('.custom-chip-group')).toHaveLength(props.filters!.list.length);
  });
});
