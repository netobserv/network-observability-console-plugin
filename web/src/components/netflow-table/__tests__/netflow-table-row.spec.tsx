import * as React from 'react';
import { shallow } from 'enzyme';
import { Tr, Td } from '@patternfly/react-table';

import NetflowTableRow from '../netflow-table-row';
import { Record } from '../../../api/loki';
import { ColumnsSample } from '../../__tests-data__/columns';
import { FlowsSample } from '../../__tests-data__/flows';

describe('<NetflowTableRow />', () => {
  let flows: Record[] = [];
  it('should render component', async () => {
    flows = FlowsSample;
    const wrapper = shallow(<NetflowTableRow flow={flows[0]} columns={ColumnsSample} size={'m'} />);
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(ColumnsSample.length);
  });
  it('should render given columns', async () => {
    flows = FlowsSample;
    const reducedColumns = ColumnsSample.slice(2, 4);
    const wrapper = shallow(<NetflowTableRow flow={flows[0]} columns={reducedColumns} size={'m'} />);
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(reducedColumns.length);
  });
});
