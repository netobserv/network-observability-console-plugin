import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { EmptyState } from '@patternfly/react-core';
import { TopologyMetrics } from '../../../api/loki';
import LokiError from '../../../components/messages/loki-error';
import { metrics } from '../../../components/__tests-data__/metrics';
import { MetricFunction, MetricType } from '../../../model/flow-query';
import { MetricScopeOptions } from '../../../model/metrics';
import { SamplePanel, ShuffledDefaultPanels } from '../../__tests-data__/panels';
import { NetflowOverview } from '../netflow-overview';
import NetflowOverviewPanel from '../netflow-overview-panel';

describe('<NetflowOverview />', () => {
  const props = {
    limit: 5,
    panels: ShuffledDefaultPanels,
    error: undefined as string | undefined,
    loading: false,
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    metricScope: MetricScopeOptions.HOST,
    metrics: [] as TopologyMetrics[],
    clearFilters: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = shallow(<NetflowOverview {...props} />);
    expect(wrapper.find(NetflowOverview)).toBeTruthy();
  });
  it('should render error', async () => {
    const wrapper = shallow(<NetflowOverview {...props} />);
    wrapper.setProps({
      error: 'couic!'
    });
    wrapper.update();
    expect(wrapper.find(LokiError)).toHaveLength(1);
  });
  it('should render empty state', async () => {
    const wrapper = mount(<NetflowOverview {...props} />);
    const containerDiv = wrapper.find(EmptyState);
    expect(containerDiv.length).toEqual(1);
  });
  it('should render panels', async () => {
    const wrapper = mount(<NetflowOverview {...props} metrics={metrics} />);
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(props.panels.length);
    wrapper.setProps({
      panels: [SamplePanel]
    });
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(1);
  });
});
