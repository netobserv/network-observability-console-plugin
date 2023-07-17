import { mount, shallow } from 'enzyme';
import * as React from 'react';
import CompareFilter, { CompareFilterProps, FilterCompare } from '../compare-filter';

describe('<CompareFilter />', () => {
  const props: CompareFilterProps = {
    value: FilterCompare.EQUAL,
    setValue: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = shallow(<CompareFilter {...props} />);
    expect(wrapper.find(CompareFilter)).toBeTruthy();
  });
  it('should update value', async () => {
    const wrapper = mount(<CompareFilter {...props} />);
    const switchButton = wrapper.find('#filter-compare-switch-button').last();
    const dropdownToggleButton = wrapper.find('#filter-compare-toggle-button').last();

    expect(switchButton).toBeDefined();
    expect(dropdownToggleButton).toBeDefined();

    // No initial call
    expect(props.setValue).toHaveBeenCalledTimes(0);

    //open dropdown and select NOT EQUAL
    dropdownToggleButton.last().simulate('click');
    wrapper.find('[id="not-equal"]').last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.NOT_EQUAL);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select EQUAL
    dropdownToggleButton.last().simulate('click');
    wrapper.find('[id="equal"]').last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.EQUAL);
    expect(wrapper.find('li').length).toBe(0);

    //switch directly
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.NOT_EQUAL);
    expect(wrapper.find('li').length).toBe(0);

    //setState should be called 3 times
    expect(props.setValue).toHaveBeenCalledTimes(3);
  });
});
