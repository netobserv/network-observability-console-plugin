import { SortByDirection, Th, Thead, Tr } from '@patternfly/react-table';
import _ from 'lodash';
import * as React from 'react';
import { Column, ColumnGroup, ColumnsId, ColumnSizeMap, getColumnGroups, getFullColumnName } from '../../utils/columns';
import './netflow-table-header.css';

export type HeadersState = {
  nestedHeaders: ColumnGroup[];
  useNested: boolean;
  headers: Column[];
};

export type ResizedElement = {
  target: HTMLElement;
  startClientX: number;
  startClentWidth: number;
};

export const NetflowTableHeader: React.FC<{
  onSort: (id: ColumnsId, direction: SortByDirection) => void;
  sortId: ColumnsId;
  sortDirection: SortByDirection;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  columnSizes: ColumnSizeMap;
  setColumnSizes: (v: ColumnSizeMap) => void;
  tableWidth: number;
  isDark?: boolean;
}> = ({ onSort, sortId, sortDirection, columns, setColumns, columnSizes, setColumnSizes, tableWidth, isDark }) => {
  const resizedElement = React.useRef<ResizedElement>();
  const draggedElement = React.useRef<HTMLElement>();

  const [headersState, setHeadersState] = React.useState<HeadersState>({
    nestedHeaders: [],
    useNested: false,
    headers: []
  });

  const mouseEvent = React.useCallback(
    (e: MouseEvent) => {
      const diffPx = e.clientX - resizedElement.current!.startClientX;
      switch (e.type) {
        case 'mousemove':
          const minWidth = Number(resizedElement.current!.target.style.minWidth?.replace('px', '')) || 0;
          if (Math.abs(minWidth - diffPx) > 10) {
            const minWidth = `${resizedElement.current!.startClentWidth + diffPx}px`;
            columnSizes[resizedElement.current!.target.id as ColumnsId] = minWidth;
            resizedElement.current!.target.style.minWidth = minWidth;
          }
          break;
        default:
          document.getElementById('cursor-style')!.remove();
          resizedElement.current!.target.classList.remove('resizing');
          document.removeEventListener('mousemove', mouseEvent);
          document.removeEventListener('mouseup', mouseEvent);
          setColumnSizes(columnSizes);
          break;
      }
    },
    [columnSizes, setColumnSizes]
  );

  const onMouseDown = React.useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const target = e.currentTarget;
      if (target.classList.contains('column') && e.nativeEvent.offsetX > target.clientWidth - 15) {
        target.classList.add('resizing');
        const cursorStyle = document.createElement('style');
        cursorStyle.innerHTML = '*{cursor: col-resize!important;}';
        cursorStyle.id = 'cursor-style';
        document.head.appendChild(cursorStyle);
        resizedElement.current = { target, startClientX: e.clientX, startClentWidth: target.clientWidth };
        document.addEventListener('mousemove', mouseEvent);
        document.addEventListener('mouseup', mouseEvent);
        e.preventDefault();
      }
    },
    [mouseEvent]
  );

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
          onMouseDown={onMouseDown}
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
          style={{ width: `${Math.floor((100 * c.width) / tableWidth)}%`, minWidth: columnSizes[c.id] }}
          info={
            [
              ColumnsId.starttime,
              ColumnsId.endtime,
              ColumnsId.dnsrequesttime,
              ColumnsId.dnsresponsetime,
              ColumnsId.collectiontime,
              ColumnsId.collectionlatency,
              ColumnsId.dnslatency
            ].includes(c.id) && c.tooltip
              ? { tooltip: c.tooltip }
              : undefined
          }
        >
          {headersState.useNested ? c.name : getFullColumnName(c)}
        </Th>
      );
    },
    [
      columnSizes,
      columns,
      headersState.nestedHeaders,
      headersState.useNested,
      isDark,
      onDragStart,
      onDrop,
      onMouseDown,
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
    <Thead
      className={`${isDark ? 'dark' : 'light'}-bottom-shadow`}
      data-test="thead"
      hasNestedHeader={headersState.useNested}
    >
      {headersState.useNested && <Tr>{headersState.nestedHeaders.map(nh => getNestedTableHeader(nh))}</Tr>}
      <Tr data-test="thead-tr">{headersState.headers.map(c => getTableHeader(c))}</Tr>
    </Thead>
  );
};
