import * as React from "react";
import {
  Thead,
  Tr,
  Th,
  OnSort,
  SortByDirection,
} from "@patternfly/react-table";

export enum ColumnsId {
  date,
  srcpod,
  dstpod,
  srcnamespace,
  dstnamespace,
  srcport,
  dstport,
  protocol,
  bytes,
  packets,
}

export interface Column {
  id: number;
  name: string;
}

export const NetflowTableHeader: React.FC<{
  onSort: OnSort;
  sortIndex: number;
  sortDirection: string;
  columns: Column[];
}> = ({ onSort, sortIndex, sortDirection, columns }) => {
  return (
    <Thead>
      <Tr>
        {columns.map((c) => (
          <Th
            key={c.id}
            sort={{
              sortBy: {
                index: sortIndex,
                direction: SortByDirection[sortDirection],
              },
              onSort: onSort,
              columnIndex: c.id,
            }}
            modifier="wrap"
          >
            {c.name}
          </Th>
        ))}
      </Tr>
    </Thead>
  );
};
