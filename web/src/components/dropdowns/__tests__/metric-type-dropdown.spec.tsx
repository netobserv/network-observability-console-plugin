import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { MetricType } from '../../../model/flow-query';
import { MetricTypeDropdown } from '../metric-type-dropdown';

describe('<MetricDropdown />', () => {
  const props = {
    allowedTypes: ['Bytes', 'Packets'] as MetricType[],
    selected: 'Bytes',
    setMetricType: jest.fn(),
    id: 'metric'
  };
  it('should render component', async () => {
    const wrapper = shallow(<MetricTypeDropdown {...props} />);
    expect(wrapper.find(MetricTypeDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<MetricTypeDropdown {...props} />);

    const dropdown = wrapper.find('#metric-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setMetricType should be called
    expect(props.setMetricType).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<MetricTypeDropdown {...props} />);

    const dropdown = wrapper.find('#metric-dropdown');
    //open dropdown and select PACKETS
    dropdown.at(0).simulate('click');
    wrapper.find('[id="Packets"]').at(0).simulate('click');
    expect(props.setMetricType).toHaveBeenCalledWith('Packets');
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select BYTES
    dropdown.at(0).simulate('click');
    wrapper.find('[id="Bytes"]').at(0).simulate('click');
    expect(props.setMetricType).toHaveBeenCalledWith('Bytes');
    expect(wrapper.find('li').length).toBe(0);

    //setMetricType should be called twice
    expect(props.setMetricType).toHaveBeenCalledTimes(2);
  });
});
