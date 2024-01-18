import { shallow } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample, FiltersSample } from '../../__tests-data__/filters';
import { DefaultColumnSample } from '../../__tests-data__/columns';
import { FlowsSample, UnknownFlow } from '../../__tests-data__/flows';
import RecordPanel, { RecordDrawerProps } from '../record-panel';
import { DrawerCloseButton } from '@patternfly/react-core';

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
    deduperMerge: false,
    setFilters: jest.fn(),
    setRange: jest.fn(),
    setType: jest.fn(),
    onClose: jest.fn(),
    id: 'record-panel-test'
  };
  it('should render component', async () => {
    const wrapper = shallow(<RecordPanel {...mocks} />);
    expect(wrapper.find(RecordPanel)).toBeTruthy();
    expect(wrapper.find('#record-panel-test')).toHaveLength(1);
    // all columns with data + JSON field
    // sample contains 18 fields
    // JSON tab represent 1 extra field
    expect(wrapper.find('.record-field-container')).toHaveLength(18 + 1);

    // same with 4 valid fields + json
    wrapper.setProps({ record: UnknownFlow });
    expect(wrapper.find('.record-field-container')).toHaveLength(4 + 1);
  });
  it('should close on click', async () => {
    const wrapper = shallow(<RecordPanel {...mocks} />);
    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });
});
