import { Accordion, AccordionItem, DrawerCloseButton } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';
import { FlowsSample } from '../../../components/__tests-data__/flows';
import SummaryPanel, { SummaryPanelContent } from '../summary-panel';

describe('<SummaryPanel />', () => {
  const mocks = {
    onClose: jest.fn(),
    flows: FlowsSample,
    range: 300,
    limit: 100,
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
