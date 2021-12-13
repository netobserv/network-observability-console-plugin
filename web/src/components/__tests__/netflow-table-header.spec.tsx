import * as React from "react";
import { shallow } from "enzyme";

import { NetflowTableHeader } from "../netflow-table-header";

import { ColumnsSample } from "../__tests-data__/columns";
import { Thead, Tr, Th } from "@patternfly/react-table";

describe("<NetflowTableHeader />", () => {
  it("should render component", () => {
      // eslint-disable-next-line
      const onSort = () => {};
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
      // eslint-disable-next-line
      const onSort = () => {};
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
});
