import { Accordion, AccordionItem, DrawerCloseButton } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { RecordType } from '../../../model/flow-query';
import { FlowsSample } from '../../../components/__tests-data__/flows';
import SummaryPanel, { SummaryPanelContent } from '../summary-panel';
import { NetflowMetrics } from 'src/api/loki';

describe('<SummaryPanel />', () => {
  const now = new Date();

  const mocks = {
    onClose: jest.fn(),
    flows: FlowsSample,
    metrics: {} as NetflowMetrics,
    type: 'flowLog' as RecordType,
    stats: {
      limitReached: false,
      numQueries: 1
    },
    appStats: undefined,
    limit: 5,
    range: 300,
    lastRefresh: now,
    id: 'summary-panel'
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<SummaryPanel {...mocks} />);
    expect(wrapper.find(SummaryPanelContent)).toBeTruthy();
    expect(wrapper.find(SummaryPanelContent)).toHaveLength(1);
  });

  it('should show cardinality', async () => {
    const wrapper = mount(<SummaryPanelContent {...mocks} />);

    expect(wrapper.find(Accordion)).toHaveLength(1);
    expect(wrapper.find(AccordionItem)).toHaveLength(3);

    expect(wrapper.find('#addresses').last().text()).toBe('5 IP(s)');
    expect(wrapper.find('#ports').last().text()).toBe('4 Port(s)');
    expect(wrapper.find('#protocols').last().text()).toBe('1 Protocol(s)');
  });

  it('should toggle panel', async () => {
    const wrapper = shallow(<SummaryPanel {...mocks} />);
    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });
});
