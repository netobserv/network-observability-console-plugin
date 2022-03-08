import { OnSort, TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import { mount } from 'enzyme';
import * as React from 'react';
import { Column, ColumnsId } from '../../../utils/columns';
import { AllSelectedColumns, DefaultColumns, filterOrderedColumnsByIds } from '../../__tests-data__/columns';
import { NetflowTableHeader } from '../netflow-table-header';

const NetflowTableHeaderWrapper: React.FC<{
  onSort: OnSort;
  sortIndex: number;
  sortDirection: string;
  columns: Column[];
}> = ({ onSort, sortIndex, sortDirection, columns }) => {
  return (
    <TableComposable aria-label="Misc table" variant="compact">
      <NetflowTableHeader
        onSort={onSort}
        sortDirection={sortDirection}
        sortIndex={sortIndex}
        columns={columns}
        tableWidth={100}
      />
      <Tbody></Tbody>
    </TableComposable>
  );
};

describe('<NetflowTableHeader />', () => {
  const mocks = {
    onSort: jest.fn(),
    sortIndex: 0,
    sortDirection: 'asc',
    tableWidth: 100
  };
  it('should render component', async () => {
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={AllSelectedColumns} />);
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Th).length).toBeGreaterThanOrEqual(AllSelectedColumns.length);
  });
  it('should render given columns', async () => {
    const wrapper = mount(
      <NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds([ColumnsId.timestamp])} />
    );
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(1);
  });
  it('should call sort function on click', async () => {
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={DefaultColumns} />);
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    wrapper.find('button').at(0).simulate('click');
    expect(mocks.onSort).toHaveBeenCalledWith(expect.anything(), 0, 'desc', expect.anything());
  });
  it('should nested consecutive group columns', async () => {
    const selectedIds = [
      ColumnsId.timestamp,
      ColumnsId.srcname,
      ColumnsId.srcport,
      ColumnsId.dstname,
      ColumnsId.packets
    ];
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds(selectedIds)} />);
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(2);
    expect(wrapper.find(Th).length).toBeGreaterThanOrEqual(selectedIds.length);
  });
  it('should keep flat non consecutive group columns', async () => {
    const selectedIds = [
      ColumnsId.timestamp,
      ColumnsId.srcname,
      ColumnsId.dstname,
      ColumnsId.packets,
      ColumnsId.srcport
    ];
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds(selectedIds)} />);
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(selectedIds.length);
  });
});
