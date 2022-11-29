import { mount } from 'enzyme';
import * as React from 'react';

import { ChartDonut } from '@patternfly/react-charts';
import { metrics } from '../../__tests-data__/metrics';
import { StatDonut, StatDonutProps } from '../stat-donut';
import { NamedMetric } from '../../../api/loki';

describe('<StatDonut />', () => {
  const props: StatDonutProps = {
    id: 'donut-test',
    stat: 'sum',
    limit: 5,
    metricType: 'bytes',
    topKMetrics: metrics.map(m => ({ ...m, fullName: 'whatever', shortName: 'whatever', isInternal: false })),
    totalMetric: { stats: { total: 500 } } as NamedMetric,
    showInternal: true,
    showOthers: true,
    showOutOfScope: false
  };
  it('should render donut', async () => {
    const wrapper = mount(<StatDonut {...props} />);
    expect(wrapper.find('VictoryLabel').last().text()).toBe('500 BpsTotal');
    expect(wrapper.find(ChartDonut)).toHaveLength(1);
  });
});
