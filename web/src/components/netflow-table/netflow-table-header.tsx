import * as React from 'react';
import { Thead, Tr, Th, OnSort, SortByDirection } from '@patternfly/react-table';
import { Column } from '../../utils/columns';

export const NetflowTableHeader: React.FC<{
  onSort: OnSort;
  sortIndex: number;
  sortDirection: string;
  columns: Column[];
}> = ({ onSort, sortIndex, sortDirection, columns }) => {
  return (
    <Thead>
      <Tr>
        {columns.map((c, i) => (
          <Th
            width={c.width}
            key={c.id}
            sort={{
              sortBy: {
                index: sortIndex,
                direction: SortByDirection[sortDirection]
              },
              onSort: onSort,
              columnIndex: i
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
