import { DrawerCloseButton } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import { waitForRender } from '../../../../components/__tests__/common.spec';
import { DefaultColumnSample } from '../../../__tests-data__/columns';
import { FilterDefinitionSample, FiltersSample } from '../../../__tests-data__/filters';
import { FlowsSample, UnknownFlow } from '../../../__tests-data__/flows';
import RecordPanel, { RecordDrawerProps } from '../record-panel';

describe('<RecordPanel />', () => {
  const mocks: RecordDrawerProps = {
    record: FlowsSample[0],
    columns: DefaultColumnSample,
    filters: FiltersSample,
    filterDefinitions: FilterDefinitionSample,
    range: 300,
    type: 'flowLog',
    canSwitchTypes: false,
    allowPktDrops: false,
    setFilters: jest.fn(),
    setRange: jest.fn(),
    setType: jest.fn(),
    onClose: jest.fn(),
    id: 'record-panel-test'
  };

  it('should render component', async () => {
    const wrapper = shallow(<RecordPanel {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(RecordPanel)).toBeTruthy();
    expect(wrapper.find('#record-panel-test')).toHaveLength(1);
    // all columns with data + JSON field
    // sample contains 20 fields
    expect(wrapper.find('.record-field-container')).toHaveLength(20);
    // No ICMP
    expect(wrapper.find({ 'data-test-id': 'drawer-field-IcmpType' })).toHaveLength(0);
    expect(wrapper.find({ 'data-test-id': 'drawer-field-IcmpCode' })).toHaveLength(0);
    // same with 4 valid fields
    wrapper.setProps({ record: UnknownFlow });
    expect(wrapper.find('.record-field-container')).toHaveLength(4);
  });

  it('should close on click', async () => {
    const wrapper = shallow(<RecordPanel {...mocks} />);
    await waitForRender(wrapper);

    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it('should render ICMP', async () => {
    const flowWithICMP = {
      ...mocks.record,
      fields: {
        ...mocks.record.fields,
        IcmpType: 8,
        IcmpCode: 0
      }
    };
    const wrapper = shallow(<RecordPanel {...mocks} record={flowWithICMP} />);
    await waitForRender(wrapper);

    expect(wrapper.find(RecordPanel)).toBeTruthy();
    expect(wrapper.find({ 'data-test-id': 'drawer-field-IcmpType' })).toHaveLength(1);
    expect(wrapper.find({ 'data-test-id': 'drawer-field-IcmpCode' })).toHaveLength(1);
  });
});
