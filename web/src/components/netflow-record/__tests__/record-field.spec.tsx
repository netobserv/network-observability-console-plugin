import { Button } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import { DefaultColumns } from '../../__tests-data__/columns';
import { FlowsSample } from '../../__tests-data__/flows';
import RecordField, { RecordFieldFilter } from '../record-field';
import { Size } from '../../dropdowns/display-dropdown';

describe('<RecordField />', () => {
  const filterMock: RecordFieldFilter = {
    onClick: jest.fn(),
    isDelete: false
  };
  const mocks = {
    size: 'm' as Size
  };
  it('should render single field', async () => {
    //datetime column will produce a single field
    const wrapper = shallow(<RecordField flow={FlowsSample[0]} column={DefaultColumns[0]} {...mocks} />);
    expect(wrapper.find(RecordField)).toBeTruthy();
    expect(wrapper.find('.record-field-content')).toHaveLength(1);
    expect(wrapper.find('.m')).toHaveLength(1);
  });
  it('should filter', async () => {
    const wrapper = shallow(
      <RecordField flow={FlowsSample[0]} column={DefaultColumns[0]} filter={filterMock} {...mocks} />
    );
    expect(wrapper.find(RecordField)).toBeTruthy();
    expect(wrapper.find('.record-field-flex-container')).toHaveLength(1);
    expect(wrapper.find('.record-field-flex')).toHaveLength(1);
    const button = wrapper.find(Button);
    expect(button).toHaveLength(1);
    button.simulate('click');
    expect(filterMock.onClick).toHaveBeenCalledTimes(1);
  });
});
