import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Drawer, DrawerContent, DrawerContentBody, Flex, FlexItem } from '@patternfly/react-core';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Record } from '../../api/ipfix';
import { getFunctionMetricKey, getRateMetricKey, NetflowMetrics, Stats } from '../../api/loki';
import { Config } from '../../model/config';
import {
  Filter,
  FilterDefinition,
  Filters,
  filtersEqual,
  hasIndexFields,
  hasNonIndexFields
} from '../../model/filters';
import { FlowScope, MetricType, RecordType, StatFunction } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';
import { GraphElementPeer, TopologyOptions } from '../../model/topology';
import { Warning } from '../../model/warnings';
import { Column, ColumnSizeMap } from '../../utils/columns';
import { TimeRange } from '../../utils/datetime';
import { isPromError } from '../../utils/errors';
import { OverviewPanel } from '../../utils/overview-panels';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ErrorComponent, Size } from '../messages/error';
import { ErrorBanner } from '../messages/error-banner';
import { WarningBanner } from '../messages/warning-banner';
import { ViewId } from '../netflow-traffic';
import FlowsQuerySummary from '../query-summary/flows-query-summary';
import MetricsQuerySummary from '../query-summary/metrics-query-summary';
import SummaryPanel from '../query-summary/summary-panel';
import { SearchEvent, SearchHandle } from '../search/search';
import { NetflowOverview, NetflowOverviewHandle } from '../tabs/netflow-overview/netflow-overview';
import { NetflowTable, NetflowTableHandle } from '../tabs/netflow-table/netflow-table';
import { NetflowTopology, NetflowTopologyHandle } from '../tabs/netflow-topology/netflow-topology';
import ElementPanel from './element/element-panel';
import './netflow-traffic-drawer.css';
import RecordPanel from './record/record-panel';

export type NetflowTrafficDrawerHandle = {
  getOverviewHandle: () => NetflowOverviewHandle | null;
  getTableHandle: () => NetflowTableHandle | null;
  getTopologyHandle: () => NetflowTopologyHandle | null;
};

export interface NetflowTrafficDrawerProps {
  ref?: React.Ref<NetflowTrafficDrawerHandle>;
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
  selectedColumns: Column[];
  setColumns: (v: Column[]) => void;
  columnSizes: ColumnSizeMap;
  setColumnSizes: (v: ColumnSizeMap) => void;
  size: Size;
  allowPktDrop: boolean;
  allowDNSMetric: boolean;
  allowRTTMetric: boolean;
  resetDefaultFilters: (c?: Config) => void;
  clearFilters: () => void;
  filters: Filters;
  k8sModels: { [key: string]: K8sModel };
  topologyMetricFunction: StatFunction;
  topologyMetricType: MetricType;
  topologyUDNIds: string[];
  metricScope: FlowScope;
  setMetricScope: (ms: FlowScope) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  filterDefinitions: FilterDefinition[];
  setFilters: (v: Filters) => void;
  selectedElement: GraphElementPeer | undefined;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  scopes: ScopeConfigDef[];
  scopeWarning?: string;
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
  setShowQuerySummary: (v: boolean) => void;
  clearSelections: () => void;
  setSelectedRecord: (v: Record | undefined) => void;
  setSelectedElement: (v: GraphElementPeer | undefined) => void;
}

// eslint-disable-next-line react/display-name
export const NetflowTrafficDrawer: React.FC<NetflowTrafficDrawerProps> = React.forwardRef(
  (props, ref: React.Ref<NetflowTrafficDrawerHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    const overviewRef = React.useRef<NetflowOverviewHandle>(null);
    const tableRef = React.useRef<NetflowTableHandle>(null);
    const topologyRef = React.useRef<NetflowTopologyHandle>(null);

    const {
      defaultFilters,
      metrics,
      resetDefaultFilters,
      clearFilters,
      filters,
      topologyMetricFunction,
      topologyMetricType,
      setFilters,
      setShowQuerySummary,
      clearSelections,
      setSelectedRecord,
      setSelectedElement
    } = props;

    React.useImperativeHandle(ref, () => ({
      getOverviewHandle: () => overviewRef.current,
      getTableHandle: () => tableRef.current,
      getTopologyHandle: () => topologyRef.current
    }));

    const onRecordSelect = React.useCallback(
      (record?: Record) => {
        clearSelections();
        setSelectedRecord(record);
      },
      [clearSelections, setSelectedRecord]
    );

    const onElementSelect = React.useCallback(
      (element?: GraphElementPeer) => {
        clearSelections();
        setSelectedElement(element);
      },
      [clearSelections, setSelectedElement]
    );

    const onToggleQuerySummary = React.useCallback(
      (v: boolean) => {
        clearSelections();
        setShowQuerySummary(v);
      },
      [clearSelections, setShowQuerySummary]
    );

    const setFiltersList = React.useCallback(
      (list: Filter[]) => {
        setFilters({ ...filters, list: list });
      },
      [filters, setFilters]
    );

    const getResetDefaultFiltersProp = React.useCallback(() => {
      if (defaultFilters.length > 0 && !filtersEqual(filters.list, defaultFilters)) {
        return resetDefaultFilters;
      }
      return undefined;
    }, [defaultFilters, resetDefaultFilters, filters.list]);

    const getClearFiltersProp = React.useCallback(() => {
      if (filters.list.length > 0) {
        return clearFilters;
      }
      return undefined;
    }, [filters.list, clearFilters]);

    const getTopologyMetrics = React.useCallback(() => {
      switch (topologyMetricType) {
        case 'Bytes':
        case 'Packets':
          return metrics.rateMetrics?.[getRateMetricKey(topologyMetricType)];
        case 'DnsLatencyMs':
          return metrics.dnsLatencyMetrics?.[getFunctionMetricKey(topologyMetricFunction)];
        case 'TimeFlowRttNs':
          return metrics.rttMetrics?.[getFunctionMetricKey(topologyMetricFunction)];
        default:
          return undefined;
      }
    }, [
      metrics.dnsLatencyMetrics,
      topologyMetricFunction,
      topologyMetricType,
      metrics.rateMetrics,
      metrics.rttMetrics
    ]);

    const getTopologyDroppedMetrics = React.useCallback(() => {
      switch (topologyMetricType) {
        case 'Bytes':
        case 'Packets':
        case 'PktDropBytes':
        case 'PktDropPackets':
          return metrics.droppedRateMetrics?.[getRateMetricKey(topologyMetricType)];
        default:
          return undefined;
      }
    }, [metrics.droppedRateMetrics, topologyMetricType]);

    const checkSlownessReason = React.useCallback(
      (w: Warning | undefined): Warning | undefined => {
        if (w?.type == 'slow') {
          let reason = '';
          if (filters.match === 'any' && hasNonIndexFields(filters.list)) {
            reason = t(
              // eslint-disable-next-line max-len
              'When in "Match any" mode, try using only Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
            );
          } else if (filters.match === 'all' && !hasIndexFields(filters.list)) {
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
      [filters, t]
    );

    const mainContent = () => {
      let content: JSX.Element | null = null;

      // For overview and topology tabs: show error banner and partial metrics when possible
      // For table tab or config errors: show full error page
      // For topology: if main metrics are missing or scope warning is not set, show full error page
      const hasTopologyMetrics = props.selectedViewId === 'topology' && (getTopologyMetrics()?.length || 0) > 0;
      const showFullError =
        props.error &&
        (props.currentState.includes('configLoadError') ||
          props.selectedViewId === 'table' ||
          (props.selectedViewId === 'topology' && !hasTopologyMetrics && !props.scopeWarning));

      if (showFullError) {
        content = (
          <ErrorComponent
            title={t('Unable to get {{item}}', {
              item: props.currentState.includes('configLoadError') ? t('config') : props.selectedViewId
            })}
            error={props.error || t('Unknown error')}
            isLokiRelated={!props.currentState.includes('configLoadError') && !isPromError(props.error || '')}
          />
        );
      } else {
        switch (props.selectedViewId) {
          case 'overview':
            content = (
              <>
                {props.metrics.errors.length > 0 && <ErrorBanner errors={props.metrics.errors} />}
                {props.scopeWarning && <WarningBanner warning={props.scopeWarning} />}
                <NetflowOverview
                  ref={overviewRef}
                  limit={props.limit}
                  panels={props.panels}
                  recordType={props.recordType}
                  scopes={props.scopes}
                  metricScope={props.metricScope}
                  setMetricScope={props.setMetricScope}
                  metrics={props.metrics}
                  loading={props.loading}
                  isDark={props.isDarkTheme}
                  resetDefaultFilters={getResetDefaultFiltersProp()}
                  clearFilters={getClearFiltersProp()}
                  truncateLength={props.overviewTruncateLength}
                  focus={props.overviewFocus}
                  setFocus={props.setOverviewFocus}
                />
              </>
            );
            break;
          case 'table':
            content = (
              <NetflowTable
                ref={tableRef}
                loading={props.loading}
                allowPktDrops={props.allowPktDrop}
                flows={props.flows}
                selectedRecord={props.selectedRecord}
                size={props.size}
                onSelect={onRecordSelect}
                columns={props.selectedColumns}
                setColumns={(v: Column[]) =>
                  props.setColumns(v.concat(props.availableColumns.filter(col => !col.isSelected)))
                }
                columnSizes={props.columnSizes}
                setColumnSizes={props.setColumnSizes}
                resetDefaultFilters={getResetDefaultFiltersProp()}
                clearFilters={getClearFiltersProp()}
                isDark={props.isDarkTheme}
              />
            );
            break;
          case 'topology':
            content = (
              <>
                {props.metrics.errors.length > 0 && <ErrorBanner errors={props.metrics.errors} />}
                {props.scopeWarning && <WarningBanner warning={props.scopeWarning} />}
                <NetflowTopology
                  ref={topologyRef}
                  loading={props.loading}
                  k8sModels={props.k8sModels}
                  metricFunction={props.topologyMetricFunction}
                  metricType={props.topologyMetricType}
                  metricScope={props.metricScope}
                  expectedNodes={[...props.topologyUDNIds]} // concat all expected nodes here
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
                  scopes={props.scopes}
                  resetDefaultFilters={getResetDefaultFiltersProp()}
                  clearFilters={getClearFiltersProp()}
                />
              </>
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
            filters={props.filters}
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
        isExpanded={
          props.selectedRecord !== undefined || props.selectedElement !== undefined || props.isShowQuerySummary
        }
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
  }
);

export default NetflowTrafficDrawer;
