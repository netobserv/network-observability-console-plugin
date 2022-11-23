import { Button, DrawerCloseButton } from '@patternfly/react-core';
import { BaseEdge, BaseNode, NodeModel } from '@patternfly/react-topology';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { Filter } from '../../../model/filters';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../../../model/flow-query';
import { ElementPanel, ElementPanelDetailsContent, ElementPanelMetricsContent } from '../element-panel';
import { dataSample } from '../__tests-data__/metrics';
import { NodeData } from '../../../model/topology';
import { TruncateLength } from '../../../components/dropdowns/truncate-dropdown';

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
    truncateLength: TruncateLength.M,
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

  it('should render <ElementPanelDetailsContent />', async () => {
    const wrapper = mount(<ElementPanelDetailsContent {...mocks} />);
    expect(wrapper.find(ElementPanelDetailsContent)).toBeTruthy();

    //check node infos
    expect(wrapper.find('#addressValue').last().text()).toBe('10.129.0.15');

    //update to edge
    wrapper.setProps({ ...mocks, element: getEdge() });
    expect(wrapper.find('#source-content').last().text()).toBe('PodIP10.131.0.18');
    expect(wrapper.find('#destination-content').last().text()).toBe('ServiceIP172.30.0.10');
  });

  it('should render <ElementPanelMetricsContent />', async () => {
    const wrapper = mount(<ElementPanelMetricsContent {...mocks} />);
    expect(wrapper.find(ElementPanelMetricsContent)).toBeTruthy();

    //check node metrics
    expect(wrapper.find('#inCount').last().text()).toBe('94.7 MB');
    expect(wrapper.find('#outCount').last().text()).toBe('4.1 MB');
    expect(wrapper.find('#total').last().text()).toBe('98.8 MB');

    //update to edge
    wrapper.setProps({ ...mocks, element: getEdge() });
    expect(wrapper.find('#inCount').last().text()).toBe('1.1 MB');
    expect(wrapper.find('#outCount').last().text()).toBe('4.5 MB');
    expect(wrapper.find('#total').last().text()).toBe('5.6 MB');
  });

  it('should filter <ElementPanelDetailsContent />', async () => {
    const wrapper = mount(<ElementPanelDetailsContent {...mocks} />);
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
