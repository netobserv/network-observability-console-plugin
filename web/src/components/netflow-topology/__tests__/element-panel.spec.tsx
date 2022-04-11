import { DrawerCloseButton } from '@patternfly/react-core';
import { BaseNode } from '@patternfly/react-topology';
import { shallow } from 'enzyme';
import * as React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricType } from '../../../model/flow-query';
import { ElementPanel } from '../element-panel';
import { response } from '../__tests-data__/metrics';

describe('<ElementPanel />', () => {
  const mocks = {
    element: {
      getData: () => ({
        name: 'loki-distributor-loki-76598c8449-csmh2',
        addr: '10.129.0.15'
      }),
      getType: () => 'Node'
    } as BaseNode,
    metrics: response.data.result as TopologyMetrics[],
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    onClose: jest.fn(),
    id: 'element-panel-test'
  };

  it('should render component', async () => {
    const wrapper = shallow(<ElementPanel {...mocks} />);
    expect(wrapper.find(ElementPanel)).toBeTruthy();
    expect(wrapper.find('#element-panel-test')).toHaveLength(1);
  });

  it('should close on click', async () => {
    const wrapper = shallow(<ElementPanel {...mocks} />);
    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });
});
