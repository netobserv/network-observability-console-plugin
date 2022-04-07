import * as React from 'react';
import { mount, shallow } from 'enzyme';

import MetricFunctionDropdown from '../metric-function-dropdown';
import { TopologyMetricFunctions } from '../../../model/topology';

describe('<MetricDropdown />', () => {
  const props = {
    selected: TopologyMetricFunctions.AVG,
    setMetricFunction: jest.fn(),
    id: 'metric'
  };
  it('should render component', async () => {
    const wrapper = shallow(<MetricFunctionDropdown {...props} />);
    expect(wrapper.find(MetricFunctionDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<MetricFunctionDropdown {...props} />);

    const dropdown = wrapper.find('#metric-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setMetricType should be called
    expect(props.setMetricFunction).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<MetricFunctionDropdown {...props} />);

    const dropdown = wrapper.find('#metric-dropdown');
    //open dropdown and select RATE
    dropdown.at(0).simulate('click');
    wrapper.find('[id="rate"]').at(0).simulate('click');
    expect(props.setMetricFunction).toHaveBeenCalledWith(TopologyMetricFunctions.RATE);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select MAX
    dropdown.at(0).simulate('click');
    wrapper.find('[id="max"]').at(0).simulate('click');
    expect(props.setMetricFunction).toHaveBeenCalledWith(TopologyMetricFunctions.MAX);
    expect(wrapper.find('li').length).toBe(0);

    //setMetricFunction should be called twice
    expect(props.setMetricFunction).toHaveBeenCalledTimes(2);
  });
});
