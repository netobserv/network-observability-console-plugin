import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { Card } from '@patternfly/react-core';
import { MetricType } from '../../../model/flow-query';
import { metrics } from '../../__tests-data__/metrics';
import { SamplePanel } from '../../__tests-data__/panels';
import { NetflowOverview } from '../netflow-overview';
import { NetflowOverviewPanel } from '../netflow-overview-panel';
import { MetricsGraph, MetricsGraphProps } from '../../metrics/metrics-graph';

describe('<NetflowOverviewPanel />', () => {
  const panelProps = {
    doubleWidth: false,
    bodyClassName: 'overview-panel-body',
    title: 'title',
    kebabItems: []
  };
  const contentProps: MetricsGraphProps = {
    id: SamplePanel.id,
    metricType: 'Bytes' as MetricType,
    metricFunction: 'avg',
    metrics: metrics.map(m => ({ ...m, shortName: 'whatever', fullName: 'whatever', isInternal: false })),
    limit: 5,
    tooltipsTruncate: true
  };
  it('should render component', async () => {
    const wrapper = shallow(<NetflowOverviewPanel {...panelProps} />);
    expect(wrapper.find(NetflowOverview)).toBeTruthy();
  });
  it('should render content', async () => {
    const wrapper = mount(
      <NetflowOverviewPanel {...panelProps}>
        <MetricsGraph {...contentProps} />
      </NetflowOverviewPanel>
    );
    expect(wrapper.find(Card)).toHaveLength(1);
  });
});
