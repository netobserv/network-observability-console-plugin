import { Checkbox } from '@patternfly/react-core';
import { BaseEdge, BaseNode, NodeModel } from '@patternfly/react-topology';
import { waitFor } from '@testing-library/react';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { TopologyMetrics } from '../../../../api/loki';
import { actOn, waitForRender } from '../../../../components/__tests__/common.spec';
import { FilterCompare, Filters } from '../../../../model/filters';
import { FlowScope, MetricType } from '../../../../model/flow-query';
import { NodeData } from '../../../../model/topology';
import { createPeer } from '../../../../utils/metrics';
import { TruncateLength } from '../../../dropdowns/truncate-dropdown';
import { dataSample } from '../../../tabs/netflow-topology/__tests-data__/metrics';
import { FilterDefinitionSample } from '../../../__tests-data__/filters';
import { ElementPanel } from '../element-panel';
import { ElementPanelContent } from '../element-panel-content';
import { ElementPanelMetrics } from '../element-panel-metrics';

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
    droppedMetrics: [],
    metricType: 'Bytes' as MetricType,
    metricScope: 'resource' as FlowScope,
    filters: { list: [], match: 'all' } as Filters,
    filterDefinitions: FilterDefinitionSample,
    setFilters: jest.fn(),
    onClose: jest.fn(),
    truncateLength: TruncateLength.M,
    id: 'element-panel-test'
  };

  it('should render component', async () => {
    const wrapper = shallow(<ElementPanel {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(ElementPanel)).toBeTruthy();
    expect(wrapper.find('#element-panel-test')).toHaveLength(1);
  });

  it('should close on click', async () => {
    const wrapper = shallow(<ElementPanel {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find('.drawer-close-button')).toHaveLength(1);
    await actOn(() => wrapper.find('.drawer-close-button').last().simulate('click'), wrapper);
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it('should render <ElementPanelDetailsContent />', async () => {
    const wrapper = mount(<ElementPanelContent {...mocks} />);
    await waitForRender(wrapper);
    expect(wrapper.find(ElementPanelContent)).toBeTruthy();

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
    await waitForRender(wrapper);
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
    await waitForRender(wrapper);
    expect(wrapper.find(ElementPanelMetrics)).toBeTruthy();

    expect(wrapper.find('#metrics-stats-total-in').last().text()).toBe('1.1 MB');
    expect(wrapper.find('#metrics-stats-avg-in').last().text()).toBe('3.9 kBps');
    expect(wrapper.find('#metrics-stats-latest-in').last().text()).toBe('0 Bps');
    expect(wrapper.find('#metrics-stats-total-out').last().text()).toBe('4.5 MB');
    expect(wrapper.find('#metrics-stats-avg-out').last().text()).toBe('15.9 kBps');
    expect(wrapper.find('#metrics-stats-latest-out').last().text()).toBe('0 Bps');
  });

  it('should filter <ElementPanelDetailsContent />', async () => {
    const wrapper = mount(<ElementPanelContent {...mocks} />);
    await waitForRender(wrapper);

    // Two buttons: first for pod filter, second for IP filter => click on second
    await actOn(() => wrapper.find('.summary-filters-toggle').last().simulate('click'), wrapper);

    // Two items: source or destination
    expect(wrapper.find('li').length).toBe(2);
    await actOn(() => {
      wrapper.find('[id="src"]').find(Checkbox).props().onChange!({} as React.FormEvent<HTMLInputElement>, true);
    }, wrapper);
    await waitFor(() => {
      expect(mocks.setFilters).toHaveBeenCalledTimes(1);
      expect(mocks.setFilters).toHaveBeenCalledWith([
        {
          def: expect.any(Object),
          compare: FilterCompare.equal,
          values: [{ v: '10.129.0.15' }]
        }
      ]);
    });
  });
});
