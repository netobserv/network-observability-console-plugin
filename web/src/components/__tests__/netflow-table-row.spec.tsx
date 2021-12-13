import * as React from "react";
import { shallow } from "enzyme";

import NetflowTableRow from "../netflow-table-row";

import { ParsedStream } from "../../api/loki";
import { ColumnsSample } from "../__tests-data__/columns";
import { FlowsSample } from "../__tests-data__/flows";

import { Tr, Td } from "@patternfly/react-table";

jest.mock("@openshift-console/dynamic-plugin-sdk", () => {
  return {
    ResourceLink: () => {
      return <></>;
    },
  };
});

describe("<NetflowTableRow />", () => {
  let flows: ParsedStream[] = [];
  it("should render component", () => {
    flows = FlowsSample;
    const wrapper = shallow(
      <NetflowTableRow flow={flows[0]} columns={ColumnsSample} />
    );
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(ColumnsSample.length);
  });
  it("should render given columns", () => {
    flows = FlowsSample;
    const reducedColumns = ColumnsSample.slice(2, 4);
    const wrapper = shallow(
      <NetflowTableRow flow={flows[0]} columns={reducedColumns} />
    );
    expect(wrapper.find(NetflowTableRow)).toBeTruthy();
    expect(wrapper.find(Tr)).toHaveLength(1);
    expect(wrapper.find(Td)).toHaveLength(reducedColumns.length);
  });
});
