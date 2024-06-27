import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import { compareNumbers } from '../../../../utils/base-compare';
import { ColumnsId } from '../../../../utils/columns';
import { Size } from '../../../dropdowns/table-display-dropdown';
import { DefaultColumnSample } from '../../../__tests-data__/columns';
import { FlowsSample } from '../../../__tests-data__/flows';
import RecordField, { RecordFieldFilter } from '../record-field';

describe('<RecordField />', () => {
  const filterMock: RecordFieldFilter = {
    type: 'filter',
    onClick: jest.fn(),
    isDelete: false
  };
  const mocks = {
    allowPktDrops: true,
    size: 'm' as Size,
    useLinks: true
  };
  it('should render single field', async () => {
    //datetime column will produce a single field
    const wrapper = shallow(<RecordField flow={FlowsSample[0]} column={DefaultColumnSample[0]} {...mocks} />);
    expect(wrapper.find(RecordField)).toBeTruthy();
    expect(wrapper.find('.record-field-content.m')).toHaveLength(1);
  });
  it('should filter', async () => {
    const wrapper = shallow(
      <RecordField flow={FlowsSample[0]} column={DefaultColumnSample[0]} filter={filterMock} {...mocks} />
    );
    expect(wrapper.find(RecordField)).toBeTruthy();
    expect(wrapper.find('.record-field-flex-container')).toHaveLength(1);
    expect(wrapper.find('.record-field-flex')).toHaveLength(1);
    const button = wrapper.find(Button);
    expect(button).toHaveLength(1);
    button.simulate('click');
    expect(filterMock.onClick).toHaveBeenCalledTimes(1);
  });
  it('should display <1ms DNS latency', async () => {
    const wrapper = shallow(
      <RecordField
        flow={FlowsSample[2]}
        column={{
          id: ColumnsId.dnslatency,
          group: 'DNS',
          name: 'DNS Latency',
          isSelected: true,
          value: f => (f.fields.DnsLatencyMs === undefined ? Number.NaN : f.fields.DnsLatencyMs),
          sort: (a, b, col) => compareNumbers(col.value(a) as number, col.value(b) as number),
          width: 5
        }}
        {...mocks}
      />
    );
    expect(wrapper.find(RecordField)).toBeTruthy();
    expect(wrapper.find('.record-field-value')).toHaveLength(1);
    expect(wrapper.find('.record-field-value').childAt(0).text()).toBe('< 1ms');
  });
});
