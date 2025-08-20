import { Accordion, AccordionItem, DrawerCloseButton } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { NetflowMetrics } from '../../../api/loki';
import { FlowsSample } from '../../../components/__tests-data__/flows';
import { waitForRender } from '../../../components/__tests__/common.spec';
import { RecordType } from '../../../model/flow-query';
import { SummaryPanel } from '../summary-panel';
import { SummaryPanelContent } from '../summary-panel-content';

describe('<SummaryPanel />', () => {
  const now = new Date();

  const mocks = {
    onClose: jest.fn(),
    flows: FlowsSample,
    metrics: {} as NetflowMetrics,
    type: 'flowLog' as RecordType,
    stats: {
      limitReached: false,
      numQueries: 1,
      dataSources: ['loki']
    },
    appStats: undefined,
    limit: 5,
    range: 300,
    lastRefresh: now,
    id: 'summary-panel'
  };

  it('should shallow component', async () => {
    const wrapper = shallow(<SummaryPanel {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(SummaryPanelContent)).toBeTruthy();
    expect(wrapper.find(SummaryPanelContent)).toHaveLength(1);
  });

  it('should show cardinality', async () => {
    const wrapper = mount(<SummaryPanelContent {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(Accordion)).toHaveLength(1);
    expect(wrapper.find(AccordionItem)).toHaveLength(5);

    expect(wrapper.find('#addresses').last().text()).toBe('5 IP(s)');
    expect(wrapper.find('#ports').last().text()).toBe('4 Port(s)');
    expect(wrapper.find('#protocols').last().text()).toBe('1 Protocol(s)');
    expect(wrapper.find('#Pod').last().text()).toBe('2 Pod(s)');
    expect(wrapper.find('#Namespace').last().text()).toBe('1 Namespace(s)');
  });

  it('should toggle panel', async () => {
    const wrapper = shallow(<SummaryPanel {...mocks} />);
    await waitForRender(wrapper);

    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });
});
