import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SortByDirection, TableComposable, Tbody } from '@patternfly/react-table';
import {
  Bullseye,
  Button,
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
import { Column, ColumnsId, getCommonColumns } from '../../utils/columns';
import { Size } from '../dropdowns/display-dropdown';
import { usePrevious } from '../../utils/previous-hook';
import './netflow-table.css';
import {
  LOCAL_STORAGE_SORT_DIRECTION_KEY,
  LOCAL_STORAGE_SORT_ID_KEY,
  useLocalStorage
} from '../../utils/local-storage-hook';

const NetflowTable: React.FC<{
  flows: Record[];
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
  clearFilters: () => void;
  loading?: boolean;
  error?: string;
}> = ({ flows, selectedRecord, columns, error, loading, size, onSelect, clearFilters }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  //default to 300 to allow content to be rendered in tests
  const [containerHeight, setContainerHeight] = React.useState(300);
  const previousContainerHeight = usePrevious(containerHeight);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const previousScrollPosition = usePrevious(scrollPosition);
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
  }, [flows]);

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
    const doubleSizeColumnIds = getCommonColumns(t).map(c => c.id);
    const containsDoubleLine = columns.find(c => doubleSizeColumnIds.includes(c.id)) !== undefined;

    function convertRemToPixels(rem: number) {
      return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
    }

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
    const header = container?.children[0].children[0];
    if (container && header) {
      const position = container.scrollTop - header.clientHeight;
      //updates only when position moved more than one row height
      if (scrollPosition < position - rowHeight || scrollPosition > position + rowHeight) {
        setScrollPosition(position);
      }
    }
  }, [getRowHeight, scrollPosition]);

  React.useEffect(() => {
    const container = document.getElementById('table-container');
    if (container && container.getAttribute('listener') !== 'true') {
      container.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleResize);
    }

    handleScroll();
    handleResize();
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
    return getSortedFlows().map((f, i) =>
      scrollPosition <= i * rowHeight && scrollPosition + containerHeight > i * rowHeight ? (
        <NetflowTableRow
          key={f.key}
          flow={f}
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
          tableWidth={width}
        />
      ) : (
        <tr className={`empty-row`} style={{ height: rowHeight }} key={f.key} />
      )
    );
  }, [
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
    width
  ]);

  if (width === 0) {
    return null;
  } else if (error) {
    return (
      <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
        <Title headingLevel="h2" size="lg">
          {t('Unable to get flows')}
        </Title>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
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
          <EmptyState variant={EmptyStateVariant.small}>
            <EmptyStateIcon icon={SearchIcon} />
            <Title headingLevel="h2" size="lg">
              {t('No results found')}
            </Title>
            <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
            <Button data-test="clear-all-filters" variant="link" onClick={clearFilters}>
              {t('Clear all filters')}
            </Button>
          </EmptyState>
        </Bullseye>
      );
    }
  }

  return (
    <div id="table-container">
      <TableComposable aria-label="Netflow table" variant="compact" style={{ minWidth: `${width}em` }} isStickyHeader>
        <NetflowTableHeader
          onSort={onSort}
          sortDirection={activeSortDirection}
          sortId={activeSortId}
          columns={columns}
          tableWidth={width}
        />
        <Tbody>{getBody()}</Tbody>
      </TableComposable>
    </div>
  );
};

export default NetflowTable;
