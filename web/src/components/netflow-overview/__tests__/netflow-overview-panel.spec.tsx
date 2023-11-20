import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { Card } from '@patternfly/react-core';
import { MetricType } from '../../../model/flow-query';
import { metrics } from '../../__tests-data__/metrics';
import { SamplePanel } from '../../__tests-data__/panels';
import { NetflowOverview } from '../netflow-overview';
import { NetflowOverviewPanel } from '../netflow-overview-panel';
import { MetricsContent, MetricsContentProps } from '../../metrics/metrics-content';

describe('<NetflowOverviewPanel />', () => {
  const panelProps = {
    doubleWidth: false,
    bodyClassName: 'overview-panel-body',
    title: 'title',
    kebabItems: []
  };
  const contentProps: MetricsContentProps = {
    id: SamplePanel.id,
    metricType: 'bytes' as MetricType,
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
        <MetricsContent {...contentProps} />
      </NetflowOverviewPanel>
    );
    expect(wrapper.find(Card)).toHaveLength(1);
  });
});
