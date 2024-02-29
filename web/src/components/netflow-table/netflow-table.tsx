import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SortByDirection, Table, Tbody } from '@patternfly/react-table';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Spinner,
  Title
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';

import { Record } from '../../api/ipfix';
import { NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import { Column, ColumnsId, ColumnSizeMap } from '../../utils/columns';
import { Size } from '../dropdowns/table-display-dropdown';
import { usePrevious } from '../../utils/previous-hook';
import './netflow-table.css';
import {
  LOCAL_STORAGE_SORT_DIRECTION_KEY,
  LOCAL_STORAGE_SORT_ID_KEY,
  useLocalStorage
} from '../../utils/local-storage-hook';
import { LokiError } from '../messages/loki-error';
import { convertRemToPixels } from '../../utils/panel';

const NetflowTable: React.FC<{
  allowPktDrops: boolean;
  flows: Record[];
  selectedRecord?: Record;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  columnSizes: ColumnSizeMap;
  setColumnSizes: (v: ColumnSizeMap) => void;
  size: Size;
  onSelect: (record?: Record) => void;
  loading?: boolean;
  error?: string;
  filterActionLinks: JSX.Element;
  isDark?: boolean;
}> = ({
  allowPktDrops,
  flows,
  selectedRecord,
  columns,
  setColumns,
  columnSizes,
  setColumnSizes,
  error,
  loading,
  size,
  onSelect,
  filterActionLinks,
  isDark
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  //default to 300 to allow content to be rendered in tests
  const [containerHeight, setContainerHeight] = React.useState(300);
  const previousContainerHeight = usePrevious(containerHeight);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const previousScrollPosition = usePrevious(scrollPosition);
  const [lastRender, setLastRender] = React.useState<string>('');
  // index of the currently active column
  const [activeSortId, setActiveSortId] = useLocalStorage<ColumnsId>(LOCAL_STORAGE_SORT_ID_KEY, ColumnsId.endtime);
  const previousActiveSortIndex = usePrevious(activeSortId);
  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = useLocalStorage<SortByDirection>(
    LOCAL_STORAGE_SORT_DIRECTION_KEY,
    SortByDirection.asc
  );
  const previousActiveSortDirection = usePrevious(activeSortDirection);
  const firstRender = React.useRef(true);
  const width = columns.reduce((prev, cur) => prev + cur.width, 0);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = firstRender.current && flows.length == 0;
      return;
    }
    setLastRender(String(Date.now()));
  }, [flows]);

  /* remove rows from previous rendering that should not appear anymore in body
   * this fix a bug in PF TableComposable when refresh occurs after scroll
   * without rebuilding the entire table */
  React.useEffect(() => {
    const tbody = document.getElementById('table-body');
    if (tbody) {
      const children = Array.from(tbody.children);
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        const childLastRender = child.getAttribute('data-last-render');
        if (childLastRender !== lastRender) {
          child.remove();
        }
      }
    }
  }, [lastRender]);

  //reset sort index & directions to default on columns update
  React.useEffect(() => {
    const found = columns.find(c => c.id === activeSortId);
    if (!found) {
      setActiveSortId(ColumnsId.endtime);
      setActiveSortDirection(SortByDirection.asc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  //get row height from display size
  const getRowHeight = React.useCallback(() => {
    const doubleSizeColumnIds = columns.filter(c => c.isCommon).map(c => c.id);
    const containsDoubleLine = columns.find(c => doubleSizeColumnIds.includes(c.id)) !== undefined;

    switch (size) {
      case 'l':
        return convertRemToPixels(containsDoubleLine ? 8 : 4.5);
      case 'm':
        return convertRemToPixels(containsDoubleLine ? 6 : 3.5);
      case 's':
      default:
        return convertRemToPixels(containsDoubleLine ? 4 : 2.5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, size]);

  //update table container height on window resize
  const handleResize = React.useCallback(() => {
    const container = document.getElementById('table-container');
    if (container) {
      setContainerHeight(container.clientHeight);
    }
  }, []);

  const handleScroll = React.useCallback(() => {
    const rowHeight = getRowHeight();
    const container = document.getElementById('table-container');
    const header = container?.children[0]?.children[0]?.children[0];
    if (container && header) {
      const position = container.scrollTop - header.clientHeight;
      //updates only when position moved more than one row height
      if (scrollPosition < position - rowHeight || scrollPosition > position + rowHeight) {
        setScrollPosition(position);
      }
    }
  }, [getRowHeight, scrollPosition]);

  React.useEffect(() => {
    handleScroll();
    handleResize();
    const container = document.getElementById('table-container');
    if (container && container.getAttribute('listener') !== 'true') {
      container.addEventListener('scroll', handleScroll);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize, handleScroll, loading]);

  // sort function
  const getSortedFlows = React.useCallback(() => {
    const found = activeSortId && columns.find(c => c.id === activeSortId);
    if (!found) {
      return flows;
    } else {
      return flows.sort((a: Record, b: Record) => {
        return activeSortDirection === 'desc' ? found.sort(a, b, found) : found.sort(b, a, found);
      });
    }
  }, [activeSortDirection, activeSortId, columns, flows]);

  // sort handler
  const onSort = (columnId: ColumnsId, direction: SortByDirection) => {
    setActiveSortId(columnId);
    setActiveSortDirection(direction);
  };

  const getBody = React.useCallback(() => {
    const rowHeight = getRowHeight();

    return getSortedFlows().map((f, i) => (
      <NetflowTableRow
        key={f.key}
        allowPktDrops={allowPktDrops}
        flow={f}
        lastRender={lastRender}
        columns={columns}
        size={size}
        selectedRecord={selectedRecord}
        onSelect={onSelect}
        highlight={
          previousContainerHeight === containerHeight &&
          previousScrollPosition === scrollPosition &&
          previousActiveSortDirection === activeSortDirection &&
          previousActiveSortIndex === activeSortId &&
          !firstRender.current
        }
        height={rowHeight}
        showContent={scrollPosition <= i * rowHeight && scrollPosition + containerHeight > i * rowHeight}
        tableWidth={width}
        isDark={isDark}
      />
    ));
  }, [
    allowPktDrops,
    lastRender,
    activeSortDirection,
    activeSortId,
    columns,
    containerHeight,
    getRowHeight,
    getSortedFlows,
    onSelect,
    previousActiveSortDirection,
    previousActiveSortIndex,
    previousContainerHeight,
    previousScrollPosition,
    scrollPosition,
    selectedRecord,
    size,
    width,
    isDark
  ]);

  if (width === 0) {
    return null;
  } else if (error) {
    return <LokiError title={t('Unable to get flows')} error={error} />;
  } else if (_.isEmpty(flows)) {
    if (loading) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    } else {
      return (
        <Bullseye data-test="no-results-found">
          <EmptyState variant={EmptyStateVariant.sm}>
            <EmptyStateIcon icon={SearchIcon} />
            <Title headingLevel="h2" size="lg">
              {t('No results found')}
            </Title>
            <EmptyStateBody>{t('Clear or reset filters and try again.')}</EmptyStateBody>
            {filterActionLinks}
          </EmptyState>
        </Bullseye>
      );
    }
  }

  return (
    <div id="table-container">
      <Table
        data-test="table-composable"
        data-test-cols-count={columns.length}
        data-test-rows-count={flows.length}
        aria-label="Netflow table"
        variant="compact"
        style={{ minWidth: `${width}em` }}
        isStickyHeader
      >
        <NetflowTableHeader
          data-test="table-header"
          onSort={onSort}
          sortDirection={activeSortDirection}
          sortId={activeSortId}
          columns={columns}
          setColumns={setColumns}
          columnSizes={columnSizes}
          setColumnSizes={setColumnSizes}
          tableWidth={width}
          isDark={isDark}
        />
        <Tbody id="table-body" data-test="table-body">
          {getBody()}
        </Tbody>
      </Table>
    </div>
  );
};

export default NetflowTable;
