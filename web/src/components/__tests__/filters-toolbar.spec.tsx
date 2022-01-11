import { Button, Dropdown, TextInput, Toolbar, ToolbarFilter, ToolbarItem } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { ColumnsId } from '../../utils/columns';
import { Filter } from '../../utils/filters';
import FiltersToolbar, { FiltersToolbarProps } from '../filters-toolbar';
import { ColumnsSample } from '../__tests-data__/columns';
import { FiltersSample, FTPSrcPortSample } from '../__tests-data__/filters';

describe('<FiltersToolbar />', () => {
  const props: FiltersToolbarProps = {
    columns: ColumnsSample,
    filters: [] as Filter[],
    setFilters: jest.fn(),
    clearFilters: jest.fn(),
    id: 'filter-toolbar'
  };
  beforeEach(() => {
    props.setFilters = jest.fn();
    props.clearFilters = jest.fn();
  });
  it('should render component', async () => {
    const wrapper = shallow(<FiltersToolbar {...props} />);
    expect(wrapper.find(FiltersToolbar)).toBeTruthy();
    expect(wrapper.find(Toolbar)).toBeTruthy();
    expect(wrapper.find(ToolbarItem)).toHaveLength(2);
    expect(wrapper.find(Dropdown)).toBeTruthy();
    expect(wrapper.find(Button)).toBeTruthy();
  });
  it('should render filters', async () => {
    const wrapper = shallow(<FiltersToolbar {...props} />);
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters!.length);

    //add a bunch of filters
    props.filters = FiltersSample;
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters.length);

    //update props to set a single filter
    props.filters = [FiltersSample[0]];
    wrapper.setProps({ filters: props.filters });
    expect(wrapper.find(ToolbarFilter)).toHaveLength(props.filters.length);
  });
  it('should open and close', async () => {
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
    act(() => {
      //set text input value and press button
      wrapper.find(TextInput).props().onChange!('ABCD', null!);
    });
    search.simulate('click');
    props.filters = props.filters.concat([{ colId: ColumnsId.srcpod, values: [{ v: 'ABCD' }] }]);
    expect(props.setFilters).toHaveBeenNthCalledWith(2, props.filters);
    wrapper.setProps(props as Pick<FiltersToolbarProps, keyof FiltersToolbarProps>);

    //open dropdow and select Src namespace
    dropdown.simulate('click');
    wrapper.find('[id="Src namespace"]').at(0).simulate('click');
    act(() => {
      //set text input value and press enter
      wrapper.find(TextInput).props().onChange!('EFGH', null!);
    });
    wrapper.find(TextInput).at(0).simulate('keypress', { key: 'Enter' });
    props.filters = props.filters.concat([{ colId: ColumnsId.srcnamespace, values: [{ v: 'EFGH' }] }]);
    expect(props.setFilters).toHaveBeenNthCalledWith(3, props.filters);
    wrapper.setProps(props as Pick<FiltersToolbarProps, keyof FiltersToolbarProps>);

    //open dropdow and select valid Src port by name
    dropdown.simulate('click');
    wrapper.find('[id="Src port"]').at(0).simulate('click');
    act(() => {
      //set search input value
      wrapper.find(TextInput).props().onChange!(FTPSrcPortSample.values[0].display!, null!);
    });
    //press enter and await for popper to disapear
    await act(async () => {
      wrapper.find(TextInput).at(0).simulate('keypress', { key: 'Enter' });
    });
    props.filters = props.filters.concat([FTPSrcPortSample]);
    expect(props.setFilters).toHaveBeenNthCalledWith(4, props.filters);
    wrapper.setProps(props as Pick<FiltersToolbarProps, keyof FiltersToolbarProps>);

    //open dropdow and select invalid Dst port by name
    dropdown.simulate('click');
    wrapper.find('[id="Dst port"]').at(0).simulate('click');
    act(() => {
      //set search input value, press enter and press button
      wrapper.find(TextInput).props().onChange!('no match', null!);
    });
    wrapper.find(TextInput).at(0).simulate('keypress', { key: 'Enter' });
    search.simulate('click');
    expect(props.setFilters).toHaveBeenCalledTimes(4);

    //clear all filters
    expect(props.clearFilters).not.toHaveBeenCalled();
    const button = wrapper
      .findWhere(node => {
        return node.type() === 'button' && node.text() === 'Clear all filters';
      })
      .at(0);
    button.simulate('click');
    expect(props.clearFilters).toHaveBeenCalledTimes(1);
  });
  it('should forward valid IP addresses', async () => {
    props.filters = [];
    const wrapper = mount(<FiltersToolbar {...props} />);
    jest.clearAllMocks();

    const dropdown = wrapper.find('#column-filter-toggle').at(0);
    const search = wrapper.find('#search-button').at(0);
    //open dropdow and select Src address
    dropdown.simulate('click');
    wrapper.find('[id="Src address"]').at(0).simulate('click');
    act(() => {
      //set text input value and press button
      wrapper.find(TextInput).props().onChange!('1.2.3.4', null!);
    });
    search.simulate('click');
    expect(props.setFilters).toHaveBeenCalledWith([
      {
        colId: ColumnsId.srcaddr,
        values: [{ v: '1.2.3.4' }]
      }
    ]);
  });
  it('should not forward invalid IP addresses', async () => {
    const wrapper = mount(<FiltersToolbar {...props} />);
    jest.clearAllMocks();
    const dropdown = wrapper.find('#column-filter-toggle').at(0);
    const search = wrapper.find('#search-button').at(0);
    //open dropdow and select Src address
    dropdown.simulate('click');
    wrapper.find('[id="Src address"]').at(0).simulate('click');
    act(() => {
      //set text input value and press button
      wrapper.find(TextInput).props().onChange!('asdlfkj', null!);
    });
    search.simulate('click');
    expect(props.setFilters).not.toHaveBeenCalled();
  });
  it('should filter with autocompletion fast selection', async () => {
    props.filters = [];
    const wrapper = mount(<FiltersToolbar {...props} />);
    jest.clearAllMocks();

    const dropdown = wrapper.find('#column-filter-toggle').at(0);
    //open dropdown and select Direction
    dropdown.simulate('click');
    wrapper.find('[id="Direction"]').at(0).simulate('click');
    act(() => {
      //set text input value and press button
      wrapper.find(TextInput).props().onChange!('eg', null!);
    });
    //press enter and await for popper to disapear
    await act(async () => {
      wrapper.find(TextInput).at(0).simulate('keypress', { key: 'Enter' });
    });
    const expected: Filter[] = [
      {
        colId: ColumnsId.flowdir,
        values: [{ v: '1', display: 'Egress' }]
      }
    ];
    expect(props.setFilters).toHaveBeenCalledWith(expected);
    expect(props.setFilters).toHaveBeenCalledTimes(1);
  });
});
