import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { waitForRender } from '../../../components/__tests__/common.spec';
import { MetricType, RecordType } from '../../../model/flow-query';
import { FlowsSample, getTestFlows } from '../../__tests-data__/flows';
import { FlowsQuerySummary } from '../flows-query-summary';
import { FlowsQuerySummaryContent } from '../flows-query-summary-content';

describe('<FlowsQuerySummary />', () => {
  const now = new Date();

  const mocks = {
    isShowQuerySummary: false,
    toggleQuerySummary: jest.fn(),
    flows: FlowsSample,
    type: 'flowLog' as RecordType,
    metricType: 'Bytes' as MetricType,
    stats: {
      limitReached: false,
      numQueries: 1,
      dataSources: ['loki']
    },
    range: 300,
    lastRefresh: now
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<FlowsQuerySummary {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(FlowsQuerySummaryContent)).toBeTruthy();
    expect(wrapper.find(FlowsQuerySummaryContent)).toHaveLength(1);
  });

  it('should show summary', async () => {
    const wrapper = mount(<FlowsQuerySummary {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find('#flowsCount').last().text()).toBe('3 Flows');
    expect(wrapper.find('#bytesCount').last().text()).toBe('161 kB');
    expect(wrapper.find('#packetsCount').last().text()).toBe('1k Packets');
    expect(wrapper.find('#bytesPerSecondsCount').last().text()).toBe('538 Bps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should format summary', async () => {
    const wrapper = mount(
      <FlowsQuerySummary
        {...mocks}
        flows={getTestFlows(1005)}
        stats={{ limitReached: true, numQueries: 1, dataSources: ['loki'] }}
      />
    );
    await waitForRender(wrapper);

    expect(wrapper.find('#flowsCount').last().text()).toBe('1k+ Flows');
    expect(wrapper.find('#bytesCount').last().text()).toBe('757+ MB');
    expect(wrapper.find('#packetsCount').last().text()).toBe('1k+ Packets');
    expect(wrapper.find('#bytesPerSecondsCount').last().text()).toBe('2.52+ MBps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should toggle panel', async () => {
    const wrapper = mount(<FlowsQuerySummary {...mocks} />);
    await waitForRender(wrapper);

    wrapper.find('#query-summary-toggle').last().simulate('click');
    expect(mocks.toggleQuerySummary).toHaveBeenCalledTimes(1);
  });
});
