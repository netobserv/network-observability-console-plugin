import { SortByDirection, TableComposable, Tbody, Th, Thead, Tr } from '@patternfly/react-table';
import { mount } from 'enzyme';
import * as React from 'react';
import { Column, ColumnsId, ColumnSizeMap } from '../../../utils/columns';
import { AllSelectedColumnSample, DefaultColumnSample, filterOrderedColumnsByIds } from '../../__tests-data__/columns';
import { NetflowTableHeader } from '../netflow-table-header';

const NetflowTableHeaderWrapper: React.FC<{
  onSort: (id: ColumnsId, direction: SortByDirection) => void;
  sortId: ColumnsId;
  sortDirection: SortByDirection;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  columnSizes: ColumnSizeMap;
  setColumnSizes: (v: ColumnSizeMap) => void;
}> = ({ onSort, sortId, sortDirection, columns, setColumns, columnSizes, setColumnSizes }) => {
  return (
    <TableComposable aria-label="Misc table" variant="compact">
      <NetflowTableHeader
        onSort={onSort}
        sortDirection={sortDirection}
        sortId={sortId}
        columns={columns}
        setColumns={setColumns}
        columnSizes={columnSizes}
        setColumnSizes={setColumnSizes}
        tableWidth={100}
      />
      <Tbody></Tbody>
    </TableComposable>
  );
};

describe('<NetflowTableHeader />', () => {
  const mocks = {
    onSort: jest.fn(),
    sortId: ColumnsId.endtime,
    sortDirection: SortByDirection.asc,
    tableWidth: 100,
    setColumns: jest.fn(),
    columnSizes: {},
    setColumnSizes: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={AllSelectedColumnSample} />);
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Th).length).toBeGreaterThanOrEqual(AllSelectedColumnSample.length);
  });
  it('should render given columns', async () => {
    const wrapper = mount(
      <NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds([ColumnsId.endtime])} />
    );
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(1);
  });
  it('should call sort function on click', async () => {
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={DefaultColumnSample} />);
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    wrapper.find('button').at(0).simulate('click');
    expect(mocks.onSort).toHaveBeenCalledWith('StartTime', 'asc');
  });
  it('should nested consecutive group columns', async () => {
    const selectedIds = [ColumnsId.endtime, ColumnsId.srcname, ColumnsId.srcport, ColumnsId.dstname, ColumnsId.packets];
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds(selectedIds)} />);
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(2);
    expect(wrapper.find(Th).length).toBeGreaterThanOrEqual(selectedIds.length);
  });
  it('should keep flat non consecutive group columns', async () => {
    const selectedIds = [ColumnsId.endtime, ColumnsId.srcname, ColumnsId.dstname, ColumnsId.packets, ColumnsId.srcport];
    const wrapper = mount(<NetflowTableHeaderWrapper {...mocks} columns={filterOrderedColumnsByIds(selectedIds)} />);
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(selectedIds.length);
  });
});
