import { mount } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
import { MetricFunctionDropdown } from '../metric-function-dropdown';

describe('<MetricDropdown />', () => {
  const props = {
    selected: 'avg',
    setMetricFunction: jest.fn(),
    id: 'metric'
  };

  it('should render component', async () => {
    const wrapper = mount(<MetricFunctionDropdown {...props} />);
    expect(wrapper.find(MetricFunctionDropdown)).toBeTruthy();
  });

  it('should open and close', async () => {
    const wrapper = mount(<MetricFunctionDropdown {...props} />);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setMetricType should be called
    expect(props.setMetricFunction).toHaveBeenCalledTimes(0);
  });

  it('should refresh on select', async () => {
    const wrapper = mount(<MetricFunctionDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);

    //select MAX
    await actOn(() => wrapper.find('[id="max"]').last().simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //setMetricFunction should be called once
    expect(props.setMetricFunction).toHaveBeenCalledTimes(1);
    expect(props.setMetricFunction).toHaveBeenCalledWith('max');
    expect(wrapper.find('li').length).toBe(0);
  });
});
