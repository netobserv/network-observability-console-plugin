import * as React from 'react';
import { shallow, mount } from 'enzyme';

import NetflowTable from '../netflow-table';
import NetflowTableRow from '../netflow-table-row';
import { NetflowTableHeader } from '../netflow-table-header';

import { ParsedStream } from '../../api/loki';
import { ColumnsSample } from '../__tests-data__/columns';
import { FlowsSample } from '../__tests-data__/flows';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  return {
    ResourceLink: () => {
      return <></>;
    }
  };
});

describe('<NetflowTable />', () => {
  let flows: ParsedStream[] = [];
  const setFlows = jest.fn();
  it('should render component', () => {
    flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableHeader)).toHaveLength(1);
  });
  it('should have table rows', () => {
    flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });
  it('should only render given row', () => {
    flows = FlowsSample.slice(0, 2);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(flows.length);
  });
  it('should sort rows on click', () => {
    flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = mount(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    const button = wrapper.findWhere(node => {
      return node.type() === 'button' && node.text() === 'Date & time';
    });
    button.simulate('click');
    const expected = [FlowsSample[2], FlowsSample[0], FlowsSample[1]];
    expect(setFlows).toHaveBeenCalledWith(expected);
  });
});
