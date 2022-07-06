import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { FlowsSample } from '../../../components/__tests-data__/flows';
import { QuerySummary, QuerySummaryContent } from '../query-summary';

describe('<QuerySummary />', () => {
  const now = new Date();

  const mocks = {
    toggleQuerySummary: jest.fn(),
    flows: FlowsSample,
    range: 300,
    stats: {
      limitReached: false,
      numQueries: 1
    },
    lastRefresh: now
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<QuerySummary {...mocks} />);
    expect(wrapper.find(QuerySummaryContent)).toBeTruthy();
    expect(wrapper.find(QuerySummaryContent)).toHaveLength(1);
  });

  it('should show summary', async () => {
    const wrapper = mount(<QuerySummary {...mocks} />);
    expect(wrapper.find('#flowsCount').last().text()).toBe('3 flows');
    expect(wrapper.find('#bytesCount').last().text()).toBe('161 kB');
    expect(wrapper.find('#packetsCount').last().text()).toBe('1100 packets');
    expect(wrapper.find('#bpsCount').last().text()).toBe('538 Bps');
    expect(wrapper.find('#lastRefresh').last().text()).toBe(now.toLocaleTimeString());
  });

  it('should toggle panel', async () => {
    const wrapper = mount(<QuerySummary {...mocks} />);
    wrapper.find('#query-summary').last().simulate('click');
    expect(mocks.toggleQuerySummary).toHaveBeenCalledTimes(1);
  });
});
