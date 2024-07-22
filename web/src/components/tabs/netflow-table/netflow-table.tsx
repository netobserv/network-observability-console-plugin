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
import { SortByDirection, TableComposable, Tbody } from '@patternfly/react-table';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Record } from '../../../api/ipfix';
import { FlowMetricsResult, NetflowMetrics, RecordsResult, Stats } from '../../../api/loki';
import { FlowQuery } from '../../../model/flow-query';
import { Column, ColumnsId, ColumnSizeMap } from '../../../utils/columns';
import { TimeRange } from '../../../utils/datetime';
import { mergeFlowReporters } from '../../../utils/flows';
import {
  localStorageSortDirectionKey,
  localStorageSortIdKey,
  useLocalStorage
} from '../../../utils/local-storage-hook';
import { convertRemToPixels } from '../../../utils/panel';
import { usePrevious } from '../../../utils/previous-hook';
import { Size } from '../../dropdowns/table-display-dropdown';
import { NetflowTableHeader } from './netflow-table-header';
import NetflowTableRow from './netflow-table-row';
import './netflow-table.css';

export type NetflowTableHandle = {
  fetch: (
    fq: FlowQuery,
    range: number | TimeRange,
    histogramRange: TimeRange | undefined,
    showHistogram: boolean,
    showDuplicates: boolean,
    metricsRef: React.MutableRefObject<NetflowMetrics>,
    getRecords: (q: FlowQuery) => Promise<RecordsResult>,
    getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
    setFlows: (v: Record[]) => void,
    setMetrics: (v: NetflowMetrics) => void,
    initFunction: () => void
  ) => Promise<Stats[]> | undefined;
};

export interface NetflowTableProps {
  ref?: React.Ref<NetflowTableHandle>;
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
  filterActionLinks: JSX.Element;
  isDark?: boolean;
}

// eslint-disable-next-line react/display-name
export const NetflowTable: React.FC<NetflowTableProps> = React.forwardRef(
  (props, ref: React.Ref<NetflowTableHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    //default to 300 to allow content to be rendered in tests
    const [containerHeight, setContainerHeight] = React.useState(300);
    const previousContainerHeight = usePrevious(containerHeight);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const previousScrollPosition = usePrevious(scrollPosition);
    const [lastRender, setLastRender] = React.useState<string>('');
    // index of the currently active column
    const [activeSortId, setActiveSortId] = useLocalStorage<ColumnsId>(localStorageSortIdKey, ColumnsId.endtime);
    const previousActiveSortIndex = usePrevious(activeSortId);
    // sort direction of the currently active column
    const [activeSortDirection, setActiveSortDirection] = useLocalStorage<SortByDirection>(
      localStorageSortDirectionKey,
      SortByDirection.asc
    );
    const previousActiveSortDirection = usePrevious(activeSortDirection);
    const firstRender = React.useRef(true);
    const width = props.columns.reduce((prev, cur) => prev + cur.width, 0);

    const fetch = React.useCallback(
      (
        fq: FlowQuery,
        range: number | TimeRange,
        histogramRange: TimeRange | undefined,
        showHistogram: boolean,
        showDuplicates: boolean,
        metricsRef: React.MutableRefObject<NetflowMetrics>,
        getRecords: (q: FlowQuery) => Promise<RecordsResult>,
        getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
        setFlows: (v: Record[]) => void,
        setMetrics: (v: NetflowMetrics) => void,
        initFunction: () => void
      ) => {
        initFunction();

        let currentMetrics = metricsRef.current;

        // table query is based on histogram range if available
        const tableQuery = { ...fq };
        if (histogramRange) {
          tableQuery.startTime = histogramRange.from.toString();
          tableQuery.endTime = histogramRange.to.toString();
        }
        const promises: Promise<Stats>[] = [
          getRecords(tableQuery).then(res => {
            const flows = showDuplicates ? res.records : mergeFlowReporters(res.records);
            setFlows(flows);
            return res.stats;
          })
        ];
        if (showHistogram) {
          promises.push(
            getMetrics({ ...fq, function: 'count', aggregateBy: 'app', type: 'Flows' }, range).then(res => {
              const totalFlowCountMetric = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalFlowCountMetric };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        } else {
          currentMetrics = { ...currentMetrics, totalRateMetric: undefined };
          setMetrics(currentMetrics);
        }
        return Promise.all(promises);
      },
      []
    );

    React.useImperativeHandle(ref, () => ({
      fetch
    }));

    React.useEffect(() => {
      if (firstRender.current) {
        firstRender.current = firstRender.current && props.flows.length == 0;
        return;
      }
      setLastRender(String(Date.now()));
    }, [props.flows]);

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
      const found = props.columns.find(c => c.id === activeSortId);
      if (!found) {
        setActiveSortId(ColumnsId.endtime);
        setActiveSortDirection(SortByDirection.asc);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.columns]);

    //get row height from display size
    const getRowHeight = React.useCallback(() => {
      const doubleSizeColumnIds = props.columns.filter(c => c.isCommon).map(c => c.id);
      const containsDoubleLine = props.columns.find(c => doubleSizeColumnIds.includes(c.id)) !== undefined;

      switch (props.size) {
        case 'l':
          return convertRemToPixels(containsDoubleLine ? 8 : 4.5);
        case 'm':
          return convertRemToPixels(containsDoubleLine ? 6 : 3.5);
        case 's':
        default:
          return convertRemToPixels(containsDoubleLine ? 4 : 2.5);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.columns, props.size]);

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
      const header = container?.children[0]?.children[0];
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
    }, [handleResize, handleScroll, props.loading]);

    // sort function
    const getSortedFlows = React.useCallback(() => {
      const found = activeSortId && props.columns.find(c => c.id === activeSortId);
      if (!found) {
        return props.flows;
      } else {
        return props.flows.sort((a: Record, b: Record) => {
          return activeSortDirection === 'desc' ? found.sort(a, b, found) : found.sort(b, a, found);
        });
      }
    }, [activeSortDirection, activeSortId, props.columns, props.flows]);

    // sort handler
    const onSort = React.useCallback(
      (columnId: ColumnsId, direction: SortByDirection) => {
        setActiveSortId(columnId);
        setActiveSortDirection(direction);
      },
      [setActiveSortDirection, setActiveSortId]
    );

    const getBody = React.useCallback(() => {
      const rowHeight = getRowHeight();

      return getSortedFlows().map((f, i) => (
        <NetflowTableRow
          key={f.key}
          allowPktDrops={props.allowPktDrops}
          flow={f}
          lastRender={lastRender}
          columns={props.columns}
          size={props.size}
          selectedRecord={props.selectedRecord}
          onSelect={props.onSelect}
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
          isDark={props.isDark}
        />
      ));
    }, [
      props.allowPktDrops,
      lastRender,
      activeSortDirection,
      activeSortId,
      props.columns,
      containerHeight,
      getRowHeight,
      getSortedFlows,
      props.onSelect,
      previousActiveSortDirection,
      previousActiveSortIndex,
      previousContainerHeight,
      previousScrollPosition,
      scrollPosition,
      props.selectedRecord,
      props.size,
      width,
      props.isDark
    ]);

    if (width === 0) {
      return null;
    } else if (_.isEmpty(props.flows)) {
      if (props.loading) {
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
              <EmptyStateBody>{t('Clear or reset filters and try again.')}</EmptyStateBody>
              {props.filterActionLinks}
            </EmptyState>
          </Bullseye>
        );
      }
    }

    return (
      <TableComposable
        data-test="table-composable"
        data-test-cols-count={props.columns.length}
        data-test-rows-count={props.flows.length}
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
          columns={props.columns}
          setColumns={props.setColumns}
          columnSizes={props.columnSizes}
          setColumnSizes={props.setColumnSizes}
          tableWidth={width}
          isDark={props.isDark}
        />
        <Tbody id="table-body" data-test="table-body">
          {getBody()}
        </Tbody>
      </TableComposable>
    );
  }
);

export default NetflowTable;
