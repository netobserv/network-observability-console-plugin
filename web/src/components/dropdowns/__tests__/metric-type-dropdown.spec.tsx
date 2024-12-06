import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
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
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setMetricType should be called
    expect(props.setMetricType).toHaveBeenCalledTimes(0);
  });

  it('should refresh on select', async () => {
    const wrapper = mount(<MetricTypeDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);

    //select PACKETS
    await actOn(() => wrapper.find('[id="Packets"]').last().simulate('click'), wrapper);
    expect(props.setMetricType).toHaveBeenCalledWith('Packets');
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#metric-dropdown').at(0).simulate('click'), wrapper);

    //select BYTES
    await actOn(() => wrapper.find('[id="Bytes"]').last().simulate('click'), wrapper);

    //setMetricType should be called twice
    expect(props.setMetricType).toHaveBeenCalledTimes(2);
    expect(props.setMetricType).toHaveBeenCalledWith('Bytes');
    expect(wrapper.find('li').length).toBe(0);
  });
});
