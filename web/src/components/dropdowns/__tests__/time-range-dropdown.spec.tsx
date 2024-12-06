import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
import { TimeRangeDropdown, TimeRangeDropdownProps } from '../time-range-dropdown';

describe('<TimeRangeDropdown />', () => {
  const props: TimeRangeDropdownProps = {
    range: 300,
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
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#time-range-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#time-range-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setRange should be called
    expect(props.setRange).toHaveBeenCalledTimes(0);

    //no openCustomModal should be called
    expect(props.openCustomModal).toHaveBeenCalledTimes(0);
  });

  it('should set range on select', async () => {
    const wrapper = mount(<TimeRangeDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#time-range-dropdown').at(0).simulate('click'), wrapper);

    //select custom range
    await actOn(() => wrapper.find('[id="CUSTOM_TIME_RANGE_KEY"]').last().simulate('click'), wrapper);
    expect(props.openCustomModal).toHaveBeenCalled();
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#time-range-dropdown').at(0).simulate('click'), wrapper);

    //select 5m
    await actOn(() => wrapper.find('[id="5m"]').last().simulate('click'), wrapper);
    expect(props.setRange).toHaveBeenCalledWith(300);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#time-range-dropdown').at(0).simulate('click'), wrapper);
    //select 15m
    await actOn(() => wrapper.find('[id="15m"]').last().simulate('click'), wrapper);

    //openCustomModal should be called once
    expect(props.openCustomModal).toHaveBeenCalledTimes(1);
    expect(props.setRange).toHaveBeenCalledWith(900);
    expect(wrapper.find('li').length).toBe(0);

    //setRange should be called twice
    expect(props.setRange).toHaveBeenCalledTimes(2);
  });
});
