import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { MetricType, RecordType } from '../../../model/flow-query';
import { FlowsSample, getTestFlows } from '../../__tests-data__/flows';
import { FlowsQuerySummary, FlowsQuerySummaryContent } from '../flows-query-summary';

describe('<FlowsQuerySummary />', () => {
  const now = new Date();

  const mocks = {
    isShowQuerySummary: false,
    toggleQuerySummary: jest.fn(),
    flows: FlowsSample,
    type: 'flowLog' as RecordType,
    metricType: 'bytes' as MetricType,
    stats: {
      limitReached: false,
      numQueries: 1
    },
    range: 300,
    lastRefresh: now
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<FlowsQuerySummary {...mocks} />);
    expect(wrapper.find(FlowsQuerySummaryContent)).toBeTruthy();
    expect(wrapper.find(FlowsQuerySummaryContent)).toHaveLength(1);
  });

  it('should show summary', async () => {
    const wrapper = mount(<FlowsQuerySummary {...mocks} />);
    expect(wrapper.find('#flowsCount').last().text()).toBe('3 Flows');
    expect(wrapper.find('#bytesCount').last().text()).toBe('161 kB');
    expect(wrapper.find('#packetsCount').last().text()).toBe('1k Packets');
    expect(wrapper.find('#bpsCount').last().text()).toBe('538 Bps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should format summary', async () => {
    const wrapper = mount(
      <FlowsQuerySummary {...mocks} flows={getTestFlows(1005)} stats={{ limitReached: true, numQueries: 1 }} />
    );
    expect(wrapper.find('#flowsCount').last().text()).toBe('1k+ Flows');
    expect(wrapper.find('#bytesCount').last().text()).toBe('757+ MB');
    expect(wrapper.find('#packetsCount').last().text()).toBe('1k+ Packets');
    expect(wrapper.find('#bpsCount').last().text()).toBe('2.52+ MBps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should toggle panel', async () => {
    const wrapper = mount(<FlowsQuerySummary {...mocks} />);
    wrapper.find('#query-summary-toggle').last().simulate('click');
    expect(mocks.toggleQuerySummary).toHaveBeenCalledTimes(1);
  });
});
