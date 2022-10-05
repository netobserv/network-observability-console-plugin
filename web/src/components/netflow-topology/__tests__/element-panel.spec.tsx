import { Button, DrawerCloseButton } from '@patternfly/react-core';
import { BaseEdge, BaseNode, NodeModel } from '@patternfly/react-topology';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { Filter } from '../../../model/filters';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../../../model/flow-query';
import { ElementPanel, ElementPanelContent } from '../element-panel';
import { dataSample } from '../__tests-data__/metrics';
import { NodeData } from '../../../model/topology';

describe('<ElementPanel />', () => {
  const getNode = (kind: string, name: string, addr: string) => {
    const bn = new BaseNode<NodeModel, NodeData>();
    bn.setData({
      nodeType: 'resource',
      resourceKind: kind,
      name,
      addr
    });
    return bn;
  };

  const getEdge = () => {
    const be = new BaseEdge();
    be.setSource(getNode('Pod', 'flowlogs-pipeline-69b6669d59-f76sh', '10.131.0.18'));
    be.setTarget(getNode('Service', 'dns-default', '172.30.0.10'));
    return be;
  };

  const mocks = {
    element: getNode('Pod', 'loki-distributor-loki-76598c8449-csmh2', '10.129.0.15'),
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
    expect(wrapper.find('#inCount').last().text()).toBe('100 MB');
    expect(wrapper.find('#outCount').last().text()).toBe('4 MB');
    expect(wrapper.find('#total').last().text()).toBe('104 MB');

    //update to edge
    wrapper.setProps({ ...mocks, element: getEdge() });
    expect(wrapper.find('#source').last().text()).toBe('SourcePodIP10.131.0.18');
    expect(wrapper.find('#destination').last().text()).toBe('DestinationServiceIP172.30.0.10');
    expect(wrapper.find('#inCount').last().text()).toBe('1 MB');
    expect(wrapper.find('#outCount').last().text()).toBe('5 MB');
    expect(wrapper.find('#total').last().text()).toBe('6 MB');
  });

  it('should filter content', async () => {
    const wrapper = mount(<ElementPanelContent {...mocks} />);
    const filterButtons = wrapper.find(Button);
    // Two buttons: first for pod filter, second for IP filter
    filterButtons.last().simulate('click');
    expect(mocks.setFilters).toHaveBeenCalledWith([
      {
        def: expect.any(Object),
        values: [{ v: '10.129.0.15' }]
      }
    ]);
  });
});
