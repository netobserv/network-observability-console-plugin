/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import { Record } from '../api/ipfix';
import { defaultNetflowMetrics, NetflowMetrics, Stats } from '../api/loki';
import { rateMetricFunctions, timeMetricFunctions } from '../components/dropdowns/metric-function-dropdown';
import { limitValues, topValues } from '../components/dropdowns/query-options-panel';
import { TruncateLength } from '../components/dropdowns/truncate-dropdown';
import { Size } from '../components/messages/error';
import { ViewId } from '../components/netflow-traffic';
import { SearchEvent } from '../components/search/search';
import { Warning } from '../model/warnings';
import { Column, ColumnSizeMap } from '../utils/columns';
import { ContextSingleton } from '../utils/context';
import { TimeRange } from '../utils/datetime';
import { useK8sModelsWithColors } from '../utils/k8s-models-hook';
import {
  defaultArraySelectionOptions,
  localStorageColsKey,
  localStorageColsSizesKey,
  localStorageDisabledFiltersKey,
  localStorageLastLimitKey,
  localStorageLastTopKey,
  localStorageMetricFunctionKey,
  localStorageMetricScopeKey,
  localStorageMetricTypeKey,
  localStorageOverviewFocusKey,
  localStorageOverviewIdsKey,
  localStorageOverviewTruncateKey,
  localStorageQueryParamsKey,
  localStorageRefreshKey,
  localStorageShowHistogramKey,
  localStorageShowOptionsKey,
  localStorageSizeKey,
  localStorageTopologyOptionsKey,
  localStorageViewIdKey,
  useLocalStorage
} from '../utils/local-storage-hook';
import { OverviewPanel } from '../utils/overview-panels';
import {
  defaultMetricFunction,
  defaultMetricScope,
  defaultMetricType,
  getDataSourceFromURL,
  getLimitFromURL,
  getPacketLossFromURL,
  getRangeFromURL,
  getRecordTypeFromURL,
  getShowDupFromURL
} from '../utils/router';
import { Config, defaultConfig } from './config';
import { DisabledFilters, Filters } from './filters';
import { DataSource, FlowScope, isTimeMetric, MetricType, PacketLoss, RecordType, StatFunction } from './flow-query';
import { getGroupsForScope } from './scope';
import { DefaultOptions, GraphElementPeer, TopologyOptions } from './topology';

// NetflowTraffic model holding current states and localStorages
export function netflowTrafficModel() {
  // Config state
  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const k8sModels = useK8sModelsWithColors();

  // Find FlowCollector in supported kinds to be able to refer it
  const flowCollectorModelKey = Object.keys(k8sModels).find(k => k.includes('FlowCollector'));
  if (flowCollectorModelKey) {
    ContextSingleton.setFlowCollectorK8SModel(k8sModels[flowCollectorModelKey]);
  }

  // Local storage
  const [queryParams, setQueryParams] = useLocalStorage<string>(localStorageQueryParamsKey);
  const [disabledFilters, setDisabledFilters] = useLocalStorage<DisabledFilters>(localStorageDisabledFiltersKey, {});
  const [size, setSize] = useLocalStorage<Size>(localStorageSizeKey, 'm');
  const [selectedViewId, setSelectedViewId] = useLocalStorage<ViewId>(localStorageViewIdKey, 'overview');
  const [lastLimit, setLastLimit] = useLocalStorage<number>(localStorageLastLimitKey, limitValues[0]);
  const [lastTop, setLastTop] = useLocalStorage<number>(localStorageLastTopKey, topValues[0]);
  const [metricScope, setMetricScope] = useLocalStorage<FlowScope>(localStorageMetricScopeKey, defaultMetricScope);
  const [topologyMetricFunction, setTopologyMetricFunction] = useLocalStorage<StatFunction>(
    localStorageMetricFunctionKey,
    defaultMetricFunction
  );
  const [topologyMetricType, setTopologyMetricType] = useLocalStorage<MetricType>(
    localStorageMetricTypeKey,
    defaultMetricType
  );
  const [topologyUDNIds, setTopologyUDNIds] = useState<string[]>([]);
  const [interval, setInterval] = useLocalStorage<number | undefined>(localStorageRefreshKey);
  const [showViewOptions, setShowViewOptions] = useLocalStorage<boolean>(localStorageShowOptionsKey, false);
  const [showHistogram, setShowHistogram] = useLocalStorage<boolean>(localStorageShowHistogramKey, false);
  const [overviewTruncateLength, setOverviewTruncateLength] = useLocalStorage<TruncateLength>(
    localStorageOverviewTruncateKey,
    TruncateLength.M
  );
  const [overviewFocus, setOverviewFocus] = useLocalStorage<boolean>(localStorageOverviewFocusKey, false);
  const [topologyOptions, setTopologyOptions] = useLocalStorage<TopologyOptions>(
    localStorageTopologyOptionsKey,
    DefaultOptions
  );
  const [panels, setPanels] = useLocalStorage<OverviewPanel[]>(
    localStorageOverviewIdsKey,
    [],
    defaultArraySelectionOptions
  );
  const [columns, setColumns] = useLocalStorage<Column[]>(localStorageColsKey, [], defaultArraySelectionOptions);
  const [columnSizes, setColumnSizes] = useLocalStorage<ColumnSizeMap>(localStorageColsSizesKey, {});

  // Display state
  const [loading, setLoading] = React.useState(true);
  const [warning, setWarning] = React.useState<Warning | undefined>();
  const [isViewOptionOverflowMenuOpen, setViewOptionOverflowMenuOpen] = React.useState(false);
  const [isFullScreen, setFullScreen] = React.useState(false);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [stats, setStats] = React.useState<Stats | undefined>(undefined);
  const [metrics, setMetrics] = React.useState<NetflowMetrics>(defaultNetflowMetrics);
  const [isShowQuerySummary, setShowQuerySummary] = React.useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | undefined>(undefined);
  const [lastDuration, setLastDuration] = React.useState<number | undefined>(undefined);
  const [chipsPopoverMessage, setChipsPopoverMessage] = React.useState<string | undefined>();
  const [scopeWarning, setScopeWarning] = React.useState<string | undefined>();
  const [error, setError] = React.useState<string | undefined>();
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isOverviewModalOpen, setOverviewModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Filters>({ list: [], match: 'all' });
  const [packetLoss, setPacketLoss] = React.useState<PacketLoss>(getPacketLossFromURL());
  const [recordType, setRecordType] = React.useState<RecordType>(getRecordTypeFromURL());
  const [dataSource, setDataSource] = React.useState<DataSource>(getDataSourceFromURL());
  const [showDuplicates, setShowDuplicates] = React.useState<boolean>(getShowDupFromURL());
  const [limit, setLimit] = React.useState<number>(
    getLimitFromURL(selectedViewId === 'table' ? limitValues[0] : topValues[0])
  );
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [histogramRange, setHistogramRange] = React.useState<TimeRange>();
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);
  const [selectedElement, setSelectedElement] = React.useState<GraphElementPeer | undefined>(undefined);
  const [searchEvent, setSearchEvent] = React.useState<SearchEvent | undefined>(undefined);

  const updateMetricScope = React.useCallback(
    (scope: FlowScope) => {
      setMetricScope(scope);
      // Clear scope warning when user manually changes scope
      setScopeWarning(undefined);
      // Invalidate groups if necessary, when metrics scope changed
      const groups = getGroupsForScope(scope, config.scopes);
      if (!groups.includes(topologyOptions.groupTypes)) {
        setTopologyOptions({ ...topologyOptions, groupTypes: 'auto' });
      }
    },
    [setMetricScope, config.scopes, topologyOptions, setTopologyOptions]
  );

  const updateTopologyMetricType = React.useCallback(
    (metricType: MetricType) => {
      if (isTimeMetric(metricType)) {
        // fallback on average if current function not available for time queries
        if (!timeMetricFunctions.includes(topologyMetricFunction)) {
          setTopologyMetricFunction('avg');
        }
      } else {
        // fallback on average if current function not available for rate queries
        if (!rateMetricFunctions.includes(topologyMetricFunction)) {
          setTopologyMetricFunction('avg');
        }
      }
      setTopologyMetricType(metricType);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topologyMetricFunction, setTopologyMetricFunction, setTopologyMetricType]
  );

  const updateConfig = React.useCallback(
    (c: Config) => {
      setConfig(c);
      ContextSingleton.setScopes(c.scopes);
    },
    [setConfig]
  );

  return {
    config,
    setConfig: updateConfig,
    k8sModels,
    queryParams,
    setQueryParams,
    disabledFilters,
    setDisabledFilters,
    size,
    setSize,
    selectedViewId,
    setSelectedViewId,
    lastLimit,
    setLastLimit,
    lastTop,
    setLastTop,
    metricScope,
    setMetricScope: updateMetricScope,
    topologyMetricFunction,
    setTopologyMetricFunction,
    topologyMetricType,
    setTopologyMetricType: updateTopologyMetricType,
    topologyUDNIds,
    setTopologyUDNIds,
    interval,
    setInterval,
    showViewOptions,
    setShowViewOptions,
    showHistogram,
    setShowHistogram,
    overviewTruncateLength,
    setOverviewTruncateLength,
    overviewFocus,
    setOverviewFocus,
    topologyOptions,
    setTopologyOptions,
    panels,
    setPanels,
    columns,
    setColumns,
    columnSizes,
    setColumnSizes,
    loading,
    setLoading,
    warning,
    setWarning,
    isViewOptionOverflowMenuOpen,
    setViewOptionOverflowMenuOpen,
    isFullScreen,
    setFullScreen,
    flows,
    setFlows,
    stats,
    setStats,
    metrics,
    setMetrics,
    isShowQuerySummary,
    setShowQuerySummary,
    lastRefresh,
    setLastRefresh,
    lastDuration,
    setLastDuration,
    chipsPopoverMessage,
    setChipsPopoverMessage,
    scopeWarning,
    setScopeWarning,
    error,
    setError,
    isTRModalOpen,
    setTRModalOpen,
    isOverviewModalOpen,
    setOverviewModalOpen,
    isColModalOpen,
    setColModalOpen,
    isExportModalOpen,
    setExportModalOpen,
    filters,
    setFilters,
    packetLoss,
    setPacketLoss,
    recordType,
    setRecordType,
    dataSource,
    setDataSource,
    showDuplicates,
    setShowDuplicates,
    limit,
    setLimit,
    range,
    setRange,
    histogramRange,
    setHistogramRange,
    selectedRecord,
    setSelectedRecord,
    selectedElement,
    setSelectedElement,
    searchEvent,
    setSearchEvent
  };
}
