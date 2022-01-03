import * as React from 'react';
import { shallow, mount } from 'enzyme';

import NetflowTable from '../netflow-table';
import NetflowTableRow from '../netflow-table-row';
import { NetflowTableHeader } from '../netflow-table-header';

import { ColumnsSample } from '../__tests-data__/columns';
import { FlowsSample } from '../__tests-data__/flows';

const errorStateQuery = `EmptyState[data-test="error-state"]`;
const loadingContentsQuery = `Bullseye[data-test="loading-contents"]`;
const noResultsFoundQuery = `Bullseye[data-test="no-results-found"]`;

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  return {
    ResourceLink: () => {
      return <></>;
    }
  };
});

describe('<NetflowTable />', () => {
  const setFlows = jest.fn();
  it('should render component', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableHeader)).toHaveLength(1);
  });
  it('should have table rows', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });
  it('should only render given row', async () => {
    const flows = FlowsSample.slice(0, 2);
    const wrapper = shallow(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(flows.length);
  });
  it('should sort rows on click', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = mount(<NetflowTable flows={flows} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    const button = wrapper.findWhere(node => {
      return node.type() === 'button' && node.text() === 'Date & time';
    });
    button.simulate('click');
    const expected = [FlowsSample[2], FlowsSample[0], FlowsSample[1]];
    expect(setFlows).toHaveBeenCalledWith(expected);
  });
  it('should render a spinning slide and then the netflow rows', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(1);
    wrapper.setProps({
      flows: FlowsSample.slice(0, FlowsSample.length),
      loading: false
    });
    wrapper.update();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(0);
    expect(wrapper.find(noResultsFoundQuery)).toHaveLength(0);
    expect(wrapper.find(errorStateQuery)).toHaveLength(0);
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });
  it('should render a spinning slide and then a NoResultsFound message if no flows are found', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(1);
    wrapper.setProps({
      loading: false
    });
    wrapper.update();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(0);
    expect(wrapper.find(noResultsFoundQuery)).toHaveLength(1);
    expect(wrapper.find(errorStateQuery)).toHaveLength(0);
  });
  it('should render a spinning slide and then an should show an ErrorState on error', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} setFlows={setFlows} columns={ColumnsSample} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(1);
    wrapper.setProps({
      error: 'pum!'
    });
    wrapper.update();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(0);
    expect(wrapper.find(noResultsFoundQuery)).toHaveLength(0);
    expect(wrapper.find(errorStateQuery)).toHaveLength(1);
  });
});
