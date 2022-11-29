import * as React from 'react';
import { SortByDirection, Th, Thead, Tr } from '@patternfly/react-table';
import _ from 'lodash';
import { Column, ColumnGroup, ColumnsId, getColumnGroups, getFullColumnName } from '../../utils/columns';
import './netflow-table-header.css';

export type HeadersState = {
  nestedHeaders: ColumnGroup[];
  useNested: boolean;
  headers: Column[];
};

export const NetflowTableHeader: React.FC<{
  onSort: (id: ColumnsId, direction: SortByDirection) => void;
  sortId: ColumnsId;
  sortDirection: SortByDirection;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  tableWidth: number;
  isDark?: boolean;
}> = ({ onSort, sortId, sortDirection, columns, setColumns, tableWidth, isDark }) => {
  const draggedElement = React.useRef<HTMLElement>();

  const [headersState, setHeadersState] = React.useState<HeadersState>({
    nestedHeaders: [],
    useNested: false,
    headers: []
  });

  const onDragStart = React.useCallback((e: React.DragEvent<HTMLElement>) => {
    const target = e.currentTarget;
    target.classList.add('dragged');
    draggedElement.current = target;
  }, []);

  const clearDragEffects = () => {
    document.querySelectorAll('.netobserv-header').forEach(e => {
      if (e.classList.contains('dragged')) {
        e.classList.remove('dragged');
      }

      if (e.classList.contains('dropzone')) {
        e.classList.remove('dropzone');
      }
    });
  };

  const onDrop = React.useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      if (!e.currentTarget || !draggedElement.current) {
        console.error('onDrop called while currentTarget or draggedElement ref missing');
        return;
      }

      if (
        (e.currentTarget.classList.contains('nested') && draggedElement.current.classList.contains('nested')) ||
        (e.currentTarget.classList.contains('column') && draggedElement.current.classList.contains('column'))
      ) {
        const srcIndex = Number(draggedElement.current.getAttribute('data-index'));
        const srcColSpan = Number(draggedElement.current!.getAttribute('colSpan'));
        const dstIndex = Number(e.currentTarget.getAttribute('data-index'));

        const result = [...columns];
        const removed = result.splice(srcIndex, srcColSpan);
        result.splice(dstIndex, 0, ...removed);
        setColumns(result);
      }

      e.preventDefault();
    },
    [columns, setColumns]
  );

  const getNestedTableHeader = React.useCallback(
    (nh: ColumnGroup) => {
      return (
        <Th
          className={`netobserv-header nested ${isDark ? 'dark' : ''}`}
          data-test={`nested-th-${nh.title || 'empty'}`}
          data-index={columns.indexOf(nh.columns[0])}
          key={`nested-${nh.title}-${headersState.nestedHeaders.indexOf(nh)}`}
          id={`nested-${headersState.nestedHeaders.indexOf(nh)}`}
          hasRightBorder={_.last(headersState.nestedHeaders) !== nh}
          colSpan={nh.columns.length}
          draggable
          onDragStart={onDragStart}
          onDragOver={e => {
            if (draggedElement.current?.classList.contains('nested')) {
              e.currentTarget.classList.add('dropzone');
            }
            e.preventDefault();
          }}
          onDragLeave={e => {
            e.currentTarget.classList.remove('dropzone');
            e.preventDefault();
          }}
          onDrop={onDrop}
          onDragEnd={clearDragEffects}
        >
          {nh.title}
        </Th>
      );
    },
    [columns, headersState.nestedHeaders, isDark, onDragStart, onDrop]
  );

  const getTableHeader = React.useCallback(
    (c: Column) => {
      const showBorder =
        headersState.useNested && headersState.nestedHeaders.find(nh => _.last(nh.columns) === c) !== undefined;
      return (
        <Th
          className={`netobserv-header column ${isDark ? 'dark' : ''}`}
          data-test={`th-${c.id}`}
          data-index={columns.indexOf(c)}
          hasRightBorder={showBorder}
          key={c.id}
          id={c.id}
          sort={{
            sortBy: {
              index: columns.findIndex(c => c.id === sortId),
              direction: SortByDirection[sortDirection as SortByDirection]
            },
            onSort: (event, index, direction) => onSort(c.id, direction),
            columnIndex: columns.indexOf(c)
          }}
          colSpan={1}
          draggable
          onDragStart={onDragStart}
          onDragOver={e => {
            if (draggedElement.current?.classList.contains('column')) {
              e.currentTarget.classList.add('dropzone');
            }
            e.preventDefault();
          }}
          onDragLeave={e => {
            e.currentTarget.classList.remove('dropzone');
            e.preventDefault();
          }}
          onDrop={onDrop}
          onDragEnd={clearDragEffects}
          modifier="wrap"
          style={{ width: `${Math.floor((100 * c.width) / tableWidth)}%` }}
          info={c.tooltip ? { tooltip: c.tooltip } : undefined}
        >
          {headersState.useNested ? c.name : getFullColumnName(c)}
        </Th>
      );
    },
    [
      columns,
      headersState.nestedHeaders,
      headersState.useNested,
      isDark,
      onDragStart,
      onDrop,
      onSort,
      sortDirection,
      sortId,
      tableWidth
    ]
  );

  React.useEffect(() => {
    const nestedHeaders = getColumnGroups(columns);
    const useNested = nestedHeaders.find(nh => nh.columns.length > 1) !== undefined;
    const headers = useNested ? nestedHeaders.flatMap(nh => nh.columns) : columns;
    setHeadersState({ nestedHeaders, useNested, headers });
  }, [columns]);

  return (
    <Thead data-test="thead" hasNestedHeader={headersState.useNested}>
      {headersState.useNested && <Tr>{headersState.nestedHeaders.map(nh => getNestedTableHeader(nh))}</Tr>}
      <Tr data-test="thead-tr">{headersState.headers.map(c => getTableHeader(c))}</Tr>
    </Thead>
  );
};
