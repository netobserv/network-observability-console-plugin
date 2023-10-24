import * as React from 'react';
import { shallow } from 'enzyme';
import { Tr, Td } from '@patternfly/react-table';

import NetflowTableRow from '../netflow-table-row';
import { Record } from '../../../api/ipfix';
import { DefaultColumnSample } from '../../__tests-data__/columns';
import { FlowsSample } from '../../__tests-data__/flows';
import { Size } from '../../dropdowns/table-display-dropdown';

describe('<NetflowTableRow />', () => {
  let flows: Record[] = [];
  const mocks = {
    size: 'm' as Size,
    onSelect: jest.fn(),
    tableWidth: 100,
    showContent: true
  };
  it('should render component', async () => {
    flows = FlowsSample;
    const wrapper = shallow(
      <NetflowTableRow flow={flows[0]} columns={DefaultColumnSample} {...mocks} highlight={false} />
    );
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(DefaultColumnSample.length);
  });
  it('should render given columns', async () => {
    flows = FlowsSample;
    const reducedColumns = DefaultColumnSample.slice(2, 4);
    const wrapper = shallow(<NetflowTableRow flow={flows[0]} columns={reducedColumns} {...mocks} highlight={true} />);
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(reducedColumns.length);
  });
});
