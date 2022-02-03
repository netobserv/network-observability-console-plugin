import { OnSort, SortByDirection, Th, Thead, Tr } from '@patternfly/react-table';
import _ from 'lodash';
import * as React from 'react';
import { Column, ColumnGroup, getColumnGroups, getFullColumnName } from '../../utils/columns';

export type HeadersState = {
  nestedHeaders: ColumnGroup[];
  useNested: boolean;
  headers: Column[];
};

export const NetflowTableHeader: React.FC<{
  onSort: OnSort;
  sortIndex: number;
  sortDirection: string;
  columns: Column[];
  tableWidth: number;
}> = ({ onSort, sortIndex, sortDirection, columns, tableWidth }) => {
  const [headersState, setHeadersState] = React.useState<HeadersState>({
    nestedHeaders: [],
    useNested: false,
    headers: []
  });

  const getNestedTableHeader = React.useCallback(
    (nh: ColumnGroup) => {
      return (
        <Th
          key={`nested-${nh.title}-${headersState.nestedHeaders.indexOf(nh)}`}
          hasRightBorder={_.last(headersState.nestedHeaders) !== nh}
          colSpan={nh.columns.length}
        >
          {nh.title}
        </Th>
      );
    },
    [headersState.nestedHeaders]
  );

  const getTableHeader = React.useCallback(
    (c: Column) => {
      // no-explicit-any disabled: short list of number expected in Th width, but actually any number works fine
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const width = Math.floor((100 * c.width) / tableWidth) as any;
      const showBorder =
        headersState.useNested && headersState.nestedHeaders.find(nh => _.last(nh.columns) === c) !== undefined;
      return (
        <Th
          hasRightBorder={showBorder}
          width={width}
          key={c.id}
          sort={{
            sortBy: {
              index: sortIndex,
              direction: SortByDirection[sortDirection as SortByDirection]
            },
            onSort: onSort,
            columnIndex: columns.indexOf(c)
          }}
          modifier="wrap"
        >
          {headersState.useNested ? c.name : getFullColumnName(c)}
        </Th>
      );
    },
    [columns, headersState.nestedHeaders, headersState.useNested, onSort, sortDirection, sortIndex, tableWidth]
  );

  React.useEffect(() => {
    const nestedHeaders = getColumnGroups(columns);
    const useNested = nestedHeaders.find(nh => nh.columns.length > 1) !== undefined;
    const headers = useNested ? nestedHeaders.flatMap(nh => nh.columns) : columns;
    setHeadersState({ nestedHeaders, useNested, headers });
  }, [columns]);

  return (
    <Thead hasNestedHeader={headersState.useNested}>
      {headersState.useNested && <Tr>{headersState.nestedHeaders.map(nh => getNestedTableHeader(nh))}</Tr>}
      <Tr>{headersState.headers.map(c => getTableHeader(c))}</Tr>
    </Thead>
  );
};
