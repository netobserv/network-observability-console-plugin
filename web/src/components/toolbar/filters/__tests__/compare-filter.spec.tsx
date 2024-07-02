import { mount, shallow } from 'enzyme';
import * as React from 'react';
import CompareFilter, { CompareFilterProps, FilterCompare } from '../compare-filter';

describe('<CompareFilter />', () => {
  const props: CompareFilterProps = {
    value: FilterCompare.equal,
    setValue: jest.fn(),
    component: 'text'
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

    //open dropdown and select not equal
    dropdownToggleButton.last().simulate('click');
    wrapper.find('[id="not-equal"]').last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.notEqual);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select EQUAL
    dropdownToggleButton.last().simulate('click');
    wrapper.find('[id="equal"]').last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.equal);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and check for more than or equal
    dropdownToggleButton.last().simulate('click');
    expect(wrapper.find('[id="more-than"]').length).toBe(0);

    //switch directly
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.notEqual);
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.equal);

    //setState should be called 3 times
    expect(props.setValue).toHaveBeenCalledTimes(4);
  });

  it('number should have more than', async () => {
    const wrapper = mount(<CompareFilter {...props} component={'number'} />);
    const switchButton = wrapper.find('#filter-compare-switch-button').last();
    const dropdownToggleButton = wrapper.find('#filter-compare-toggle-button').last();

    //open dropdown and select more than or equal
    dropdownToggleButton.last().simulate('click');
    wrapper.find('[id="more-than"]').last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.moreThanOrEqual);
    expect(wrapper.find('li').length).toBe(0);

    //switch directly
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.notEqual);
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.moreThanOrEqual);
    switchButton.last().simulate('click');
    expect(props.setValue).toHaveBeenCalledWith(FilterCompare.equal);
  });
});
