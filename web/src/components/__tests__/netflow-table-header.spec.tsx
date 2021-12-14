import * as React from "react";
import { shallow, mount } from "enzyme";
import { TableComposable, Tbody, OnSort } from "@patternfly/react-table";

import { NetflowTableHeader, Column } from "../netflow-table-header";

import { ColumnsSample } from "../__tests-data__/columns";
import { Thead, Tr, Th } from "@patternfly/react-table";

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
      />
      <Tbody></Tbody>
    </TableComposable>
  );
};

describe("<NetflowTableHeader />", () => {
  it("should render component", () => {
    const onSort = jest.fn();
    const wrapper = shallow(
      <NetflowTableHeader
        onSort={onSort}
        sortIndex={0}
        sortDirection={"asc"}
        columns={ColumnsSample}
      />
    );
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(ColumnsSample.length);
  });
  it("should render given columns", () => {
    const onSort = jest.fn();
    const reducedColumns = ColumnsSample.slice(2, 4);
    const wrapper = shallow(
      <NetflowTableHeader
        onSort={onSort}
        sortIndex={0}
        sortDirection={"asc"}
        columns={reducedColumns}
      />
    );
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    expect(wrapper.find(Thead)).toHaveLength(1);
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Th)).toHaveLength(reducedColumns.length);
  });
  it("should call sort function on click", () => {
    const onSort = jest.fn();
    const wrapper = mount(
      <NetflowTableHeaderWrapper
        onSort={onSort}
        sortIndex={0}
        sortDirection={"asc"}
        columns={ColumnsSample}
      />
    );
    expect(wrapper.find(NetflowTableHeader)).toBeTruthy();
    wrapper.find("button").at(0).simulate("click");
    expect(onSort).toHaveBeenCalled();
  });
});
