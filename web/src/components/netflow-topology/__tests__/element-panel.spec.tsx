import { Button, DrawerCloseButton } from '@patternfly/react-core';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { Filter } from '../../../model/filters';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../../../model/flow-query';
import { ElementPanel, ElementPanelContent } from '../element-panel';
import { dataSample } from '../__tests-data__/metrics';

describe('<ElementPanel />', () => {
  const getNode = (name: string, addr: string) => {
    const bn = new BaseNode();
    bn.setData({
      name,
      addr
    });
    return bn;
  };

  const getEdge = () => {
    const be = new BaseEdge();
    be.setSource(getNode('flowlogs-pipeline-69b6669d59-f76sh', '10.131.0.18'));
    be.setTarget(getNode('dns-default', '172.30.0.10'));
    return be;
  };

  const mocks = {
    element: getNode('loki-distributor-loki-76598c8449-csmh2', '10.129.0.15'),
    metrics: dataSample as TopologyMetrics[],
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    metricScope: 'resource' as MetricScope,
    filters: [] as Filter[],
    setFilters: jest.fn(),
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

  it('should render content', async () => {
    const wrapper = mount(<ElementPanelContent {...mocks} />);
    expect(wrapper.find(ElementPanelContent)).toBeTruthy();

    //check node infos
    expect(wrapper.find('#addressValue').last().text()).toBe('10.129.0.15');
    expect(wrapper.find('#fromCount').last().text()).toBe('7 MB');
    expect(wrapper.find('#toCount').last().text()).toBe('286 kB');
    expect(wrapper.find('#total').last().text()).toBe('7 MB');

    //update to edge
    wrapper.setProps({ ...mocks, element: getEdge() });
    expect(wrapper.find('#source').last().text()).toBe('SourceIP10.131.0.18');
    expect(wrapper.find('#destination').last().text()).toBe('DestinationIP172.30.0.10');
    expect(wrapper.find('#fromCount').last().text()).toBe('78 kB');
    expect(wrapper.find('#toCount').last().text()).toBe('317 kB');
    expect(wrapper.find('#total').last().text()).toBe('396 kB');
  });

  it('should filter content', async () => {
    const wrapper = mount(<ElementPanelContent {...mocks} />);
    const filterButton = wrapper.find(Button);
    filterButton.simulate('click');
    expect(mocks.setFilters).toHaveBeenCalledWith([
      {
        def: expect.any(Object),
        values: [{ v: '10.129.0.15' }]
      }
    ]);
  });
});
