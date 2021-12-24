import {
  Button,
  DatePicker,
  Dropdown,
  SearchInput,
  TextInput,
  Toolbar,
  ToolbarFilter,
  ToolbarItem
} from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { ColumnsId, Filter } from '../../utils/columns';
import FiltersToolbar from '../filters-toolbar';
import { ColumnsSample } from '../__tests-data__/columns';
import { DateFilterSample1, DateFilterSample2, FiltersSample, FTPSrcPortSample } from '../__tests-data__/filters';

describe('<FiltersToolbar />', () => {
  const props = {
    columns: ColumnsSample,
    filters: [] as Filter[],
    setFilters: null,
    id: 'filter-toolbar'
  };
  beforeEach(() => {
    props.setFilters = jest.fn();
  });
  it('should render component', () => {
    const wrapper = shallow(<FiltersToolbar {...props} />);
    expect(wrapper.find(FiltersToolbar)).toBeTruthy();
    expect(wrapper.find(Toolbar)).toBeTruthy();
    expect(wrapper.find(ToolbarItem)).toHaveLength(2);
    expect(wrapper.find(Dropdown)).toBeTruthy();
    expect(wrapper.find(Button)).toBeTruthy();
  });
  it('should render filters', () => {
    const wrapper = shallow(<FiltersToolbar {...props} />);
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters.length);

    //add a bunch of filters
    props.filters = FiltersSample;
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters.length);

    //update props to set a single filter
    props.filters = [DateFilterSample1];
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters.length);
  });
  it('should open and close', () => {
    const wrapper = mount(<FiltersToolbar {...props} />);

    const dropdown = wrapper.find('#column-filter-toggle').at(0);
    expect(wrapper.find('.column-filter-item').length).toBe(0);
    //open dropdow
    dropdown.simulate('click');
    expect(wrapper.find('.column-filter-item').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.simulate('click');
    expect(wrapper.find('.column-filter-item').length).toBe(0);

    //setFilters should be called only once for startup
    expect(props.setFilters).toHaveBeenCalledTimes(1);
    //with empty array since url doesn't contains params
    expect(props.setFilters).toHaveBeenCalledWith([]);
  });
  it('should filter', async () => {
    //clear filters
    props.filters = [];
    const wrapper = mount(<FiltersToolbar {...props} />);
    expect(props.setFilters).toHaveBeenNthCalledWith(1, []);

    const dropdown = wrapper.find('#column-filter-toggle').at(0);
    const search = wrapper.find('#search-button').at(0);

    //open dropdow and select Src pod
    dropdown.simulate('click');
    wrapper.find('[id="Src pod"]').at(0).simulate('click');
    //set text input value and press button
    wrapper.find(TextInput).props().onChange('ABCD', null);
    search.simulate('click');
    props.filters = props.filters.concat([{ colId: ColumnsId.srcpod, values: [{ v: 'ABCD' }] }]);
    expect(props.setFilters).toHaveBeenNthCalledWith(2, props.filters);
    wrapper.setProps(props);

    //open dropdow and select Src namespace
    dropdown.simulate('click');
    wrapper.find('[id="Src namespace"]').at(0).simulate('click');
    //set text input value and press enter
    wrapper.find(TextInput).props().onChange('EFGH', null);
    wrapper.find(TextInput).at(0).simulate('keypress', { key: 'Enter' });
    props.filters = props.filters.concat([{ colId: ColumnsId.srcnamespace, values: [{ v: 'EFGH' }] }]);
    expect(props.setFilters).toHaveBeenNthCalledWith(3, props.filters);
    wrapper.setProps(props);

    //open dropdow and select valid Src port by name
    dropdown.simulate('click');
    wrapper.find('[id="Src port"]').at(0).simulate('click');
    //set search input value and press button
    wrapper.find(SearchInput).props().onChange(FTPSrcPortSample.values[0].display, null);
    search.simulate('click');
    props.filters = props.filters.concat([FTPSrcPortSample]);
    expect(props.setFilters).toHaveBeenNthCalledWith(4, props.filters);
    wrapper.setProps(props);

    //open dropdow and select invalid Dst port by name
    dropdown.simulate('click');
    wrapper.find('[id="Dst port"]').at(0).simulate('click');
    //set search input value, press enter and press button
    wrapper.find(SearchInput).props().onChange('no match', null);
    wrapper.find(SearchInput).at(0).simulate('keypress', { key: 'Enter' });
    search.simulate('click');
    expect(props.setFilters).toHaveBeenCalledTimes(4);

    //open dropdow and select Date & time
    dropdown.simulate('click');
    wrapper.find('[id="Date & time"]').at(0).simulate('click');
    //set start date and press button
    const datePickers = wrapper.find(DatePicker);
    datePickers.at(0).props().onChange('2021-12-01', new Date('2021-12-01'));
    search.simulate('click');
    props.filters = props.filters.concat([DateFilterSample1]);
    expect(props.setFilters).toHaveBeenNthCalledWith(5, props.filters);
    wrapper.setProps(props);

    //set end date and press button
    datePickers.at(1).props().onChange('2021-12-05', new Date('2021-12-05'));
    search.simulate('click');
    //replace date filter since only one allowed
    props.filters[props.filters.length - 1] = DateFilterSample2;
    expect(props.setFilters).toHaveBeenNthCalledWith(6, props.filters);
    wrapper.setProps(props);

    //clear all filters
    const button = wrapper
      .findWhere(node => {
        return node.type() === 'button' && node.text() === 'Clear all filters';
      })
      .at(0);
    button.simulate('click');
    expect(props.setFilters).toHaveBeenNthCalledWith(7, []);
  });
});
