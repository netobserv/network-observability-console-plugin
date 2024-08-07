/* eslint-disable react-hooks/rules-of-hooks */
import React from 'react';
import { Record } from '../api/ipfix';
import { defaultNetflowMetrics, NetflowMetrics, Stats } from '../api/loki';
import { limitValues, topValues } from '../components/dropdowns/query-options-panel';
import { TruncateLength } from '../components/dropdowns/truncate-dropdown';
import { Size } from '../components/messages/error';
import { ViewId } from '../components/netflow-traffic';
import { SearchEvent } from '../components/search/search';
import { Warning } from '../model/warnings';
import { Column, ColumnSizeMap } from '../utils/columns';
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
  defaultMetricType,
  getDataSourceFromURL,
  getLimitFromURL,
  getMatchFromURL,
  getPacketLossFromURL,
  getRangeFromURL,
  getRecordTypeFromURL,
  getShowDupFromURL
} from '../utils/router';
import { Config, defaultConfig } from './config';
import { DisabledFilters, Filters } from './filters';
import { DataSource, FlowScope, Match, MetricType, PacketLoss, RecordType, StatFunction } from './flow-query';
import { DefaultOptions, GraphElementPeer, TopologyOptions } from './topology';

// NetflowTraffic model holding current states and localStorages
export function netflowTrafficModel() {
  // Config state
  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const k8sModels = useK8sModelsWithColors();

  // Local storage
  const [queryParams, setQueryParams] = useLocalStorage<string>(localStorageQueryParamsKey);
  const [disabledFilters, setDisabledFilters] = useLocalStorage<DisabledFilters>(localStorageDisabledFiltersKey, {});
  const [size, setSize] = useLocalStorage<Size>(localStorageSizeKey, 'm');
  const [selectedViewId, setSelectedViewId] = useLocalStorage<ViewId>(localStorageViewIdKey, 'overview');
  const [lastLimit, setLastLimit] = useLocalStorage<number>(localStorageLastLimitKey, limitValues[0]);
  const [lastTop, setLastTop] = useLocalStorage<number>(localStorageLastTopKey, topValues[0]);
  const [metricScope, setMetricScope] = useLocalStorage<FlowScope>(localStorageMetricScopeKey, 'namespace');
  const [topologyMetricFunction, setTopologyMetricFunction] = useLocalStorage<StatFunction>(
    localStorageMetricFunctionKey,
    defaultMetricFunction
  );
  const [topologyMetricType, setTopologyMetricType] = useLocalStorage<MetricType>(
    localStorageMetricTypeKey,
    defaultMetricType
  );
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
  const [error, setError] = React.useState<string | undefined>();
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isOverviewModalOpen, setOverviewModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<Filters>({ list: [], backAndForth: false });
  const [match, setMatch] = React.useState<Match>(getMatchFromURL());
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

  return {
    config,
    setConfig,
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
    setMetricScope,
    topologyMetricFunction,
    setTopologyMetricFunction,
    topologyMetricType,
    setTopologyMetricType,
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
    match,
    setMatch,
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
