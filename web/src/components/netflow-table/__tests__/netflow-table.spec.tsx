import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { Td } from '@patternfly/react-table';

import NetflowTable from '../netflow-table';
import NetflowTableRow from '../netflow-table-row';
import { NetflowTableHeader } from '../netflow-table-header';

import { ColumnsSample } from '../../__tests-data__/columns';
import { FlowsSample } from '../../__tests-data__/flows';
import { Size } from '../../display-dropdown';

const errorStateQuery = `EmptyState[data-test="error-state"]`;
const loadingContentsQuery = `Bullseye[data-test="loading-contents"]`;
const noResultsFoundQuery = `Bullseye[data-test="no-results-found"]`;
const clearFiltersQuery = `Button[data-test="clear-all-filters"]`;

jest.mock('@openshift-console/dynamic-plugin-sdk', () => {
  return {
    ResourceLink: () => {
      return <></>;
    }
  };
});

describe('<NetflowTable />', () => {
  const mocks = {
    size: 'm' as Size,
    clearFilters: null
  };
  beforeEach(() => {
    mocks.clearFilters = jest.fn();
  });

  it('should render component', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ColumnsSample} {...mocks} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableHeader)).toHaveLength(1);
  });
  it('should have table rows', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ColumnsSample} {...mocks} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });
  it('should only render given row', async () => {
    const flows = FlowsSample.slice(0, 2);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ColumnsSample} {...mocks} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(flows.length);
  });
  it('should sort rows on click', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = mount(<NetflowTable flows={flows} columns={ColumnsSample} {...mocks} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    const button = wrapper.findWhere(node => {
      return node.type() === 'button' && node.text() === 'Date & time';
    });
    button.simulate('click');
    const expectedDateText =
      new Date(FlowsSample[2].timestamp).toDateString() + ' ' + new Date(FlowsSample[2].timestamp).toLocaleTimeString();
    expect(wrapper.find(NetflowTableRow).find(Td).find('.datetime').at(0).text()).toBe(expectedDateText);
    const expectedSrcAddress = FlowsSample[2].fields.SrcAddr;
    expect(wrapper.find(NetflowTableRow).at(0).text()).toContain(expectedSrcAddress);
    const expectedDstAddress = FlowsSample[2].fields.DstAddr;
    expect(wrapper.find(NetflowTableRow).at(0).text()).toContain(expectedDstAddress);
  });
  it('should render a spinning slide and then the netflow rows', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} columns={ColumnsSample} {...mocks} />);
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
    const wrapper = mount(<NetflowTable loading={true} flows={[]} columns={ColumnsSample} {...mocks} />);
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(1);
    wrapper.setProps({
      loading: false
    });
    wrapper.update();
    expect(wrapper.find(loadingContentsQuery)).toHaveLength(0);
    expect(wrapper.find(noResultsFoundQuery)).toHaveLength(1);
    expect(wrapper.find(errorStateQuery)).toHaveLength(0);

    // it should have a 'clear all filters' link that clears the filters when it is clicked
    expect(mocks.clearFilters).not.toHaveBeenCalled();
    const clearAll = wrapper.find(clearFiltersQuery);
    expect(clearAll).toHaveLength(1);
    clearAll.simulate('click');
    expect(mocks.clearFilters).toHaveBeenCalledTimes(1);
  });
  it('should render a spinning slide and then an should show an ErrorState on error', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} columns={ColumnsSample} {...mocks} />);
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
