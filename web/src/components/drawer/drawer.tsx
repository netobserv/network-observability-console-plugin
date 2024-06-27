import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Drawer, DrawerContent, DrawerContentBody, Flex, FlexItem } from '@patternfly/react-core';
import { t } from 'i18next';
import _ from 'lodash';
import React from 'react';
import { GraphElementPeer, TopologyOptions } from 'src/model/topology';
import { TimeRange } from 'src/utils/datetime';
import { Record } from '../../api/ipfix';
import { getFunctionMetricKey, getRateMetricKey, NetflowMetrics, Stats } from '../../api/loki';
import {
  Filter,
  FilterDefinition,
  Filters,
  filtersEqual,
  hasIndexFields,
  hasNonIndexFields
} from '../../model/filters';
import { FlowScope, Match, MetricType, RecordType, StatFunction } from '../../model/flow-query';
import { Warning } from '../../model/warnings';
import { Column, ColumnSizeMap } from '../../utils/columns';
import { isPromUnsupportedError } from '../../utils/errors';
import { OverviewPanel } from '../../utils/overview-panels';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { Error, Size } from '../messages/error';
import { ViewId } from '../netflow-traffic';
import FlowsQuerySummary from '../query-summary/flows-query-summary';
import MetricsQuerySummary from '../query-summary/metrics-query-summary';
import SummaryPanel from '../query-summary/summary-panel';
import { SearchEvent, SearchHandle } from '../search/search';
import NetflowOverview from '../tabs/netflow-overview/netflow-overview';
import NetflowTable from '../tabs/netflow-table/netflow-table';
import NetflowTopology from '../tabs/netflow-topology/netflow-topology';
import { LinksOverflow } from '../toolbar/links-overflow';
import ElementPanel from './element/element-panel';
import RecordPanel from './record/record-panel';

export interface NetflowTrafficDrawerProps {
  isDarkTheme: boolean;
  defaultFilters: Filter[];
  error: string | undefined;
  currentState: string[];
  selectedViewId: ViewId;
  limit: number;
  panels: OverviewPanel[];
  recordType: RecordType;
  metrics: NetflowMetrics;
  loading?: boolean;
  overviewTruncateLength: TruncateLength;
  overviewFocus: boolean;
  setOverviewFocus: (v: boolean) => void;
  flows: Record[];
  selectedRecord?: Record;
  availableColumns: Column[];
  setColumns: (v: Column[]) => void;
  columnSizes: ColumnSizeMap;
  setColumnSizes: (v: ColumnSizeMap) => void;
  size: Size;
  allowPktDrop: boolean;
  allowDNSMetric: boolean;
  allowRTTMetric: boolean;
  resetDefaultFilters: (c?: any) => void;
  clearFilters: () => void;
  filters: Filters;
  k8sModels: { [key: string]: K8sModel };
  topologyMetricFunction: StatFunction;
  topologyMetricType: MetricType;
  metricScope: FlowScope;
  setMetricScope: (ms: FlowScope) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  filterDefinitions: FilterDefinition[];
  setFilters: (v: Filters) => void;
  selectedElement: GraphElementPeer | undefined;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  allowedScopes: FlowScope[];
  isShowQuerySummary: boolean;
  lastRefresh: Date | undefined;
  range: TimeRange | number;
  canSwitchTypes: boolean;
  setRange: (tr: TimeRange | number) => void;
  setRecordType: (r: RecordType) => void;
  maxChunkAge?: number;
  stats?: Stats;
  lastDuration?: number;
  warning?: Warning;
  match: Match;
  setShowQuerySummary: (v: boolean) => void;
  clearSelections: () => void;
  setSelectedRecord: (v: Record | undefined) => void;
  setSelectedElement: (v: GraphElementPeer | undefined) => void;
}

export const NetflowTrafficDrawer: React.FC<NetflowTrafficDrawerProps> = props => {
  const getSelectedColumns = React.useCallback(() => {
    return props.availableColumns.filter(column => column.isSelected);
  }, [props.availableColumns]);

  const onRecordSelect = React.useCallback((record?: Record) => {
    props.clearSelections();
    props.setSelectedRecord(record);
  }, []);

  const onElementSelect = React.useCallback((element?: GraphElementPeer) => {
    props.clearSelections();
    props.setSelectedElement(element);
  }, []);

  const onToggleQuerySummary = React.useCallback((v: boolean) => {
    props.clearSelections();
    props.setShowQuerySummary(v);
  }, []);

  const setFiltersList = React.useCallback(
    (list: Filter[]) => {
      props.setFilters({ ...props.filters, list: list });
    },
    [props.setFilters, props.filters]
  );

  const filterLinks = React.useCallback(() => {
    const defFilters = props.defaultFilters;
    return (
      <LinksOverflow
        id={'filter-links-overflow'}
        items={[
          {
            id: 'reset-filters',
            label: t('Reset defaults'),
            onClick: props.resetDefaultFilters,
            enabled: defFilters.length > 0 && !filtersEqual(props.filters.list, defFilters)
          },
          {
            id: 'clear-all-filters',
            label: t('Clear all'),
            onClick: props.clearFilters,
            enabled: props.filters.list.length > 0
          }
        ]}
      />
    );
  }, [props.defaultFilters, t, props.resetDefaultFilters, props.filters.list, props.clearFilters]);

  const getTopologyMetrics = React.useCallback(() => {
    switch (props.topologyMetricType) {
      case 'Bytes':
      case 'Packets':
        return props.metrics.rateMetrics?.[getRateMetricKey(props.topologyMetricType)];
      case 'DnsLatencyMs':
        return props.metrics.dnsLatencyMetrics?.[getFunctionMetricKey(props.topologyMetricFunction)];
      case 'TimeFlowRttNs':
        return props.metrics.rttMetrics?.[getFunctionMetricKey(props.topologyMetricFunction)];
      default:
        return undefined;
    }
  }, [
    props.metrics.dnsLatencyMetrics,
    props.topologyMetricFunction,
    props.topologyMetricType,
    props.metrics.rateMetrics,
    props.metrics.rttMetrics
  ]);

  const getTopologyDroppedMetrics = React.useCallback(() => {
    switch (props.topologyMetricType) {
      case 'Bytes':
      case 'Packets':
      case 'PktDropBytes':
      case 'PktDropPackets':
        return props.metrics.droppedRateMetrics?.[getRateMetricKey(props.topologyMetricType)];
      default:
        return undefined;
    }
  }, [props.metrics.droppedRateMetrics, props.topologyMetricType]);

  const checkSlownessReason = React.useCallback(
    (w: Warning | undefined): Warning | undefined => {
      if (w?.type == 'slow') {
        let reason = '';
        if (props.match === 'any' && hasNonIndexFields(props.filters.list)) {
          reason = t(
            // eslint-disable-next-line max-len
            'When in "Match any" mode, try using only Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
          );
        } else if (props.match === 'all' && !hasIndexFields(props.filters.list)) {
          reason = t(
            // eslint-disable-next-line max-len
            'Add Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
          );
        } else {
          reason = t('Add more filters or decrease limit / range to improve the query performance');
        }
        return { ...w, details: reason };
      }
      return w;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.match, props.filters]
  );

  const mainContent = () => {
    let content: JSX.Element | null = null;
    if (props.error) {
      content = (
        <Error
          title={t('Unable to get {{item}}', {
            item: props.currentState.includes('configLoadError') ? t('config') : props.selectedViewId
          })}
          error={props.error}
          isLokiRelated={!props.currentState.includes('configLoadError') && !isPromUnsupportedError(props.error)}
        />
      );
    } else {
      switch (props.selectedViewId) {
        case 'overview':
          content = (
            <NetflowOverview
              limit={props.limit}
              panels={props.panels}
              recordType={props.recordType}
              metrics={props.metrics}
              loading={props.loading}
              isDark={props.isDarkTheme}
              filterActionLinks={filterLinks()}
              truncateLength={props.overviewTruncateLength}
              focus={props.overviewFocus}
              setFocus={props.setOverviewFocus}
            />
          );
          break;
        case 'table':
          content = (
            <NetflowTable
              loading={props.loading}
              allowPktDrops={props.allowPktDrop}
              flows={props.flows}
              selectedRecord={props.selectedRecord}
              size={props.size}
              onSelect={onRecordSelect}
              columns={getSelectedColumns()}
              setColumns={(v: Column[]) =>
                props.setColumns(v.concat(props.availableColumns.filter(col => !col.isSelected)))
              }
              columnSizes={props.columnSizes}
              setColumnSizes={props.setColumnSizes}
              filterActionLinks={filterLinks()}
              isDark={props.isDarkTheme}
            />
          );
          break;
        case 'topology':
          content = (
            <NetflowTopology
              loading={props.loading}
              k8sModels={props.k8sModels}
              metricFunction={props.topologyMetricFunction}
              metricType={props.topologyMetricType}
              metricScope={props.metricScope}
              setMetricScope={props.setMetricScope}
              metrics={getTopologyMetrics() || []}
              droppedMetrics={getTopologyDroppedMetrics() || []}
              options={props.topologyOptions}
              setOptions={props.setTopologyOptions}
              filters={props.filters}
              filterDefinitions={props.filterDefinitions}
              setFilters={props.setFilters}
              selected={props.selectedElement}
              onSelect={onElementSelect}
              searchHandle={props.searchHandle}
              searchEvent={props.searchEvent}
              isDark={props.isDarkTheme}
              allowedScopes={props.allowedScopes}
            />
          );
          break;
        default:
          content = null;
          break;
      }
    }
    return content;
  };

  const panelContent = () => {
    if (props.selectedRecord) {
      return (
        <RecordPanel
          id="recordPanel"
          record={props.selectedRecord}
          columns={props.availableColumns}
          filters={props.filters.list}
          filterDefinitions={props.filterDefinitions}
          range={props.range}
          type={props.recordType}
          isDark={props.isDarkTheme}
          canSwitchTypes={props.canSwitchTypes}
          allowPktDrops={props.allowPktDrop}
          setFilters={setFiltersList}
          setRange={props.setRange}
          setType={props.setRecordType}
          onClose={() => onRecordSelect(undefined)}
        />
      );
    } else if (props.isShowQuerySummary) {
      return (
        <SummaryPanel
          id="summaryPanel"
          flows={props.flows}
          metrics={props.metrics}
          type={props.recordType}
          maxChunkAge={props.maxChunkAge}
          stats={props.stats}
          limit={props.limit}
          lastRefresh={props.lastRefresh}
          lastDuration={props.lastDuration}
          warning={checkSlownessReason(props.warning)}
          range={props.range}
          showDNSLatency={props.allowDNSMetric}
          showRTTLatency={props.allowRTTMetric}
          onClose={() => props.setShowQuerySummary(false)}
        />
      );
    } else if (props.selectedElement) {
      return (
        <ElementPanel
          id="elementPanel"
          element={props.selectedElement}
          metrics={getTopologyMetrics() || []}
          droppedMetrics={getTopologyDroppedMetrics() || []}
          metricType={props.topologyMetricType}
          truncateLength={props.topologyOptions.truncateLength}
          filters={props.filters.list}
          filterDefinitions={props.filterDefinitions}
          setFilters={setFiltersList}
          onClose={() => onElementSelect(undefined)}
          isDark={props.isDarkTheme}
        />
      );
    } else {
      return null;
    }
  };

  return (
    <Drawer
      id="drawer"
      isInline
      isExpanded={props.selectedRecord !== undefined || props.selectedElement !== undefined || props.isShowQuerySummary}
    >
      <DrawerContent id="drawerContent" panelContent={panelContent()}>
        <DrawerContentBody id="drawerBody">
          <Flex id="page-content-flex" direction={{ default: 'column' }}>
            <FlexItem
              id={`${props.selectedViewId}-container`}
              flex={{ default: 'flex_1' }}
              className={props.isDarkTheme ? 'dark' : 'light'}
            >
              {mainContent()}
            </FlexItem>
            <FlexItem>
              {_.isEmpty(props.flows) ? (
                <MetricsQuerySummary
                  metrics={props.metrics}
                  stats={props.stats}
                  loading={props.loading}
                  lastRefresh={props.lastRefresh}
                  lastDuration={props.lastDuration}
                  warning={checkSlownessReason(props.warning)}
                  isShowQuerySummary={props.isShowQuerySummary}
                  toggleQuerySummary={() => onToggleQuerySummary(!props.isShowQuerySummary)}
                  isDark={props.isDarkTheme}
                />
              ) : (
                <FlowsQuerySummary
                  flows={props.flows}
                  stats={props.stats}
                  loading={props.loading}
                  lastRefresh={props.lastRefresh}
                  lastDuration={props.lastDuration}
                  warning={checkSlownessReason(props.warning)}
                  range={props.range}
                  type={props.recordType}
                  isShowQuerySummary={props.isShowQuerySummary}
                  toggleQuerySummary={() => onToggleQuerySummary(!props.isShowQuerySummary)}
                />
              )}
            </FlexItem>
          </Flex>
        </DrawerContentBody>
      </DrawerContent>
    </Drawer>
  );
};

export default NetflowTrafficDrawer;
