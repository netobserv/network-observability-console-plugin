import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  Dropdown,
  DropdownGroup,
  DropdownItem,
  Flex,
  FlexItem,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  OverflowMenuItem,
  PageSection,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextVariants,
  Toolbar,
  ToolbarItem
} from '@patternfly/react-core';
import { ColumnsIcon, EllipsisVIcon, ExportIcon, SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Record } from '../api/ipfix';
import {
  getFunctionMetricKey,
  getRateMetricKey,
  initFunctionMetricKeys,
  initRateMetricKeys,
  FunctionMetrics,
  RateMetrics,
  Stats,
  TotalFunctionMetrics,
  TotalRateMetrics,
  NetflowMetrics,
  defaultNetflowMetrics
} from '../api/loki';
import { getFlowGenericMetrics } from '../api/routes';
import { Config, defaultConfig } from '../model/config';
import {
  DisabledFilters,
  Filter,
  Filters,
  filtersEqual,
  getDisabledFiltersRecord,
  getEnabledFilters,
  hasIndexFields,
  hasNonIndexFields
} from '../model/filters';
import {
  filtersToString,
  FlowQuery,
  FlowScope,
  isTimeMetric,
  Match,
  StatFunction,
  MetricType,
  PacketLoss,
  RecordType,
  MetricFunction
} from '../model/flow-query';
import { MetricScopeOptions } from '../model/metrics';
import { parseQuickFilters } from '../model/quick-filters';
import {
  DefaultOptions,
  getAvailableGroups,
  GraphElementPeer,
  TopologyGroupTypes,
  TopologyOptions
} from '../model/topology';
import { getFetchFunctions as getBackAndForthFetch } from '../utils/back-and-forth';
import { Column, ColumnsId, ColumnSizeMap, getDefaultColumns } from '../utils/columns';
import { loadConfig, loadMaxChunkAge } from '../utils/config';
import { ContextSingleton } from '../utils/context';
import { computeStepInterval, getTimeRangeOptions, TimeRange } from '../utils/datetime';
import { formatDuration, getDateMsInSeconds, getDateSInMiliseconds, parseDuration } from '../utils/duration';
import { getHTTPErrorDetails } from '../utils/errors';
import { exportToPng } from '../utils/export';
import { mergeFlowReporters } from '../utils/flows';
import { useK8sModelsWithColors } from '../utils/k8s-models-hook';
import {
  LOCAL_STORAGE_COLS_KEY,
  LOCAL_STORAGE_COLS_SIZES_KEY,
  LOCAL_STORAGE_DISABLED_FILTERS_KEY,
  LOCAL_STORAGE_LAST_LIMIT_KEY,
  LOCAL_STORAGE_LAST_TOP_KEY,
  LOCAL_STORAGE_METRIC_FUNCTION_KEY,
  LOCAL_STORAGE_METRIC_SCOPE_KEY,
  LOCAL_STORAGE_METRIC_TYPE_KEY,
  LOCAL_STORAGE_OVERVIEW_IDS_KEY,
  LOCAL_STORAGE_OVERVIEW_TRUNCATE_KEY,
  LOCAL_STORAGE_QUERY_PARAMS_KEY,
  LOCAL_STORAGE_REFRESH_KEY,
  LOCAL_STORAGE_SHOW_HISTOGRAM_KEY,
  LOCAL_STORAGE_SHOW_OPTIONS_KEY,
  LOCAL_STORAGE_SIZE_KEY,
  LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
  LOCAL_STORAGE_VIEW_ID_KEY,
  useLocalStorage,
  getLocalStorage,
  LOCAL_STORAGE_OVERVIEW_FOCUS_KEY,
  DEFAULT_ARRAY_SELECTION_OPTIONS
} from '../utils/local-storage-hook';
import { mergeStats } from '../utils/metrics';
import {
  CUSTOM_PANEL_MATCHER,
  DNS_ID_MATCHER,
  DROPPED_ID_MATCHER,
  getDefaultOverviewPanels,
  OverviewPanel,
  parseCustomMetricId,
  RTT_ID_MATCHER
} from '../utils/overview-panels';
import { usePoll } from '../utils/poll-hook';
import {
  defaultMetricFunction,
  defaultMetricType,
  defaultTimeRange,
  getFiltersFromURL,
  getLimitFromURL,
  getMatchFromURL,
  getPacketLossFromURL,
  getRangeFromURL,
  getRecordTypeFromURL,
  getShowDupFromURL,
  setURLFilters,
  setURLLimit,
  setURLMatch,
  setURLMetricFunction,
  setURLMetricType,
  setURLPacketLoss,
  setURLRange,
  setURLRecortType,
  setURLShowDup
} from '../utils/router';
import { useTheme } from '../utils/theme-hook';
import { getURLParams, hasEmptyParams, netflowTrafficPath, removeURLParam, setURLParams, URLParam } from '../utils/url';
import { RATE_METRIC_FUNCTIONS, TIME_METRIC_FUNCTIONS } from './dropdowns/metric-function-dropdown';
import { OverviewDisplayDropdown } from './dropdowns/overview-display-dropdown';
import { LIMIT_VALUES, TOP_VALUES } from './dropdowns/query-options-dropdown';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import { Size, TableDisplayDropdown } from './dropdowns/table-display-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { TopologyDisplayDropdown } from './dropdowns/topology-display-dropdown';
import { TruncateLength } from './dropdowns/truncate-dropdown';
import { navigate } from './dynamic-loader/dynamic-loader';
import { FiltersToolbar } from './filters/filters-toolbar';
import GuidedTourPopover, { GuidedTourHandle } from './guided-tour/guided-tour';
import HistogramContainer from './metrics/histogram';
import { ColumnsModal } from './modals/columns-modal';
import { ExportModal } from './modals/export-modal';
import OverviewPanelsModal from './modals/overview-panels-modal';
import TimeRangeModal from './modals/time-range-modal';
import NetflowOverview from './netflow-overview/netflow-overview';
import { RecordPanel } from './netflow-record/record-panel';
import NetflowTable from './netflow-table/netflow-table';
import ElementPanel from './netflow-topology/element-panel';
import NetflowTopology from './netflow-topology/netflow-topology';
import './netflow-traffic.css';
import { LinksOverflow } from './overflow/links-overflow';
import { getFilterDefinitions } from '../utils/filter-definitions';
import FlowsQuerySummary from './query-summary/flows-query-summary';
import MetricsQuerySummary from './query-summary/metrics-query-summary';
import SummaryPanel from './query-summary/summary-panel';
import { SearchComponent, SearchEvent, SearchHandle } from './search/search';

export type ViewId = 'overview' | 'table' | 'topology';

export type NetflowTrafficProps = {
  forcedFilters?: Filters | null;
  isTab?: boolean;
  parentConfig?: Config;
};

export const NetflowTraffic: React.FC<NetflowTrafficProps> = ({ forcedFilters, isTab, parentConfig }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  const k8sModels = useK8sModelsWithColors();
  //set context from extensions. Standalone will return a "dummy" flag
  ContextSingleton.setContext(extensions);
  //observe html class list
  const isDarkTheme = useTheme();

  const [queryParams, setQueryParams] = useLocalStorage<string>(LOCAL_STORAGE_QUERY_PARAMS_KEY);
  const [disabledFilters, setDisabledFilters] = useLocalStorage<DisabledFilters>(
    LOCAL_STORAGE_DISABLED_FILTERS_KEY,
    {}
  );
  // set url params from local storage saved items at startup if empty
  if (hasEmptyParams() && queryParams) {
    setURLParams(queryParams);
  }

  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const [maxChunkAge, setMaxChunkAge] = React.useState<number>(NaN);
  const [warningMessage, setWarningMessage] = React.useState<string | undefined>();
  const [showViewOptions, setShowViewOptions] = useLocalStorage<boolean>(LOCAL_STORAGE_SHOW_OPTIONS_KEY, false);
  const [showHistogram, setShowHistogram] = useLocalStorage<boolean>(LOCAL_STORAGE_SHOW_HISTOGRAM_KEY, false);
  const [isViewOptionOverflowMenuOpen, setViewOptionOverflowMenuOpen] = React.useState(false);
  const [isFullScreen, setFullScreen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [flows, setFlows] = React.useState<Record[]>([]);
  const [stats, setStats] = React.useState<Stats | undefined>(undefined);
  const [overviewTruncateLength, setOverviewTruncateLength] = useLocalStorage<TruncateLength>(
    LOCAL_STORAGE_OVERVIEW_TRUNCATE_KEY,
    TruncateLength.M
  );
  const [overviewFocus, setOverviewFocus] = useLocalStorage<boolean>(LOCAL_STORAGE_OVERVIEW_FOCUS_KEY, false);
  const [topologyOptions, setTopologyOptions] = useLocalStorage<TopologyOptions>(
    LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
    DefaultOptions
  );
  const [metrics, setMetrics] = React.useState<NetflowMetrics>(defaultNetflowMetrics);
  const metricsRef = React.useRef(metrics);
  const [isShowQuerySummary, setShowQuerySummary] = React.useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | undefined>(undefined);
  const [lastDuration, setLastDuration] = React.useState<number | undefined>(undefined);
  const [error, setError] = React.useState<string | undefined>();
  const [size, setSize] = useLocalStorage<Size>(LOCAL_STORAGE_SIZE_KEY, 'm');
  const [isTRModalOpen, setTRModalOpen] = React.useState(false);
  const [isOverviewModalOpen, setOverviewModalOpen] = React.useState(false);
  const [isColModalOpen, setColModalOpen] = React.useState(false);
  const [isExportModalOpen, setExportModalOpen] = React.useState(false);
  const [selectedViewId, setSelectedViewId] = useLocalStorage<ViewId>(LOCAL_STORAGE_VIEW_ID_KEY, 'overview');
  const [filters, setFilters] = React.useState<Filters>({ list: [], backAndForth: false });
  const [match, setMatch] = React.useState<Match>(getMatchFromURL());
  const [packetLoss, setPacketLoss] = React.useState<PacketLoss>(getPacketLossFromURL());
  const [recordType, setRecordType] = React.useState<RecordType>(getRecordTypeFromURL());
  const [showDuplicates, setShowDuplicates] = React.useState<boolean>(getShowDupFromURL());
  const [limit, setLimit] = React.useState<number>(
    getLimitFromURL(selectedViewId === 'table' ? LIMIT_VALUES[0] : TOP_VALUES[0])
  );
  const [lastLimit, setLastLimit] = useLocalStorage<number>(LOCAL_STORAGE_LAST_LIMIT_KEY, LIMIT_VALUES[0]);
  const [lastTop, setLastTop] = useLocalStorage<number>(LOCAL_STORAGE_LAST_TOP_KEY, TOP_VALUES[0]);
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [histogramRange, setHistogramRange] = React.useState<TimeRange>();
  const [metricScope, setMetricScope] = useLocalStorage<FlowScope>(LOCAL_STORAGE_METRIC_SCOPE_KEY, 'namespace');
  const [topologyMetricFunction, setTopologyMetricFunction] = useLocalStorage<StatFunction>(
    LOCAL_STORAGE_METRIC_FUNCTION_KEY,
    defaultMetricFunction
  );
  const [topologyMetricType, setTopologyMetricType] = useLocalStorage<MetricType>(
    LOCAL_STORAGE_METRIC_TYPE_KEY,
    defaultMetricType
  );
  const [interval, setInterval] = useLocalStorage<number | undefined>(LOCAL_STORAGE_REFRESH_KEY);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);
  const [selectedElement, setSelectedElement] = React.useState<GraphElementPeer | undefined>(undefined);
  const searchRef = React.useRef<SearchHandle>(null);
  const [searchEvent, setSearchEvent] = React.useState<SearchEvent | undefined>(undefined);
  const guidedTourRef = React.useRef<GuidedTourHandle>(null);

  //use this ref to list any props / content loading state & events to skip tick function
  const initState = React.useRef<
    Array<
      'initDone' | 'configLoading' | 'configLoaded' | 'maxChunkAgeLoading' | 'maxChunkAgeLoaded' | 'forcedFiltersLoaded'
    >
  >([]);
  const [panels, setPanels] = useLocalStorage<OverviewPanel[]>(
    LOCAL_STORAGE_OVERVIEW_IDS_KEY,
    [],
    DEFAULT_ARRAY_SELECTION_OPTIONS
  );

  const [columns, setColumns] = useLocalStorage<Column[]>(LOCAL_STORAGE_COLS_KEY, [], DEFAULT_ARRAY_SELECTION_OPTIONS);
  const [columnSizes, setColumnSizes] = useLocalStorage<ColumnSizeMap>(LOCAL_STORAGE_COLS_SIZES_KEY, {});

  const isFlow = React.useCallback(() => {
    return config.recordTypes.some(rt => rt === 'flowLog');
  }, [config.recordTypes]);

  const isConnectionTracking = React.useCallback(() => {
    return config.recordTypes.some(rt => rt === 'newConnection' || rt === 'heartbeat' || rt === 'endConnection');
  }, [config.recordTypes]);

  const isDNSTracking = React.useCallback(() => {
    return config.features.includes('dnsTracking');
  }, [config.features]);

  const isFlowRTT = React.useCallback(() => {
    return config.features.includes('flowRTT');
  }, [config.features]);

  const isPktDrop = React.useCallback(() => {
    return config.features.includes('pktDrop');
  }, [config.features]);

  const isMultiCluster = React.useCallback(() => {
    return config.features.includes('multiCluster');
  }, [config.features]);

  const isZones = React.useCallback(() => {
    return config.features.includes('zones');
  }, [config.features]);

  const getAvailablePanels = React.useCallback(() => {
    return panels.filter(
      panel =>
        (isPktDrop() || !panel.id.includes(DROPPED_ID_MATCHER)) &&
        (isDNSTracking() || !panel.id.includes(DNS_ID_MATCHER)) &&
        (isFlowRTT() || !panel.id.includes(RTT_ID_MATCHER))
    );
  }, [isDNSTracking, isFlowRTT, isPktDrop, panels]);

  const getSelectedPanels = React.useCallback(() => {
    return getAvailablePanels().filter(panel => panel.isSelected);
  }, [getAvailablePanels]);

  const getAvailableColumns = React.useCallback(
    (isSidePanel = false) => {
      return columns.filter(
        col =>
          (!isSidePanel || !col.isCommon) &&
          (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
          (!col.feature || config.features.includes(col.feature))
      );
    },
    [columns, config.features, isConnectionTracking]
  );

  const getSelectedColumns = React.useCallback(() => {
    return getAvailableColumns().filter(column => column.isSelected);
  }, [getAvailableColumns]);

  const updateTopologyMetricType = React.useCallback(
    (metricType: MetricType) => {
      if (isTimeMetric(metricType)) {
        // fallback on average if current function not available for time queries
        if (!TIME_METRIC_FUNCTIONS.includes(topologyMetricFunction)) {
          setTopologyMetricFunction('avg');
        }
      } else {
        // fallback on average if current function not available for rate queries
        if (!RATE_METRIC_FUNCTIONS.includes(topologyMetricFunction)) {
          setTopologyMetricFunction('avg');
        }
      }
      setTopologyMetricType(metricType);
    },
    [topologyMetricFunction, setTopologyMetricFunction, setTopologyMetricType]
  );

  const getFilterDefs = React.useCallback(() => {
    return getFilterDefinitions(config.filters, config.columns, t).filter(
      fd =>
        (isMultiCluster() || fd.id !== 'cluster_name') &&
        (isZones() || !fd.id.endsWith('_zone')) &&
        (isConnectionTracking() || fd.id !== 'id') &&
        (isDNSTracking() || !fd.id.startsWith('dns_')) &&
        (isPktDrop() || !fd.id.startsWith('pkt_drop_')) &&
        (isFlowRTT() || fd.id !== 'time_flow_rtt')
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.columns, config.filters]);

  const getQuickFilters = React.useCallback(
    (c = config) => {
      return parseQuickFilters(getFilterDefs(), c.quickFilters);
    },
    [config, getFilterDefs]
  );

  const getDefaultFilters = React.useCallback(
    (c = config) => {
      const quickFilters = getQuickFilters(c);
      return quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
    },
    [config, getQuickFilters]
  );

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
  }, [metrics.dnsLatencyMetrics, topologyMetricFunction, topologyMetricType, metrics.rateMetrics, metrics.rttMetrics]);

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

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = React.useCallback(
    (f: Filters) => {
      setFilters(f);
      setFlows([]);
      setMetrics(defaultNetflowMetrics);
      setWarningMessage(undefined);
    },
    [setFilters, setFlows]
  );

  const backAndForth = filters.backAndForth;
  const resetDefaultFilters = React.useCallback(
    (c = config) => {
      const def = getDefaultFilters(c);
      updateTableFilters({ backAndForth, list: def });
    },
    [config, backAndForth, getDefaultFilters, updateTableFilters]
  );

  const setFiltersFromURL = React.useCallback(
    (config: Config) => {
      if (forcedFilters === null) {
        //set filters from url or freshly loaded quick filters defaults
        const filtersPromise = getFiltersFromURL(getFilterDefs(), disabledFilters);
        if (filtersPromise) {
          filtersPromise.then(updateTableFilters);
        } else {
          resetDefaultFilters(config);
        }
      }
    },
    [disabledFilters, forcedFilters, getFilterDefs, resetDefaultFilters, updateTableFilters]
  );

  const clearSelections = () => {
    setTRModalOpen(false);
    setOverviewModalOpen(false);
    setColModalOpen(false);
    setSelectedRecord(undefined);
    setShowQuerySummary(false);
    setSelectedElement(undefined);
  };

  const selectView = (view: ViewId) => {
    clearSelections();
    //save / restore top / limit parameter according to selected view
    if (view === 'overview' && selectedViewId !== 'overview') {
      setLastLimit(limit);
      setLimit(lastTop);
    } else if (view !== 'overview' && selectedViewId === 'overview') {
      setLastTop(limit);
      setLimit(lastLimit);
    }

    if (view !== selectedViewId) {
      setFlows([]);
      setMetrics(defaultNetflowMetrics);
    }
    setSelectedViewId(view);
  };

  const onRecordSelect = React.useCallback((record?: Record) => {
    clearSelections();
    setSelectedRecord(record);
  }, []);

  const onElementSelect = React.useCallback((element?: GraphElementPeer) => {
    clearSelections();
    setSelectedElement(element);
  }, []);

  const onToggleQuerySummary = React.useCallback((v: boolean) => {
    clearSelections();
    setShowQuerySummary(v);
  }, []);

  const buildFlowQuery = React.useCallback((): FlowQuery => {
    const enabledFilters = getEnabledFilters(forcedFilters || filters);
    const query: FlowQuery = {
      filters: filtersToString(enabledFilters.list, match === 'any'),
      limit: LIMIT_VALUES.includes(limit) ? limit : LIMIT_VALUES[0],
      recordType: recordType,
      //only manage duplicates when mark is enabled
      dedup: config.deduper.mark && !showDuplicates,
      packetLoss: packetLoss
    };
    if (range) {
      if (typeof range === 'number') {
        query.timeRange = range;
      } else if (typeof range === 'object') {
        query.startTime = range.from.toString();
        query.endTime = range.to.toString();
      }

      const info = computeStepInterval(range);
      query.rateInterval = `${info.rateIntervalSeconds}s`;
      query.step = `${info.stepSeconds}s`;
    }
    if (selectedViewId === 'table') {
      query.type = 'Flows';
    } else {
      query.aggregateBy = metricScope;
      if (selectedViewId === 'topology') {
        query.type = topologyMetricType;
        query.groups = topologyOptions.groupTypes !== TopologyGroupTypes.NONE ? topologyOptions.groupTypes : undefined;
      } else if (selectedViewId === 'overview') {
        query.limit = TOP_VALUES.includes(limit) ? limit : TOP_VALUES[0];
        query.groups = undefined;
      }
    }
    return query;
  }, [
    forcedFilters,
    filters,
    match,
    limit,
    recordType,
    config.deduper.mark,
    showDuplicates,
    packetLoss,
    range,
    selectedViewId,
    topologyMetricType,
    metricScope,
    topologyOptions.groupTypes
  ]);

  const getFetchFunctions = React.useCallback(() => {
    // check back-and-forth
    const enabledFilters = getEnabledFilters(forcedFilters || filters);
    const matchAny = match === 'any';
    return getBackAndForthFetch(getFilterDefs(), enabledFilters, matchAny);
  }, [forcedFilters, filters, match, getFilterDefs]);

  const manageWarnings = React.useCallback(
    (query: Promise<unknown>) => {
      setLastRefresh(undefined);
      setLastDuration(undefined);
      setWarningMessage(undefined);
      Promise.race([query, new Promise((resolve, reject) => setTimeout(reject, 4000, 'slow'))]).then(
        null,
        (reason: string) => {
          if (reason === 'slow') {
            setWarningMessage(`${t('Query is slow')}`);
          }
        }
      );
    },
    // i18n t dependency kills jest
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const fetchTable = React.useCallback(
    (fq: FlowQuery) => {
      if (!showHistogram) {
        setMetrics(defaultNetflowMetrics);
      }

      let currentMetrics = metricsRef.current;
      const { getRecords, getMetrics } = getFetchFunctions();

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
    [getFetchFunctions, histogramRange, showHistogram, showDuplicates, range]
  );

  const fetchOverview = React.useCallback(
    (fq: FlowQuery) => {
      setFlows([]);

      let currentMetrics = metricsRef.current;
      const selectedPanels = getSelectedPanels();
      const { getMetrics } = getFetchFunctions();

      const promises: Promise<Stats>[] = [];

      const ratePanels = selectedPanels.filter(p => p.id.endsWith('_rates'));
      const totalDroppedPanels = selectedPanels.filter(p => p.id.startsWith('dropped_'));
      if (!_.isEmpty(ratePanels) || !_.isEmpty(totalDroppedPanels)) {
        if (!_.isEmpty(ratePanels)) {
          //run queries for bytes / packets rates
          const rateMetrics = initRateMetricKeys(ratePanels.map(p => p.id)) as RateMetrics;
          (Object.keys(rateMetrics) as (keyof typeof rateMetrics)[]).map(key => {
            promises.push(
              getMetrics({ ...fq, function: 'rate', type: key === 'bytes' ? 'Bytes' : 'Packets' }, range).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                rateMetrics[key] = res.metrics;
                currentMetrics = { ...currentMetrics, rateMetrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });
        }
        //run queries for total bytes / packets rates
        const totalRateMetric = initRateMetricKeys(
          [...ratePanels, ...totalDroppedPanels].map(p => p.id)
        ) as TotalRateMetrics;
        (Object.keys(totalRateMetric) as (keyof typeof totalRateMetric)[]).map(key => {
          promises.push(
            getMetrics(
              { ...fq, function: 'rate', aggregateBy: 'app', type: key === 'bytes' ? 'Bytes' : 'Packets' },
              range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalRateMetric[key] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalRateMetric };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });
      } else {
        currentMetrics = { ...currentMetrics, rateMetrics: undefined, totalRateMetric: undefined };
        setMetrics(currentMetrics);
      }

      const droppedPanels = selectedPanels.filter(p => p.id.includes(DROPPED_ID_MATCHER));
      if (!_.isEmpty(droppedPanels)) {
        //run same queries for drops
        const droppedRateMetrics = initRateMetricKeys(droppedPanels.map(p => p.id)) as RateMetrics;
        (Object.keys(droppedRateMetrics) as (keyof typeof droppedRateMetrics)[]).map(key => {
          promises.push(
            getMetrics(
              { ...fq, function: 'rate', type: key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets' },
              range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              droppedRateMetrics[key] = res.metrics;
              currentMetrics = { ...currentMetrics, droppedRateMetrics };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        const totalDroppedRateMetric = initRateMetricKeys(droppedPanels.map(p => p.id)) as TotalRateMetrics;
        (Object.keys(totalDroppedRateMetric) as (keyof typeof totalDroppedRateMetric)[]).map(key => {
          promises.push(
            getMetrics(
              {
                ...fq,
                function: 'rate',
                aggregateBy: 'app',
                type: key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets'
              },
              range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalDroppedRateMetric[key] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalDroppedRateMetric };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        //get drop state & cause
        promises.push(
          ...[
            getFlowGenericMetrics(
              { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestState' },
              range
            ).then(res => {
              currentMetrics = { ...currentMetrics, droppedStateMetrics: res.metrics };
              setMetrics(currentMetrics);
              return res.stats;
            }),
            getFlowGenericMetrics(
              { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestDropCause' },
              range
            ).then(res => {
              currentMetrics = { ...currentMetrics, droppedCauseMetrics: res.metrics };
              setMetrics(currentMetrics);
              return res.stats;
            })
          ]
        );
      } else {
        setMetrics({
          ...currentMetrics,
          droppedRateMetrics: undefined,
          totalDroppedRateMetric: undefined,
          droppedStateMetrics: undefined,
          droppedCauseMetrics: undefined
        });
      }

      const dnsPanels = selectedPanels.filter(p => p.id.includes(DNS_ID_MATCHER));
      if (config.features.includes('dnsTracking') && !_.isEmpty(dnsPanels)) {
        //set dns metrics
        const dnsLatencyMetrics = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as FunctionMetrics;
        (Object.keys(dnsLatencyMetrics) as (keyof typeof dnsLatencyMetrics)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, type: 'DnsLatencyMs' }, range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              dnsLatencyMetrics[fn] = res.metrics;
              currentMetrics = { ...currentMetrics, dnsLatencyMetrics };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        const totalDnsLatencyMetric = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as TotalFunctionMetrics;
        (Object.keys(totalDnsLatencyMetric) as (keyof typeof totalDnsLatencyMetric)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'DnsLatencyMs' }, range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalDnsLatencyMetric[fn] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalDnsLatencyMetric };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        //set rcode metrics
        if (dnsPanels.some(p => p.id.includes('rcode_dns_latency_flows'))) {
          promises.push(
            ...[
              //get dns response codes
              getFlowGenericMetrics(
                { ...fq, aggregateBy: 'DnsFlagsResponseCode', function: 'count', type: 'DnsFlows' },
                range
              ).then(res => {
                currentMetrics = { ...currentMetrics, dnsRCodeMetrics: res.metrics };
                setMetrics(currentMetrics);
                return res.stats;
              }),
              getFlowGenericMetrics({ ...fq, aggregateBy: 'app', function: 'count', type: 'DnsFlows' }, range).then(
                res => {
                  currentMetrics = { ...currentMetrics, totalDnsCountMetric: res.metrics[0] };
                  setMetrics(currentMetrics);
                  return res.stats;
                }
              )
            ]
          );
        }
      } else {
        setMetrics({
          ...currentMetrics,
          dnsLatencyMetrics: undefined,
          dnsRCodeMetrics: undefined,
          totalDnsLatencyMetric: undefined,
          totalDnsCountMetric: undefined
        });
      }

      const rttPanels = selectedPanels.filter(p => p.id.includes(RTT_ID_MATCHER));
      if (config.features.includes('flowRTT') && !_.isEmpty(rttPanels)) {
        //set RTT metrics
        const rttMetrics = initFunctionMetricKeys(rttPanels.map(p => p.id)) as FunctionMetrics;
        (Object.keys(rttMetrics) as (keyof typeof rttMetrics)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, type: 'TimeFlowRttNs' }, range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              rttMetrics[fn] = res.metrics;
              currentMetrics = { ...currentMetrics, rttMetrics };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        const totalRttMetric = initFunctionMetricKeys(rttPanels.map(p => p.id)) as TotalFunctionMetrics;
        (Object.keys(totalRttMetric) as (keyof typeof totalRttMetric)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'TimeFlowRttNs' }, range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalRttMetric[fn] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalRttMetric };
              setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });
      } else {
        setMetrics({ ...currentMetrics, rttMetrics: undefined, totalRttMetric: undefined });
      }

      const customPanels = selectedPanels.filter(p => p.id.startsWith(CUSTOM_PANEL_MATCHER));
      if (!_.isEmpty(customPanels)) {
        //set custom metrics
        customPanels
          .map(p => p.id)
          .forEach(id => {
            const parsedId = parseCustomMetricId(id);
            const key = id.replaceAll(CUSTOM_PANEL_MATCHER + '_', '');
            const getMetricFunc = parsedId.aggregateBy ? getFlowGenericMetrics : getMetrics;
            if (parsedId.isValid) {
              promises.push(
                ...[
                  getMetricFunc(
                    {
                      ...fq,
                      type: parsedId.type,
                      function: parsedId.fn,
                      aggregateBy: parsedId.aggregateBy || metricScope
                    },
                    range
                  ).then(res => {
                    //set matching value and apply changes on the entire object to trigger refresh
                    currentMetrics = {
                      ...currentMetrics,
                      customMetrics: currentMetrics.customMetrics.set(key, res.metrics)
                    };
                    setMetrics(currentMetrics);
                    return res.stats;
                  }),
                  getMetricFunc(
                    {
                      ...fq,
                      type: parsedId.type,
                      function: parsedId.fn,
                      aggregateBy: 'app'
                    },
                    range
                  ).then(res => {
                    //set matching value and apply changes on the entire object to trigger refresh
                    currentMetrics = {
                      ...currentMetrics,
                      totalCustomMetrics: currentMetrics.totalCustomMetrics.set(key, res.metrics[0])
                    };
                    setMetrics(currentMetrics);
                    return res.stats;
                  })
                ]
              );
            }
          });
      }

      return Promise.all(promises);
    },
    [getSelectedPanels, getFetchFunctions, config.features, range, metricScope]
  );

  const fetchTopology = React.useCallback(
    (fq: FlowQuery) => {
      setFlows([]);

      const droppedType = config.features.includes('pktDrop')
        ? fq.type === 'Bytes'
          ? 'PktDropBytes'
          : fq.type === 'Packets'
          ? 'PktDropPackets'
          : undefined
        : undefined;
      let currentMetrics = metricsRef.current;
      const { getMetrics } = getFetchFunctions();

      const promises: Promise<Stats>[] = [
        getMetrics(
          {
            ...fq,
            function: isTimeMetric(topologyMetricType) ? (topologyMetricFunction as MetricFunction) : 'rate'
          },
          range
        ).then(res => {
          if (['Bytes', 'Packets'].includes(topologyMetricType)) {
            const rateMetrics = {} as RateMetrics;
            rateMetrics[getRateMetricKey(topologyMetricType)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics, dnsLatencyMetrics: undefined, rttMetrics: undefined };
            setMetrics(currentMetrics);
          } else if (['PktDropBytes', 'PktDropPackets'].includes(topologyMetricType)) {
            const droppedRateMetrics = {} as RateMetrics;
            droppedRateMetrics[getRateMetricKey(topologyMetricType)] = res.metrics;
            currentMetrics = { ...currentMetrics, droppedRateMetrics };
            setMetrics(currentMetrics);
          } else if (['DnsLatencyMs'].includes(topologyMetricType)) {
            const dnsLatencyMetrics = {} as FunctionMetrics;
            dnsLatencyMetrics[getFunctionMetricKey(topologyMetricFunction)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics, rttMetrics: undefined };
            setMetrics(currentMetrics);
          } else if (['TimeFlowRttNs'].includes(topologyMetricType)) {
            const rttMetrics = {} as FunctionMetrics;
            rttMetrics[getFunctionMetricKey(topologyMetricFunction)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics: undefined, rttMetrics };
            setMetrics(currentMetrics);
          }
          return res.stats;
        })
      ];

      if (droppedType) {
        promises.push(
          getMetrics({ ...fq, type: droppedType }, range).then(res => {
            const droppedRateMetrics = {} as RateMetrics;
            droppedRateMetrics[getRateMetricKey(topologyMetricType)] = res.metrics;
            currentMetrics = { ...currentMetrics, droppedRateMetrics };
            setMetrics(currentMetrics);
            return res.stats;
          })
        );
      } else if (!['PktDropBytes', 'PktDropPackets'].includes(topologyMetricType)) {
        currentMetrics = { ...currentMetrics, droppedRateMetrics: undefined };
        setMetrics(currentMetrics);
      }
      return Promise.all(promises);
    },
    [config.features, getFetchFunctions, topologyMetricType, topologyMetricFunction, range]
  );

  const tick = React.useCallback(() => {
    // skip tick while forcedFilters & config are not loaded
    // this check ensure tick will not be called during init
    // as it's difficult to manage react state changes
    if (!initState.current.includes('forcedFiltersLoaded') || !initState.current.includes('configLoaded')) {
      console.error('tick skipped', initState.current);
      return;
    } else if (isTRModalOpen || isOverviewModalOpen || isColModalOpen || isExportModalOpen) {
      // also skip tick if modal is open
      console.debug('tick skipped since modal is open');
      return;
    }

    setLoading(true);
    setError(undefined);
    const fq = buildFlowQuery();

    let promises: Promise<Stats[]> | undefined = undefined;
    switch (selectedViewId) {
      case 'table':
        promises = fetchTable(fq);
        break;
      case 'overview':
        promises = fetchOverview(fq);
        break;
      case 'topology':
        promises = fetchTopology(fq);
        break;
      default:
        console.error('tick called on not implemented view Id', selectedViewId);
        setLoading(false);
        break;
    }
    if (promises) {
      const startDate = new Date();
      setStats(undefined);
      manageWarnings(
        promises
          .then(allStats => {
            const stats = allStats.reduce(mergeStats, undefined);
            setStats(stats);
          })
          .catch(err => {
            setFlows([]);
            setMetrics(defaultNetflowMetrics);
            setError(getHTTPErrorDetails(err));
            setWarningMessage(undefined);
          })
          .finally(() => {
            const endDate = new Date();
            setLoading(false);
            setLastRefresh(endDate);
            setLastDuration(endDate.getTime() - startDate.getTime());
          })
      );
    }
  }, [
    isTRModalOpen,
    isOverviewModalOpen,
    isColModalOpen,
    isExportModalOpen,
    buildFlowQuery,
    selectedViewId,
    fetchTable,
    fetchOverview,
    fetchTopology,
    manageWarnings
  ]);

  usePoll(tick, interval);

  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      if (recordType === 'flowLog' && !isFlow() && isConnectionTracking()) {
        setRecordType('allConnections');
      } else if (recordType === 'allConnections' && isFlow() && !isConnectionTracking()) {
        setRecordType('flowLog');
      }
    }
  }, [config.recordTypes, isConnectionTracking, isFlow, recordType]);

  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      setColumns(
        getLocalStorage(
          LOCAL_STORAGE_COLS_KEY,
          getDefaultColumns(config.columns, config.fields),
          DEFAULT_ARRAY_SELECTION_OPTIONS
        )
      );
      setPanels(
        getLocalStorage(
          LOCAL_STORAGE_OVERVIEW_IDS_KEY,
          getDefaultOverviewPanels(config.panels),
          DEFAULT_ARRAY_SELECTION_OPTIONS
        )
      );
      setFiltersFromURL(config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // tick on state change
  React.useEffect(() => {
    // init function will be triggered only once
    if (!initState.current.includes('initDone')) {
      initState.current.push('initDone');

      if (parentConfig) {
        initState.current.push('configLoaded');
        setConfig(parentConfig);
      } else {
        // load config only once and track its state
        if (!initState.current.includes('configLoading')) {
          initState.current.push('configLoading');
          loadConfig().then(v => {
            initState.current.push('configLoaded');
            setConfig(v);
          });
        }
      }

      // load max chunk age separately since it's a specific loki config
      if (!initState.current.includes('maxChunkAgeLoading')) {
        initState.current.push('maxChunkAgeLoading');
        loadMaxChunkAge().then(v => {
          initState.current.push('maxChunkAgeLoaded');
          setMaxChunkAge(v);
        });
      }

      // init will trigger this useEffect update loop as soon as config is loaded
      return;
    }

    if (!initState.current.includes('forcedFiltersLoaded') && forcedFilters !== undefined) {
      initState.current.push('forcedFiltersLoaded');
      //in case forcedFilters are null, we only track config update
      if (forcedFilters === null) {
        return;
      }
    }

    tick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forcedFilters, config, tick, setConfig]);

  // Rewrite URL params on state change
  React.useEffect(() => {
    //with forced filters in url if specified
    if (forcedFilters) {
      setURLFilters(forcedFilters!, true);
    } else if (!_.isEmpty(filters) && !_.isEmpty(filters.list)) {
      //write filters in url if not empty
      setURLFilters(filters, !initState.current.includes('configLoaded'));
    }
  }, [filters, forcedFilters]);
  React.useEffect(() => {
    setURLRange(range, !initState.current.includes('configLoaded'));
  }, [range]);
  React.useEffect(() => {
    setURLLimit(limit, !initState.current.includes('configLoaded'));
  }, [limit]);
  React.useEffect(() => {
    setURLMatch(match, !initState.current.includes('configLoaded'));
  }, [match]);
  React.useEffect(() => {
    if (config.deduper.mark) {
      setURLShowDup(showDuplicates, !initState.current.includes('configLoaded'));
    } else {
      removeURLParam(URLParam.ShowDuplicates);
    }
  }, [config.deduper.mark, showDuplicates]);
  React.useEffect(() => {
    setURLMetricFunction(
      selectedViewId === 'topology' ? topologyMetricFunction : undefined,
      !initState.current.includes('configLoaded')
    );
    setURLMetricType(
      selectedViewId === 'topology' ? topologyMetricType : undefined,
      !initState.current.includes('configLoaded')
    );
  }, [topologyMetricFunction, selectedViewId, topologyMetricType]);
  React.useEffect(() => {
    setURLPacketLoss(packetLoss);
  }, [packetLoss]);
  React.useEffect(() => {
    setURLRecortType(recordType, !initState.current.includes('configLoaded'));
  }, [recordType]);

  // update local storage saved query params
  React.useEffect(() => {
    if (!forcedFilters) {
      setQueryParams(getURLParams().toString());
    }
  }, [
    filters,
    range,
    limit,
    match,
    showDuplicates,
    topologyMetricFunction,
    topologyMetricType,
    setQueryParams,
    forcedFilters
  ]);

  // update local storage enabled filters
  React.useEffect(() => {
    setDisabledFilters(getDisabledFiltersRecord(filters.list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  //invalidate groups if necessary, when metrics scope changed
  React.useEffect(() => {
    const groups = getAvailableGroups(metricScope as MetricScopeOptions);
    if (!groups.includes(topologyOptions.groupTypes)) {
      setTopologyOptions({ ...topologyOptions, groupTypes: TopologyGroupTypes.NONE });
    }
  }, [metricScope, topologyOptions, setTopologyOptions]);

  const clearFilters = React.useCallback(() => {
    if (forcedFilters) {
      navigate(netflowTrafficPath);
    } else if (filters) {
      //set URL Param to empty value to be able to restore state coming from another page
      const empty: Filters = { ...filters, list: [] };
      setURLFilters(empty);
      updateTableFilters(empty);
    }
  }, [forcedFilters, filters, updateTableFilters]);

  const setFiltersList = React.useCallback(
    (list: Filter[]) => {
      setFilters({ ...filters, list: list });
    },
    [setFilters, filters]
  );

  const viewTabs = () => {
    return (
      <Tabs
        className={`netflow-traffic-tabs ${isDarkTheme ? 'dark' : 'light'}`}
        usePageInsets
        activeKey={selectedViewId}
        onSelect={(event, eventkey) => selectView(eventkey as ViewId)}
        role="region"
      >
        <Tab className="overviewTabButton" eventKey={'overview'} title={<TabTitleText>{t('Overview')}</TabTitleText>} />
        <Tab className="tableTabButton" eventKey={'table'} title={<TabTitleText>{t('Traffic flows')}</TabTitleText>} />
        <Tab className="topologyTabButton" eventKey={'topology'} title={<TabTitleText>{t('Topology')}</TabTitleText>} />
      </Tabs>
    );
  };

  const onTopologyExport = () => {
    const topology_flex = document.getElementsByClassName('pf-topology-visualization-surface__svg')[0];
    exportToPng('topology', topology_flex as HTMLElement, isDarkTheme);
  };

  const onOverviewExport = () => {
    const prevFocusState = overviewFocus;
    setOverviewFocus(false);
    setTimeout(() => {
      const overview_flex = document.getElementById('overview-flex');
      exportToPng('overview_page', overview_flex as HTMLElement, isDarkTheme, undefined, () =>
        setOverviewFocus(prevFocusState)
      );
    }, 500);
  };

  const viewOptionsContent = () => {
    const items: JSX.Element[] = [];

    if (selectedViewId === 'overview') {
      items.push(
        <OverflowMenuItem key="panels">
          <Button
            data-test="manage-overview-panels-button"
            id="manage-overview-panels-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => setOverviewModalOpen(true)}
          >
            {t('Manage panels')}
          </Button>
        </OverflowMenuItem>
      );
      items.push(
        <OverflowMenuItem key="export">
          <Button
            data-test="export-button"
            id="export-button"
            variant="link"
            className="overflow-button"
            icon={<ExportIcon />}
            onClick={() => onOverviewExport()}
          >
            {t('Export overview')}
          </Button>
        </OverflowMenuItem>
      );
    } else if (selectedViewId === 'table') {
      items.push(
        <OverflowMenuItem key="columns">
          <Button
            data-test="manage-columns-button"
            id="manage-columns-button"
            variant="link"
            className="overflow-button"
            icon={<ColumnsIcon />}
            onClick={() => setColModalOpen(true)}
          >
            {t('Manage columns')}
          </Button>
        </OverflowMenuItem>
      );
      items.push(
        <OverflowMenuItem key="export">
          <Button
            data-test="export-button"
            id="export-button"
            variant="link"
            className="overflow-button"
            icon={<ExportIcon />}
            onClick={() => setExportModalOpen(true)}
          >
            {t('Export data')}
          </Button>
        </OverflowMenuItem>
      );
    } else if (selectedViewId === 'topology') {
      items.push(
        <OverflowMenuItem key="export">
          <Button
            data-test="export-button"
            id="export-button"
            variant="link"
            className="overflow-button"
            icon={<ExportIcon />}
            onClick={() => onTopologyExport()}
          >
            {t('Export topology view')}
          </Button>
        </OverflowMenuItem>
      );
    }
    return items;
  };

  const viewOptionsControl = () => {
    const dropdownItems: JSX.Element[] = [];

    if (selectedViewId === 'overview') {
      dropdownItems.push(
        <DropdownGroup key="panels" label={t('Manage')}>
          <DropdownItem key="export" onClick={() => setOverviewModalOpen(true)}>
            {t('Panels')}
          </DropdownItem>
        </DropdownGroup>
      );
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => onOverviewExport()}>
            {t('Export overview')}
          </DropdownItem>
        </DropdownGroup>
      );
    } else if (selectedViewId === 'table') {
      dropdownItems.push(
        <DropdownGroup key="columns" label={t('Manage')}>
          <DropdownItem key="export" onClick={() => setColModalOpen(true)}>
            {t('Columns')}
          </DropdownItem>
        </DropdownGroup>
      );
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => setExportModalOpen(true)}>
            {t('Export')}
          </DropdownItem>
        </DropdownGroup>
      );
    } else if (selectedViewId === 'topology') {
      dropdownItems.push(
        <DropdownGroup key="export-group" label={t('Actions')}>
          <DropdownItem key="export" onClick={() => onTopologyExport()}>
            {t('Export view')}
          </DropdownItem>
        </DropdownGroup>
      );
    }

    return (
      <Dropdown
        data-test="view-options-dropdown"
        id="view-options-dropdown"
        onSelect={() => setViewOptionOverflowMenuOpen(false)}
        toggle={
          <Button
            data-test="view-options-button"
            id="view-options-button"
            variant="link"
            className="overflow-button"
            icon={<EllipsisVIcon />}
            onClick={() => setViewOptionOverflowMenuOpen(!isViewOptionOverflowMenuOpen)}
          >
            {t('More options')}
          </Button>
        }
        isOpen={isViewOptionOverflowMenuOpen}
        dropdownItems={dropdownItems}
      />
    );
  };

  const actions = () => {
    return (
      <Flex direction={{ default: 'row' }}>
        <FlexItem>
          <Flex direction={{ default: 'column' }}>
            <FlexItem className="netobserv-action-title">
              <Text component={TextVariants.h4}>{t('Time range')}</Text>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <TimeRangeDropdown
                data-test="time-range-dropdown"
                id="time-range-dropdown"
                range={range}
                setRange={setRange}
                openCustomModal={() => setTRModalOpen(true)}
              />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem className="netobserv-refresh-interval-container">
          <Flex direction={{ default: 'column' }}>
            <FlexItem className="netobserv-action-title">
              <Text component={TextVariants.h4}>{t('Refresh interval')}</Text>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }}>
              <RefreshDropdown
                data-test="refresh-dropdown"
                id="refresh-dropdown"
                disabled={showHistogram || typeof range !== 'number'}
                interval={interval}
                setInterval={setInterval}
              />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem className="netobserv-refresh-container">
          <Button
            data-test="refresh-button"
            id="refresh-button"
            className="co-action-refresh-button"
            variant="primary"
            onClick={() => tick()}
            icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
          />
        </FlexItem>
      </Flex>
    );
  };

  const panelContent = () => {
    if (selectedRecord) {
      return (
        <RecordPanel
          id="recordPanel"
          record={selectedRecord}
          columns={getAvailableColumns(true)}
          filters={filters.list}
          filterDefinitions={getFilterDefs()}
          range={range}
          type={recordType}
          isDark={isDarkTheme}
          canSwitchTypes={isFlow() && isConnectionTracking()}
          allowPktDrops={isPktDrop()}
          setFilters={setFiltersList}
          setRange={setRange}
          setType={setRecordType}
          onClose={() => onRecordSelect(undefined)}
        />
      );
    } else if (isShowQuerySummary) {
      return (
        <SummaryPanel
          id="summaryPanel"
          flows={flows}
          metrics={metrics}
          type={recordType}
          maxChunkAge={maxChunkAge}
          stats={stats}
          limit={limit}
          lastRefresh={lastRefresh}
          lastDuration={lastDuration}
          warningMessage={warningMessage}
          slownessReason={slownessReason()}
          range={range}
          showDNSLatency={isDNSTracking()}
          showRTTLatency={isFlowRTT()}
          onClose={() => setShowQuerySummary(false)}
        />
      );
    } else if (selectedElement) {
      return (
        <ElementPanel
          id="elementPanel"
          element={selectedElement}
          metrics={getTopologyMetrics() || []}
          droppedMetrics={getTopologyDroppedMetrics() || []}
          metricType={topologyMetricType}
          truncateLength={topologyOptions.truncateLength}
          filters={filters.list}
          filterDefinitions={getFilterDefs()}
          setFilters={setFiltersList}
          onClose={() => onElementSelect(undefined)}
          isDark={isDarkTheme}
        />
      );
    } else {
      return null;
    }
  };

  const filterLinks = React.useCallback(() => {
    const defFilters = getDefaultFilters();
    return (
      <LinksOverflow
        id={'filter-links-overflow'}
        items={[
          {
            id: 'reset-filters',
            label: t('Reset defaults'),
            onClick: resetDefaultFilters,
            enabled: defFilters.length > 0 && !filtersEqual(filters.list, defFilters)
          },
          {
            id: 'clear-all-filters',
            label: t('Clear all'),
            onClick: clearFilters,
            enabled: filters.list.length > 0
          }
        ]}
      />
    );
  }, [getDefaultFilters, t, resetDefaultFilters, filters.list, clearFilters]);

  const pageContent = React.useCallback(() => {
    let content: JSX.Element | null = null;
    switch (selectedViewId) {
      case 'overview':
        content = (
          <NetflowOverview
            limit={limit}
            panels={getSelectedPanels()}
            recordType={recordType}
            metrics={metrics}
            loading={loading}
            error={error}
            isDark={isDarkTheme}
            filterActionLinks={filterLinks()}
            truncateLength={overviewTruncateLength}
            focus={overviewFocus}
            setFocus={setOverviewFocus}
          />
        );
        break;
      case 'table':
        content = (
          <NetflowTable
            loading={loading}
            error={error}
            allowPktDrops={isPktDrop()}
            flows={flows}
            selectedRecord={selectedRecord}
            size={size}
            onSelect={onRecordSelect}
            columns={getSelectedColumns()}
            setColumns={(v: Column[]) => setColumns(v.concat(columns.filter(col => !col.isSelected)))}
            columnSizes={columnSizes}
            setColumnSizes={setColumnSizes}
            filterActionLinks={filterLinks()}
            isDark={isDarkTheme}
          />
        );
        break;
      case 'topology':
        content = (
          <NetflowTopology
            loading={loading}
            k8sModels={k8sModels}
            error={error}
            metricFunction={topologyMetricFunction}
            metricType={topologyMetricType}
            metricScope={metricScope}
            setMetricScope={setMetricScope}
            metrics={getTopologyMetrics() || []}
            droppedMetrics={getTopologyDroppedMetrics() || []}
            options={topologyOptions}
            setOptions={setTopologyOptions}
            filters={filters}
            filterDefinitions={getFilterDefs()}
            setFilters={setFilters}
            selected={selectedElement}
            onSelect={onElementSelect}
            searchHandle={searchRef?.current}
            searchEvent={searchEvent}
            isDark={isDarkTheme}
            allowMultiCluster={isMultiCluster()}
            allowZone={isZones()}
          />
        );
        break;
      default:
        content = null;
        break;
    }

    return (
      <Flex id="page-content-flex" direction={{ default: 'column' }}>
        <FlexItem
          id={`${selectedViewId}-container`}
          flex={{ default: 'flex_1' }}
          className={isDarkTheme ? 'dark' : 'light'}
        >
          {content}
        </FlexItem>
        <FlexItem>
          {_.isEmpty(flows) ? (
            <MetricsQuerySummary
              metrics={metrics}
              stats={stats}
              loading={loading}
              lastRefresh={lastRefresh}
              lastDuration={lastDuration}
              warningMessage={warningMessage}
              slownessReason={slownessReason()}
              isShowQuerySummary={isShowQuerySummary}
              toggleQuerySummary={() => onToggleQuerySummary(!isShowQuerySummary)}
              isDark={isDarkTheme}
            />
          ) : (
            <FlowsQuerySummary
              flows={flows}
              stats={stats}
              loading={loading}
              lastRefresh={lastRefresh}
              lastDuration={lastDuration}
              warningMessage={warningMessage}
              slownessReason={slownessReason()}
              range={range}
              type={recordType}
              isShowQuerySummary={isShowQuerySummary}
              toggleQuerySummary={() => onToggleQuerySummary(!isShowQuerySummary)}
            />
          )}
        </FlexItem>
      </Flex>
    );
  }, [
    columnSizes,
    columns,
    error,
    filterLinks,
    filters,
    flows,
    getFilterDefs,
    getSelectedColumns,
    getSelectedPanels,
    getTopologyDroppedMetrics,
    getTopologyMetrics,
    isDarkTheme,
    isPktDrop,
    isShowQuerySummary,
    k8sModels,
    lastRefresh,
    limit,
    loading,
    metricScope,
    metrics,
    onElementSelect,
    onRecordSelect,
    onToggleQuerySummary,
    overviewFocus,
    overviewTruncateLength,
    range,
    recordType,
    searchEvent,
    selectedElement,
    selectedRecord,
    selectedViewId,
    setColumnSizes,
    setColumns,
    setMetricScope,
    setOverviewFocus,
    setTopologyOptions,
    size,
    stats,
    topologyMetricFunction,
    topologyMetricType,
    topologyOptions
  ]);

  //update data on filters changes
  React.useEffect(() => {
    setTRModalOpen(false);
  }, [range]);

  //update page on full screen change
  React.useEffect(() => {
    const header = document.getElementById('page-main-header');
    const sideBar = document.getElementById('page-sidebar');
    const notification = document.getElementsByClassName('co-global-notifications');
    [header, sideBar, ...notification].forEach(e => {
      if (isFullScreen) {
        e?.classList.add('hidden');
      } else {
        e?.classList.remove('hidden');
      }
    });
  }, [isFullScreen]);

  const slownessReason = React.useCallback((): string => {
    if (match === 'any' && hasNonIndexFields(filters.list)) {
      return t(
        // eslint-disable-next-line max-len
        'When in "Match any" mode, try using only Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
      );
    }
    if (match === 'all' && !hasIndexFields(filters.list)) {
      return t(
        // eslint-disable-next-line max-len
        'Add Namespace, Owner or Resource filters (which use indexed fields), or decrease limit / range, to improve the query performance'
      );
    }
    return t('Add more filters or decrease limit / range to improve the query performance');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match, filters]);

  const moveRange = React.useCallback(
    (next: boolean) => {
      const now = lastRefresh ? lastRefresh.getTime() : new Date().getTime();

      if (typeof range === 'number') {
        if (next) {
          //call refresh as we can't move in the future
          tick();
        } else {
          setRange({ from: getDateMsInSeconds(now) - 2 * range, to: getDateMsInSeconds(now) - range });
        }
      } else {
        const updatedRange = { ...range };
        const factor = (next ? 1 : -1) * (range.to - range.from);

        updatedRange.from += factor;
        updatedRange.to += factor;

        if (getDateSInMiliseconds(updatedRange.to) > now) {
          updatedRange.to = getDateMsInSeconds(now);
        }

        if (updatedRange.to - updatedRange.from < defaultTimeRange) {
          setRange(defaultTimeRange);
        } else {
          setRange(updatedRange);
        }
      }
    },
    [lastRefresh, range, tick]
  );

  const zoomRange = React.useCallback(
    (zoomIn: boolean) => {
      const timeRangeOptions = getTimeRangeOptions(t, false);
      const keys = Object.keys(timeRangeOptions);

      if (typeof range === 'number') {
        const selectedKey = formatDuration(getDateSInMiliseconds(range as number));
        let index = keys.indexOf(selectedKey);
        if (zoomIn && index > 0) {
          index--;
        } else if (!zoomIn && index < keys.length) {
          index++;
        }

        setRange(getDateMsInSeconds(parseDuration(keys[index])));
      } else {
        const updatedRange = { ...range };
        const factor = Math.floor(((zoomIn ? -1 : 1) * (range.to - range.from)) / (zoomIn ? 4 : 2));

        updatedRange.from -= factor;
        updatedRange.to += factor;

        if (updatedRange.to - updatedRange.from >= getDateMsInSeconds(parseDuration(keys[0]))) {
          const now = lastRefresh ? lastRefresh.getTime() : new Date().getTime();
          if (getDateSInMiliseconds(updatedRange.to) > now) {
            updatedRange.to = getDateMsInSeconds(now);
          }

          setRange(updatedRange);
        }
      }
    },
    [lastRefresh, range, t]
  );

  const isShowViewOptions = selectedViewId === 'table' ? showViewOptions && !showHistogram : showViewOptions;

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection" className={`${isDarkTheme ? 'dark' : 'light'} ${isTab ? 'tab' : ''}`}>
      {
        //display title only if forced filters is not set
        !forcedFilters && (
          <div id="pageHeader">
            <Flex direction={{ default: 'row' }}>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Text component={TextVariants.h1}>{t('Network Traffic')}</Text>
              </FlexItem>
              <FlexItem>{actions()}</FlexItem>
            </Flex>
          </div>
        )
      }
      {!_.isEmpty(getFilterDefs()) && (
        <FiltersToolbar
          id="filter-toolbar"
          filters={filters}
          setFilters={updateTableFilters}
          clearFilters={clearFilters}
          resetFilters={resetDefaultFilters}
          queryOptionsProps={{
            limit,
            setLimit,
            match,
            setMatch,
            packetLoss,
            setPacketLoss,
            recordType,
            setRecordType,
            showDuplicates,
            setShowDuplicates,
            allowFlow: isFlow(),
            allowConnection: isConnectionTracking(),
            allowShowDuplicates: selectedViewId === 'table' && recordType !== 'allConnections',
            deduperMark: config.deduper.mark,
            allowPktDrops: isPktDrop(),
            useTopK: selectedViewId === 'overview'
          }}
          forcedFilters={forcedFilters}
          quickFilters={getQuickFilters()}
          filterDefinitions={getFilterDefs()}
          isFullScreen={isFullScreen}
          setFullScreen={setFullScreen}
        />
      )}
      {
        <Flex className="netflow-traffic-tabs-container">
          <FlexItem id="tabs-container" flex={{ default: 'flex_1' }}>
            {viewTabs()}
          </FlexItem>
          {selectedViewId === 'table' && (
            <FlexItem className={`${isDarkTheme ? 'dark' : 'light'}-bottom-border`}>
              <Button
                data-test="show-histogram-button"
                id="show-histogram-button"
                variant="link"
                className="overflow-button"
                onClick={() => {
                  setShowViewOptions(false);
                  setShowHistogram(!showHistogram);
                  setHistogramRange(undefined);
                }}
              >
                {showHistogram ? t('Hide histogram') : t('Show histogram')}
              </Button>
            </FlexItem>
          )}
          <FlexItem className={`${isDarkTheme ? 'dark' : 'light'}-bottom-border`}>
            <Button
              data-test="show-view-options-button"
              id="show-view-options-button"
              variant="link"
              className="overflow-button"
              onClick={() => {
                setShowViewOptions(!isShowViewOptions);
                setShowHistogram(false);
                setHistogramRange(undefined);
              }}
            >
              {isShowViewOptions ? t('Hide advanced options') : t('Show advanced options')}
            </Button>
          </FlexItem>
        </Flex>
      }
      {selectedViewId === 'table' && showHistogram && (
        <Toolbar
          data-test-id="histogram-toolbar"
          id="histogram-toolbar"
          isFullHeight
          className={isDarkTheme ? 'dark' : ''}
        >
          <ToolbarItem className="histogram" widths={{ default: '100%' }}>
            <HistogramContainer
              id={'histogram'}
              loading={loading}
              totalMetric={metrics.totalFlowCountMetric}
              limit={limit}
              isDark={isDarkTheme}
              range={histogramRange}
              guidedTourHandle={guidedTourRef.current}
              setRange={setHistogramRange}
              moveRange={moveRange}
              zoomRange={zoomRange}
              resetRange={() => setRange(defaultTimeRange)}
            />
          </ToolbarItem>
        </Toolbar>
      )}
      {isShowViewOptions && (
        <Toolbar data-test-id="view-options-toolbar" id="view-options-toolbar" className={isDarkTheme ? 'dark' : ''}>
          <ToolbarItem className="flex-start view-options-first">
            <OverflowMenuItem key="display">
              {selectedViewId === 'overview' && (
                <OverviewDisplayDropdown
                  metricScope={metricScope}
                  setMetricScope={setMetricScope}
                  truncateLength={overviewTruncateLength}
                  setTruncateLength={setOverviewTruncateLength}
                  focus={overviewFocus}
                  setFocus={setOverviewFocus}
                  allowMultiCluster={isMultiCluster()}
                  allowZone={isZones()}
                />
              )}
              {selectedViewId === 'table' && <TableDisplayDropdown size={size} setSize={setSize} />}
              {selectedViewId === 'topology' && (
                <TopologyDisplayDropdown
                  metricFunction={topologyMetricFunction}
                  setMetricFunction={setTopologyMetricFunction}
                  metricType={topologyMetricType}
                  setMetricType={updateTopologyMetricType}
                  metricScope={metricScope}
                  setMetricScope={setMetricScope}
                  topologyOptions={topologyOptions}
                  setTopologyOptions={setTopologyOptions}
                  allowPktDrop={isPktDrop()}
                  allowDNSMetric={isDNSTracking()}
                  allowRTTMetric={isFlowRTT()}
                  allowMultiCluster={isMultiCluster()}
                  allowZone={isZones()}
                />
              )}
            </OverflowMenuItem>
          </ToolbarItem>
          {selectedViewId === 'topology' && (
            <ToolbarItem className="flex-start" id="search-container" data-test="search-container">
              <SearchComponent ref={searchRef} setSearchEvent={setSearchEvent} isDark={isDarkTheme} />
            </ToolbarItem>
          )}
          <ToolbarItem className="flex-start view-options-last" alignment={{ default: 'alignRight' }}>
            <OverflowMenu breakpoint="2xl">
              <OverflowMenuContent isPersistent>
                <OverflowMenuGroup groupType="button" isPersistent className="flex-start">
                  {viewOptionsContent()}
                </OverflowMenuGroup>
              </OverflowMenuContent>
              <OverflowMenuControl className="flex-start">{viewOptionsControl()}</OverflowMenuControl>
            </OverflowMenu>
          </ToolbarItem>
        </Toolbar>
      )}
      <Drawer
        id="drawer"
        isInline
        isExpanded={selectedRecord !== undefined || selectedElement !== undefined || isShowQuerySummary}
      >
        <DrawerContent id="drawerContent" panelContent={panelContent()}>
          <DrawerContentBody id="drawerBody">{pageContent()}</DrawerContentBody>
        </DrawerContent>
      </Drawer>
      {initState.current.includes('initDone') && (
        <>
          <TimeRangeModal
            id="time-range-modal"
            isModalOpen={isTRModalOpen}
            setModalOpen={setTRModalOpen}
            range={typeof range === 'object' ? range : undefined}
            setRange={setRange}
            maxChunkAge={maxChunkAge}
          />
          <OverviewPanelsModal
            id="overview-panels-modal"
            isModalOpen={isOverviewModalOpen}
            setModalOpen={setOverviewModalOpen}
            recordType={recordType}
            panels={getAvailablePanels()}
            setPanels={setPanels}
            customIds={config.panels}
          />
          <ColumnsModal
            id="columns-modal"
            isModalOpen={isColModalOpen}
            setModalOpen={setColModalOpen}
            config={config}
            columns={getAvailableColumns()}
            setColumns={setColumns}
            setColumnSizes={setColumnSizes}
          />
          <ExportModal
            id="export-modal"
            isModalOpen={isExportModalOpen}
            setModalOpen={setExportModalOpen}
            flowQuery={buildFlowQuery()}
            columns={columns.filter(c => c.field && !c.field.name.startsWith('Time'))}
            range={range}
            filters={(forcedFilters || filters).list}
          />
        </>
      )}
      <GuidedTourPopover id="netobserv" ref={guidedTourRef} isDark={isDarkTheme} />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
