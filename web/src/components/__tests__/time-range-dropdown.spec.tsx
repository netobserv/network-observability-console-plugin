import * as React from 'react';
import { mount, shallow } from 'enzyme';

import TimeRangeDropdown from '../time-range-dropdown';

describe('<TimeRangeDropdown />', () => {
  const props = {
    range: null,
    setRange: jest.fn(),
    openCustomModal: jest.fn(),
    id: 'time-range'
  };
  it('should render component', async () => {
    const wrapper = shallow(<TimeRangeDropdown {...props} />);
    expect(wrapper.find(TimeRangeDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<TimeRangeDropdown {...props} />);

    const dropdown = wrapper.find('#time-range-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setRange should be called
    expect(props.setRange).toHaveBeenCalledTimes(0);

    //no openCustomModal should be called
    expect(props.openCustomModal).toHaveBeenCalledTimes(0);
  });
  it('should set range on select', async () => {
    const wrapper = mount(<TimeRangeDropdown {...props} />);

    const dropdown = wrapper.find('#time-range-dropdown');
    //open dropdown and select custom range
    dropdown.at(0).simulate('click');
    wrapper.find('[id="CUSTOM_TIME_RANGE_KEY"]').at(0).simulate('click');
    expect(props.openCustomModal).toHaveBeenCalled();
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select 5m
    dropdown.at(0).simulate('click');
    wrapper.find('[id="5m"]').at(0).simulate('click');
    expect(props.setRange).toHaveBeenCalledWith(300);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select 5m
    dropdown.at(0).simulate('click');
    wrapper.find('[id="15m"]').at(0).simulate('click');
    expect(props.setRange).toHaveBeenCalledWith(900);
    expect(wrapper.find('li').length).toBe(0);

    //openCustomModal should be called once
    expect(props.openCustomModal).toHaveBeenCalledTimes(1);

    //setRange should be called twice
    expect(props.setRange).toHaveBeenCalledTimes(2);
  });
});
