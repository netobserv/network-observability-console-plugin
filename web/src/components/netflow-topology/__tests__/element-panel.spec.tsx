import { DrawerCloseButton, OptionsMenuToggle } from '@patternfly/react-core';
import { BaseEdge, BaseNode, NodeModel } from '@patternfly/react-topology';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { Filter } from '../../../model/filters';
import { TopologyMetrics } from '../../../api/loki';
import { MetricScope, MetricType } from '../../../model/flow-query';
import { ElementPanel, ElementPanelDetailsContent } from '../element-panel';
import { dataSample } from '../__tests-data__/metrics';
import { NodeData } from '../../../model/topology';
import { ElementPanelMetrics } from '../element-panel-metrics';
import { createPeer } from '../../../utils/metrics';
import { TruncateLength } from '../../../components/dropdowns/truncate-dropdown';

describe('<ElementPanel />', () => {
  const getNode = (kind: string, name: string, addr: string) => {
    const bn = new BaseNode<NodeModel, NodeData>();
    bn.setData({
      nodeType: 'resource',
      peer: createPeer({
        addr: addr,
        resource: { name, type: kind }
      })
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
    expect(wrapper.find('#node-info-address').last().text()).toBe('IP10.129.0.15');

    //update to edge
    wrapper.setProps({ ...mocks, element: getEdge() });
    expect(wrapper.find('#source-content').last().text()).toBe('PodIP10.131.0.18');
    expect(wrapper.find('#destination-content').last().text()).toBe('ServiceIP172.30.0.10');
  });

  it('should render <ElementPanelMetricsContent /> node', async () => {
    const wrapper = mount(
      <ElementPanelMetrics
        metricType={mocks.metricType}
        metrics={mocks.metrics}
        aData={mocks.element.getData()!}
        truncateLength={TruncateLength.M}
        isGroup={false}
      />
    );
    expect(wrapper.find(ElementPanelMetrics)).toBeTruthy();

    //check node metrics
    expect(wrapper.find('#metrics-stats-total-in').last().text()).toBe('94.7 MB');
    expect(wrapper.find('#metrics-stats-avg-in').last().text()).toBe('332.4 kBps');
    expect(wrapper.find('#metrics-stats-latest-in').last().text()).toBe('0 Bps');
    expect(wrapper.find('#metrics-stats-total-out').last().text()).toBe('4.1 MB');
    expect(wrapper.find('#metrics-stats-avg-out').last().text()).toBe('14.3 kBps');
    expect(wrapper.find('#metrics-stats-latest-out').last().text()).toBe('0 Bps');
  });

  it('should render <ElementPanelMetricsContent /> edge a->b', async () => {
    const edge = getEdge();
    const wrapper = mount(
      <ElementPanelMetrics
        metricType={mocks.metricType}
        metrics={mocks.metrics}
        aData={edge.getSource().getData()}
        bData={edge.getTarget().getData()}
        truncateLength={TruncateLength.M}
        isGroup={false}
      />
    );
    expect(wrapper.find(ElementPanelMetrics)).toBeTruthy();

    expect(wrapper.find('#metrics-stats-total-in').last().text()).toBe('1.1 MB');
    expect(wrapper.find('#metrics-stats-avg-in').last().text()).toBe('3.9 kBps');
    expect(wrapper.find('#metrics-stats-latest-in').last().text()).toBe('0 Bps');
    expect(wrapper.find('#metrics-stats-total-out').last().text()).toBe('4.5 MB');
    expect(wrapper.find('#metrics-stats-avg-out').last().text()).toBe('15.9 kBps');
    expect(wrapper.find('#metrics-stats-latest-out').last().text()).toBe('0 Bps');
  });

  it('should filter <ElementPanelDetailsContent />', async () => {
    const wrapper = mount(<ElementPanelDetailsContent {...mocks} />);
    const ipFilters = wrapper.find(OptionsMenuToggle).last();
    // Two buttons: first for pod filter, second for IP filter
    ipFilters.last().simulate('click');
    expect(wrapper.find('li').length).toBe(3);
    wrapper.find('[id="any"]').at(0).simulate('click');
    expect(mocks.setFilters).toHaveBeenCalledWith([
      {
        def: expect.any(Object),
        values: [{ v: '10.129.0.15' }]
      }
    ]);
  });
});
