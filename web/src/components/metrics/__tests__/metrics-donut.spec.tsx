import { mount } from 'enzyme';
import * as React from 'react';

import { ChartDonut } from '@patternfly/react-charts';
import { NamedMetric } from '../../../api/loki';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsDonut, MetricsDonutProps } from '../metrics-donut';

describe('<StatDonut />', () => {
  const props: MetricsDonutProps = {
    id: 'donut-test',
    limit: 5,
    metricType: 'Bytes',
    metricFunction: 'rate',
    topKMetrics: metrics.map(m => ({ ...m, fullName: 'whatever', shortName: 'whatever', isInternal: false })),
    totalMetric: { stats: { avg: 500 } } as NamedMetric,
    showInternal: true,
    showOthers: true,
    showOutOfScope: false
  };
  it('should render donut', async () => {
    const wrapper = mount(<MetricsDonut {...props} />);
    expect(wrapper.find('VictoryLabel').last().text()).toBe('500 BpsTotal');
    expect(wrapper.find(ChartDonut)).toHaveLength(1);
  });
});
