import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { MetricType } from '../../../model/flow-query';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsQuerySummary, MetricsQuerySummaryContent } from '../metrics-query-summary';

describe('<MetricsQuerySummary />', () => {
  const now = new Date();

  const mocks = {
    isShowQuerySummary: false,
    toggleQuerySummary: jest.fn(),
    metrics: metrics,
    droppedMetrics: [] as TopologyMetrics[],
    appMetrics: undefined,
    appDroppedMetrics: undefined,
    metricType: 'bytes' as MetricType,
    range: 300,
    lastRefresh: now
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<MetricsQuerySummary {...mocks} />);
    expect(wrapper.find(MetricsQuerySummaryContent)).toBeTruthy();
    expect(wrapper.find(MetricsQuerySummaryContent)).toHaveLength(1);
  });

  it('should show summary', async () => {
    const wrapper = mount(<MetricsQuerySummary {...mocks} />);
    expect(wrapper.find('#bytesCount').last().text()).toBe('7 MB');
    expect(wrapper.find('#packetsCount')).toHaveLength(0);
    expect(wrapper.find('#bpsCount').last().text()).toBe('23.2 kBps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should toggle panel', async () => {
    const wrapper = mount(<MetricsQuerySummary {...mocks} />);
    wrapper.find('#query-summary-toggle').last().simulate('click');
    expect(mocks.toggleQuerySummary).toHaveBeenCalledTimes(1);
  });
});
