import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { PanelMainBody, Spinner } from '@patternfly/react-core';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricType } from '../../../model/flow-query';
import { metrics } from '../../__tests-data__/metrics';
import { SamplePanel } from '../../__tests-data__/panels';
import { NetflowOverview } from '../netflow-overview';
import NetflowOverviewPanel from '../netflow-overview-panel';

describe('<NetflowOverviewPanel />', () => {
  const props = {
    panel: SamplePanel,
    loading: false,
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    metrics: [] as TopologyMetrics[]
  };
  it('should render component', async () => {
    const wrapper = shallow(<NetflowOverviewPanel {...props} />);
    expect(wrapper.find(NetflowOverview)).toBeTruthy();
  });
  it('should render loading', async () => {
    const wrapper = shallow(<NetflowOverviewPanel {...props} />);
    wrapper.setProps({
      loading: true
    });
    wrapper.update();
    expect(wrapper.find(Spinner)).toHaveLength(1);
  });
  it('should render content', async () => {
    const wrapper = mount(<NetflowOverviewPanel {...props} metrics={metrics} />);
    expect(wrapper.find(PanelMainBody)).toHaveLength(1);
  });
});
