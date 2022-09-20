import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { PanelMainBody } from '@patternfly/react-core';
import { TopologyMetrics } from '../../../api/loki';
import { MetricFunction, MetricType } from '../../../model/flow-query';
import { MetricScopeOptions } from '../../../model/metrics';
import { metrics } from '../../__tests-data__/metrics';
import { SamplePanel } from '../../__tests-data__/panels';
import { NetflowOverview } from '../netflow-overview';
import NetflowOverviewPanel from '../netflow-overview-panel';

describe('<NetflowOverviewPanel />', () => {
  const props = {
    limit: 5,
    panel: SamplePanel,
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    metricScope: MetricScopeOptions.HOST,
    metrics: [] as TopologyMetrics[]
  };
  it('should render component', async () => {
    const wrapper = shallow(<NetflowOverviewPanel {...props} />);
    expect(wrapper.find(NetflowOverview)).toBeTruthy();
  });
  it('should render content', async () => {
    const wrapper = mount(<NetflowOverviewPanel {...props} metrics={metrics} />);
    expect(wrapper.find(PanelMainBody)).toHaveLength(1);
  });
});
