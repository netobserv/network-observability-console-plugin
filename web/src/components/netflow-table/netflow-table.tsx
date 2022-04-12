import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TableComposable, Tbody } from '@patternfly/react-table';
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
import { Column } from '../../utils/columns';
import { Size } from '../dropdowns/display-dropdown';
import { usePrevious } from '../../utils/previous-hook';
import './netflow-table.css';

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

  const [containerHeight, setContainerHeight] = React.useState(0);
  const previousContainerHeight = usePrevious(containerHeight);
  const [scrollPosition, setScrollPosition] = React.useState(0);
  const previousScrollPosition = usePrevious(scrollPosition);
  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(-1);
  const previousActiveSortIndex = usePrevious(activeSortIndex);
  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<string>('asc');
  const previousActiveSortDirection = usePrevious(activeSortDirection);
  const firstRender = React.useRef(true);

  const width = columns.reduce((prev, cur) => prev + cur.width, 0);

  React.useEffect(() => {
    if (firstRender.current) {
      firstRender.current = firstRender.current && flows.length == 0;
      return;
    }
  }, [flows]);

  //get row height from display size
  //these values match netflow-table.css and record-field.css
  const getRowHeight = React.useCallback(() => {
    switch (size) {
      case 'l':
        return 143;
      case 'm':
        return 101;
      case 's':
      default:
        return 59;
    }
  }, [size]);

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
    if (activeSortIndex < 0 || activeSortIndex >= columns.length) {
      return flows;
    } else {
      return flows.sort((a: Record, b: Record) => {
        const col = columns[activeSortIndex];
        return activeSortDirection === 'desc' ? col.sort(a, b, col) : col.sort(b, a, col);
      });
    }
  }, [activeSortDirection, activeSortIndex, columns, flows]);

  // sort handler
  const onSort = (event: React.MouseEvent, index: number, direction: string) => {
    setActiveSortIndex(index);
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
            previousActiveSortIndex === activeSortIndex &&
            !firstRender.current
          }
          height={rowHeight}
          tableWidth={width}
        />
      ) : (
        <tr className={`empty-row ${size}`} key={f.key} />
      )
    );
  }, [
    activeSortDirection,
    activeSortIndex,
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
          sortIndex={activeSortIndex}
          columns={columns}
          tableWidth={width}
        />
        <Tbody>{getBody()}</Tbody>
      </TableComposable>
    </div>
  );
};

export default NetflowTable;
