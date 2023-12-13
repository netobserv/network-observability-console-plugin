import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { NetflowMetrics } from '../../../api/loki';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsQuerySummary, MetricsQuerySummaryContent } from '../metrics-query-summary';

describe('<MetricsQuerySummary />', () => {
  const now = new Date();

  const mocks = {
    toggleQuerySummary: jest.fn(),
    metrics: { rateMetrics: { bytes: metrics } } as NetflowMetrics,
    stats: {
      limitReached: false,
      numQueries: 1
    },
    lastRefresh: now
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<MetricsQuerySummary {...mocks} />);
    expect(wrapper.find(MetricsQuerySummaryContent)).toBeTruthy();
    expect(wrapper.find(MetricsQuerySummaryContent)).toHaveLength(1);
  });

  it('should show summary', async () => {
    const wrapper = mount(<MetricsQuerySummary {...mocks} />);
    expect(wrapper.find('#bytesCount').last().text()).toBe('6.8 MB');
    expect(wrapper.find('#packetsCount')).toHaveLength(0);
    expect(wrapper.find('#bytesPerSecondsCount').last().text()).toBe('22.79 kBps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should toggle panel', async () => {
    const wrapper = mount(<MetricsQuerySummary {...mocks} />);
    wrapper.find('#query-summary-toggle').last().simulate('click');
    expect(mocks.toggleQuerySummary).toHaveBeenCalledTimes(1);
  });
});
