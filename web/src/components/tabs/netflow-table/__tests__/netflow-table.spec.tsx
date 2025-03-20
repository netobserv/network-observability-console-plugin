import { Tbody, Td } from '@patternfly/react-table';
import { mount, shallow } from 'enzyme';
import * as React from 'react';

import NetflowTable from '../netflow-table';
import { NetflowTableHeader } from '../netflow-table-header';
import NetflowTableRow from '../netflow-table-row';

import { actOn, waitForRender } from '../../../../components/__tests__/common.spec';
import { ColumnsId } from '../../../../utils/columns';
import { dateTimeMSFormatter, getFormattedDate } from '../../../../utils/datetime';
import { ShuffledColumnSample } from '../../../__tests-data__/columns';
import { FlowsMock, FlowsSample } from '../../../__tests-data__/flows';
import { Size } from '../../../dropdowns/table-display-dropdown';

const errorStateQuery = `EmptyState[data-test="error-state"]`;
const loadingContentsQuery = `Bullseye[data-test="loading-contents"]`;
const noResultsFoundQuery = `Bullseye[data-test="no-results-found"]`;

describe('<NetflowTable />', () => {
  const mocks = {
    allowPktDrops: true,
    size: 'm' as Size,
    onSelect: jest.fn(),
    setColumns: jest.fn(),
    columnSizes: {},
    setColumnSizes: jest.fn()
  };

  it('should render component', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableHeader)).toHaveLength(1);
  });

  it('should have table rows with sample', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });

  it('should have table rows with mock', async () => {
    const flows = FlowsMock.slice(0, FlowsMock.length);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(Tbody).children()).toHaveLength(FlowsMock.length);
  });

  it('should update rows on props update', async () => {
    const flows = FlowsSample.slice(0, 1);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(1);
    const flowsupdated = FlowsSample.slice(0, FlowsSample.length);
    wrapper.setProps({ flows: flowsupdated });
    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(FlowsSample.length);
  });

  it('should only render given row', async () => {
    const flows = FlowsSample.slice(0, 2);
    const wrapper = shallow(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();
    expect(wrapper.find(NetflowTableRow)).toHaveLength(flows.length);
  });

  it('should sort rows on click', async () => {
    const flows = FlowsSample.slice(0, FlowsSample.length);
    const wrapper = mount(<NetflowTable flows={flows} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

    expect(wrapper.find(NetflowTable)).toBeTruthy();

    const timestampIdx = ShuffledColumnSample.findIndex(c => c.id === ColumnsId.endtime);
    let expectedDate = new Date(FlowsSample[2].fields.TimeFlowEndMs || '');
    // table should be sorted by date asc by default
    expect(wrapper.find(NetflowTableRow).find(Td).at(timestampIdx).find('.datetime').at(0).text()).toBe(
      getFormattedDate(expectedDate, dateTimeMSFormatter)
    );

    await actOn(
      () =>
        wrapper
          .findWhere(node => {
            return node.type() === 'button' && node.text() === 'End Time';
          })
          .simulate('click'),
      wrapper
    );

    expectedDate = new Date(FlowsSample[1].fields.TimeFlowEndMs || '');
    // then should sort date desc on click
    expect(wrapper.find(NetflowTableRow).find(Td).at(timestampIdx).find('.datetime').at(0).text()).toBe(
      getFormattedDate(expectedDate, dateTimeMSFormatter)
    );

    const expectedSrcAddress = FlowsSample[1].fields.SrcAddr;
    expect(wrapper.find(NetflowTableRow).at(0).text()).toContain(expectedSrcAddress);
    const expectedDstAddress = FlowsSample[1].fields.DstAddr;
    expect(wrapper.find(NetflowTableRow).at(0).text()).toContain(expectedDstAddress);
  });

  it('should render a spinning slide and then the netflow rows', async () => {
    const wrapper = mount(<NetflowTable loading={true} flows={[]} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

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
    const wrapper = mount(<NetflowTable loading={true} flows={[]} columns={ShuffledColumnSample} {...mocks} />);
    await waitForRender(wrapper);

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
});
