import * as React from 'react';
import { shallow } from 'enzyme';
import { Tr, Td } from '@patternfly/react-table';

import NetflowTableRow from '../netflow-table-row';
import { Record } from '../../../api/ipfix';
import { DefaultColumns } from '../../__tests-data__/columns';
import { FlowsSample } from '../../__tests-data__/flows';
import { Size } from '../../dropdowns/display-dropdown';

describe('<NetflowTableRow />', () => {
  let flows: Record[] = [];
  const mocks = {
    size: 'm' as Size,
    onSelect: jest.fn()
  };
  it('should render component', async () => {
    flows = FlowsSample;
    const wrapper = shallow(<NetflowTableRow flow={flows[0]} columns={DefaultColumns} {...mocks} highlight={false} />);
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(DefaultColumns.length);
  });
  it('should render given columns', async () => {
    flows = FlowsSample;
    const reducedColumns = DefaultColumns.slice(2, 4);
    const wrapper = shallow(<NetflowTableRow flow={flows[0]} columns={reducedColumns} {...mocks} highlight={true} />);
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(reducedColumns.length);
  });
});
