import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
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
import { useTheme } from '../utils/theme-hook';
import { Record } from '../api/ipfix';
import { DroppedTopologyMetrics, RecordsResult, Stats, TopologyMetrics, TopologyResult } from '../api/loki';
import { getFlows, getTopology } from '../api/routes';
import {
  DisabledFilters,
  Filter,
  Filters,
  getDisabledFiltersRecord,
  getEnabledFilters,
  hasIndexFields,
  hasNonIndexFields
} from '../model/filters';
import {
  FlowQuery,
  groupFilters,
  Match,
  MetricFunction,
  FlowScope,
  MetricType,
  PacketLoss,
  RecordType,
  Reporter
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
import { Column, ColumnsId, ColumnSizeMap, getDefaultColumns } from '../utils/columns';
import { loadConfig } from '../utils/config';
import { ContextSingleton } from '../utils/context';
import { computeStepInterval, getTimeRangeOptions, TimeRange } from '../utils/datetime';
import { getHTTPErrorDetails } from '../utils/errors';
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
  LOCAL_STORAGE_SHOW_OPTIONS_KEY,
  LOCAL_STORAGE_SHOW_HISTOGRAM_KEY,
  LOCAL_STORAGE_SIZE_KEY,
  LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
  LOCAL_STORAGE_VIEW_ID_KEY,
  useLocalStorage
} from '../utils/local-storage-hook';
import { getDefaultOverviewPanels, OverviewPanel } from '../utils/overview-panels';
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
  getReporterFromURL,
  setURLFilters,
  setURLLimit,
  setURLMatch,
  setURLMetricFunction,
  setURLMetricType,
  setURLPacketLoss,
  setURLRange,
  setURLRecortType,
  setURLReporter
} from '../utils/router';
import { getURLParams, hasEmptyParams, netflowTrafficPath, setURLParams } from '../utils/url';
import { OverviewDisplayDropdown } from './dropdowns/overview-display-dropdown';
import { LIMIT_VALUES, TOP_VALUES } from './dropdowns/query-options-dropdown';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import { TableDisplayDropdown, Size } from './dropdowns/table-display-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { TopologyDisplayDropdown } from './dropdowns/topology-display-dropdown';
import { FiltersToolbar } from './filters/filters-toolbar';
import { ColumnsModal } from './modals/columns-modal';
import { ExportModal } from './modals/export-modal';
import OverviewPanelsModal from './modals/overview-panels-modal';
import TimeRangeModal from './modals/time-range-modal';
import NetflowOverview from './netflow-overview/netflow-overview';
import { RecordPanel } from './netflow-record/record-panel';
import NetflowTable from './netflow-table/netflow-table';
import ElementPanel from './netflow-topology/element-panel';
import NetflowTopology from './netflow-topology/netflow-topology';
import { Config, defaultConfig } from '../model/config';
import SummaryPanel from './query-summary/summary-panel';
import MetricsQuerySummary from './query-summary/metrics-query-summary';
import FlowsQuerySummary from './query-summary/flows-query-summary';
import { SearchComponent, SearchEvent, SearchHandle } from './search/search';
import './netflow-traffic.css';
import { TruncateLength } from './dropdowns/truncate-dropdown';
import HistogramContainer from './metrics/histogram';
import { formatDuration, getDateMsInSeconds, getDateSInMiliseconds, parseDuration } from '../utils/duration';
import GuidedTourPopover, { GuidedTourHandle } from './guided-tour/guided-tour';
import { exportToPng } from '../utils/export';
import { navigate } from './dynamic-loader/dynamic-loader';
import { LinksOverflow } from './overflow/links-overflow';

export type ViewId = 'overview' | 'table' | 'topology';

export const NetflowTraffic: React.FC<{
  forcedFilters?: Filters | null;
  isTab?: boolean;
}> = ({ forcedFilters, isTab }) => {
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

  const warningTimeOut = React.useRef<NodeJS.Timeout | undefined>();
  const [config, setConfig] = React.useState<Config>(defaultConfig);
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
  const [topologyOptions, setTopologyOptions] = useLocalStorage<TopologyOptions>(
    LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY,
    DefaultOptions
  );
  const [metrics, setMetrics] = React.useState<TopologyMetrics[]>([]);
  const [droppedMetrics, setDroppedMetrics] = React.useState<TopologyMetrics[]>([]);
  const [totalMetric, setTotalMetric] = React.useState<TopologyMetrics | undefined>(undefined);
  const [totalDroppedMetric, setTotalDroppedMetric] = React.useState<TopologyMetrics | undefined>(undefined);
  const [droppedStateMetrics, setDroppedStateMetrics] = React.useState<DroppedTopologyMetrics[] | undefined>(undefined);
  const [droppedCauseMetrics, setDroppedCauseMetrics] = React.useState<DroppedTopologyMetrics[] | undefined>(undefined);
  const [isShowQuerySummary, setShowQuerySummary] = React.useState<boolean>(false);
  const [lastRefresh, setLastRefresh] = React.useState<Date | undefined>(undefined);
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
  const [reporter, setReporter] = React.useState<Reporter>(getReporterFromURL());
  const [limit, setLimit] = React.useState<number>(
    getLimitFromURL(selectedViewId === 'table' ? LIMIT_VALUES[0] : TOP_VALUES[0])
  );
  const [lastLimit, setLastLimit] = useLocalStorage<number>(LOCAL_STORAGE_LAST_LIMIT_KEY, LIMIT_VALUES[0]);
  const [lastTop, setLastTop] = useLocalStorage<number>(LOCAL_STORAGE_LAST_TOP_KEY, TOP_VALUES[0]);
  const [range, setRange] = React.useState<number | TimeRange>(getRangeFromURL());
  const [histogramRange, setHistogramRange] = React.useState<TimeRange>();
  const [metricScope, setMetricScope] = useLocalStorage<FlowScope>(LOCAL_STORAGE_METRIC_SCOPE_KEY, 'namespace');
  const [metricFunction, setMetricFunction] = useLocalStorage<MetricFunction>(
    LOCAL_STORAGE_METRIC_FUNCTION_KEY,
    defaultMetricFunction
  );
  const [metricType, setMetricType] = useLocalStorage<MetricType>(LOCAL_STORAGE_METRIC_TYPE_KEY, defaultMetricType);
  const [interval, setInterval] = useLocalStorage<number | undefined>(LOCAL_STORAGE_REFRESH_KEY);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | undefined>(undefined);
  const [selectedElement, setSelectedElement] = React.useState<GraphElementPeer | undefined>(undefined);
  const searchRef = React.useRef<SearchHandle>(null);
  const [searchEvent, setSearchEvent] = React.useState<SearchEvent | undefined>(undefined);
  const guidedTourRef = React.useRef<GuidedTourHandle>(null);

  //use this ref to list any props / content loading state & events to skip tick function
  const initState = React.useRef<Array<'initDone' | 'configLoading' | 'configLoaded' | 'forcedFiltersLoaded'>>([]);
  const [panels, setSelectedPanels] = useLocalStorage<OverviewPanel[]>(
    LOCAL_STORAGE_OVERVIEW_IDS_KEY,
    getDefaultOverviewPanels(),
    {
      id: 'id',
      criteria: 'isSelected'
    }
  );
  const [columns, setColumns] = useLocalStorage<Column[]>(LOCAL_STORAGE_COLS_KEY, getDefaultColumns(t), {
    id: 'id',
    criteria: 'isSelected'
  });
  const [columnSizes, setColumnSizes] = useLocalStorage<ColumnSizeMap>(LOCAL_STORAGE_COLS_SIZES_KEY, {});

  const getQuickFilters = React.useCallback((c = config) => parseQuickFilters(t, c.quickFilters), [t, config]);

  const getDefaultFilters = React.useCallback(
    (c = config) => {
      const quickFilters = getQuickFilters(c);
      return quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
    },
    [config, getQuickFilters]
  );

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = React.useCallback(
    (f: Filters) => {
      setFilters(f);
      setFlows([]);
      setTotalMetric(undefined);
      setTotalDroppedMetric(undefined);
      setWarningMessage(undefined);
    },
    [setFilters, setFlows, setWarningMessage]
  );

  const backAndForth = filters.backAndForth;
  const resetDefaultFilters = React.useCallback(
    (c = config) => {
      const def = getDefaultFilters(c);
      updateTableFilters({ backAndForth, list: def });
    },
    [config, backAndForth, getDefaultFilters, updateTableFilters]
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
    if (view !== 'table') {
      //reporter 'both' is only available in table view
      if (reporter === 'both') {
        setReporter('source');
      }
    }
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
      setMetrics([]);
      setTotalMetric(undefined);
      setTotalDroppedMetric(undefined);
    }
    setSelectedViewId(view);
  };

  const onRecordSelect = (record?: Record) => {
    clearSelections();
    setSelectedRecord(record);
  };

  const onElementSelect = (element?: GraphElementPeer) => {
    clearSelections();
    setSelectedElement(element);
  };

  const onToggleQuerySummary = (v: boolean) => {
    clearSelections();
    setShowQuerySummary(v);
  };

  const buildFlowQuery = React.useCallback((): FlowQuery => {
    const enabledFilters = getEnabledFilters(forcedFilters || filters);
    const groupedFilters = groupFilters(enabledFilters, match === 'any');
    const query: FlowQuery = {
      filters: groupedFilters,
      limit: LIMIT_VALUES.includes(limit) ? limit : LIMIT_VALUES[0],
      recordType: recordType,
      reporter: reporter,
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
      query.type = 'count';
    } else {
      query.type = metricType;
      query.aggregateBy = metricScope;
      if (selectedViewId === 'topology') {
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
    reporter,
    packetLoss,
    range,
    selectedViewId,
    metricType,
    metricScope,
    topologyOptions.groupTypes
  ]);

  const manageWarnings = React.useCallback(
    (query: Promise<unknown>) => {
      Promise.race([query, new Promise((resolve, reject) => setTimeout(reject, 2000, 'slow'))]).then(
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

  const tick = React.useCallback(() => {
    // skip tick while forcedFilters & config are not loaded
    // this check ensure tick will not be called during init
    // as it's difficult to manage react state changes
    if (!initState.current.includes('forcedFiltersLoaded') || !initState.current.includes('configLoaded')) {
      console.error('tick skipped', initState.current);
      return;
    }

    setLoading(true);
    setError(undefined);
    const fq = buildFlowQuery();
    const droppedType = config.features.includes('pktDrop')
      ? fq.type === 'bytes'
        ? 'droppedBytes'
        : 'droppedPackets'
      : undefined;

    const promises: Promise<RecordsResult | TopologyResult>[] = [];
    switch (selectedViewId) {
      case 'table':
        // table query is based on histogram range if available
        const tableQuery = { ...fq };
        if (histogramRange) {
          tableQuery.startTime = histogramRange.from.toString();
          tableQuery.endTime = histogramRange.to.toString();
        }
        promises.push(getFlows(tableQuery));
        if (showHistogram) {
          promises.push(getTopology({ ...fq, aggregateBy: 'app' }, range));
          if (droppedType) {
            promises.push(getTopology({ ...fq, aggregateBy: 'app', type: droppedType }, range));
          }
        }
        manageWarnings(
          Promise.all(promises)
            .then(results => {
              //get stats from first result
              const stats = results[0].stats;

              //set flows
              setFlows((results[0] as RecordsResult).records);

              //set app metrics
              if (results.length > 1) {
                setTotalMetric((results[1] as TopologyResult).metrics[0] as TopologyMetrics);
                stats.limitReached = stats.limitReached || results[1].stats.limitReached;
                stats.numQueries += results[1].stats.numQueries;
              } else {
                setTotalMetric(undefined);
              }

              if (results.length > 2) {
                setTotalDroppedMetric((results[2] as TopologyResult).metrics[0] as TopologyMetrics);
                stats.limitReached = stats.limitReached || results[2].stats.limitReached;
                stats.numQueries += results[2].stats.numQueries;
              } else {
                setTotalDroppedMetric(undefined);
              }

              setStats(stats);
            })
            .catch(err => {
              setFlows([]);
              setError(getHTTPErrorDetails(err));
              setWarningMessage(undefined);
            })
            .finally(() => {
              //clear metrics
              setMetrics([]);
              setLoading(false);
              setLastRefresh(new Date());
            })
        );
        break;
      case 'overview':
        //TODO: manage each metrics separately to load panels as soon as available

        //get bytes or packets
        promises.push(getTopology(fq, range));

        //run same query on app scope for total flows
        promises.push(getTopology({ ...fq, aggregateBy: 'app' }, range));

        if (droppedType) {
          //run same queries for drops
          promises.push(getTopology({ ...fq, type: droppedType }, range));
          promises.push(getTopology({ ...fq, aggregateBy: 'app', type: droppedType }, range));
          //get drop state & cause
          promises.push(getTopology({ ...fq, type: droppedType, aggregateBy: 'droppedState' }, range));
          promises.push(getTopology({ ...fq, type: droppedType, aggregateBy: 'droppedCause' }, range));
        }

        manageWarnings(
          Promise.all(promises)
            .then(results => {
              //get stats from first result
              const stats = results[0].stats;

              //set metrics
              setMetrics((results[0] as TopologyResult).metrics as TopologyMetrics[]);

              //set app metrics
              setTotalMetric((results[1] as TopologyResult).metrics[0] as TopologyMetrics);
              stats.limitReached = stats.limitReached || results[1].stats.limitReached;
              stats.numQueries += results[1].stats.numQueries;

              if (results.length > 2) {
                //set dropped metrics
                setDroppedMetrics((results[2] as TopologyResult).metrics as TopologyMetrics[]);
                stats.limitReached = stats.limitReached || results[2].stats.limitReached;
                stats.numQueries += results[2].stats.numQueries;

                //set app dropped metrics
                setTotalDroppedMetric((results[3] as TopologyResult).metrics[0] as TopologyMetrics);
                stats.limitReached = stats.limitReached || results[3].stats.limitReached;
                stats.numQueries += results[3].stats.numQueries;

                //set dropped state
                setDroppedStateMetrics((results[4] as TopologyResult).metrics as DroppedTopologyMetrics[]);
                stats.limitReached = stats.limitReached || results[4].stats.limitReached;
                stats.numQueries += results[4].stats.numQueries;

                //set dropped cause
                setDroppedCauseMetrics((results[5] as TopologyResult).metrics as DroppedTopologyMetrics[]);
                stats.limitReached = stats.limitReached || results[5].stats.limitReached;
                stats.numQueries += results[5].stats.numQueries;
              } else {
                setDroppedMetrics([]);
                setTotalDroppedMetric(undefined);
                setDroppedStateMetrics(undefined);
                setDroppedCauseMetrics(undefined);
              }
              setStats(stats);
            })
            .catch(err => {
              setMetrics([]);
              setTotalMetric(undefined);
              setDroppedMetrics([]);
              setTotalDroppedMetric(undefined);
              setDroppedStateMetrics(undefined);
              setDroppedCauseMetrics(undefined);
              setError(getHTTPErrorDetails(err));
              setWarningMessage(undefined);
            })
            .finally(() => {
              //clear flows
              setFlows([]);
              setLoading(false);
              setLastRefresh(new Date());
            })
        );
        break;
      case 'topology':
        //get bytes or packets
        promises.push(getTopology(fq, range));
        if (droppedType) {
          //run same for dropped bytes or packets
          promises.push(getTopology({ ...fq, type: droppedType }, range));
        }

        manageWarnings(
          Promise.all(promises)
            .then(results => {
              //get stats from first result
              const stats = results[0].stats;

              //set metrics
              setMetrics((results[0] as TopologyResult).metrics as TopologyMetrics[]);

              if (results.length > 1) {
                //set dropped metrics
                setDroppedMetrics((results[1] as TopologyResult).metrics as TopologyMetrics[]);
                stats.limitReached = stats.limitReached || results[1].stats.limitReached;
                stats.numQueries += results[1].stats.numQueries;
              } else {
                setDroppedMetrics([]);
              }

              setStats(stats);
            })
            .catch(err => {
              setMetrics([]);
              setDroppedMetrics([]);
              setError(getHTTPErrorDetails(err));
              setWarningMessage(undefined);
            })
            .finally(() => {
              //clear flows
              setFlows([]);
              setLoading(false);
              setLastRefresh(new Date());
            })
        );
        break;
      default:
        console.error('tick called on not implemented view Id', selectedViewId);
        setLoading(false);
        break;
    }
  }, [buildFlowQuery, config.features, selectedViewId, histogramRange, showHistogram, manageWarnings, range]);

  usePoll(tick, interval);

  const isFlow = React.useCallback(() => {
    return config.recordTypes.some(rt => rt === 'flowLog');
  }, [config.recordTypes]);

  const isConnectionTracking = React.useCallback(() => {
    return config.recordTypes.some(rt => rt === 'newConnection' || rt === 'heartbeat' || rt === 'endConnection');
  }, [config.recordTypes]);

  const isDNSTracking = React.useCallback(() => {
    return config.features.includes('dnsTracking');
  }, [config.features]);

  const isPktDrop = React.useCallback(() => {
    return config.features.includes('pktDrop');
  }, [config.features]);

  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      if (recordType === 'flowLog' && !isFlow() && isConnectionTracking()) {
        setRecordType('allConnections');
      } else if (recordType === 'allConnections' && isFlow() && !isConnectionTracking()) {
        setRecordType('flowLog');
      }
    }
  }, [config.recordTypes, isConnectionTracking, isFlow, recordType]);

  // tick on state change
  React.useEffect(() => {
    // init function will be triggered only once
    if (!initState.current.includes('initDone')) {
      initState.current.push('initDone');

      // load config only once and track its state
      if (!initState.current.includes('configLoading')) {
        initState.current.push('configLoading');
        loadConfig().then(v => {
          initState.current.push('configLoaded');
          setConfig(v);
          if (forcedFilters === null) {
            //set filters from url or freshly loaded quick filters defaults
            const filtersPromise = getFiltersFromURL(t, disabledFilters);
            if (filtersPromise) {
              filtersPromise.then(updateTableFilters);
            } else {
              resetDefaultFilters(v);
            }
          }
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
    setURLReporter(reporter, !initState.current.includes('configLoaded'));
  }, [reporter]);
  React.useEffect(() => {
    setURLMetricFunction(metricFunction, !initState.current.includes('configLoaded'));
    setURLMetricType(metricType, !initState.current.includes('configLoaded'));
  }, [metricFunction, metricType]);
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
  }, [filters, range, limit, match, reporter, metricFunction, metricType, setQueryParams, forcedFilters]);

  // update local storage enabled filters
  React.useEffect(() => {
    setDisabledFilters(getDisabledFiltersRecord(filters.list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  //clear warning message after 10s
  React.useEffect(() => {
    if (warningTimeOut.current) {
      clearTimeout(warningTimeOut.current);
    }

    warningTimeOut.current = setTimeout(() => setWarningMessage(undefined), 10000);
  }, [warningMessage]);

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
        className="netflow-traffic-tabs"
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
    const overview_flex = document.getElementById('overview-flex');
    exportToPng('overview_page', overview_flex as HTMLElement, isDarkTheme);
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
          columns={getDefaultColumns(t, false, false).filter(
            col =>
              (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
              (isDNSTracking() || ![ColumnsId.dnsid, ColumnsId.dnslatency].includes(col.id))
          )}
          filters={filters.list}
          range={range}
          reporter={reporter}
          type={recordType}
          isDark={isDarkTheme}
          canSwitchTypes={isFlow() && isConnectionTracking()}
          setFilters={setFiltersList}
          setRange={setRange}
          setReporter={setReporter}
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
          appMetrics={totalMetric}
          appDroppedMetrics={totalDroppedMetric}
          type={recordType}
          metricType={metricType}
          stats={stats}
          limit={limit}
          lastRefresh={lastRefresh}
          range={range}
          showDNSLatency={isDNSTracking()}
          onClose={() => setShowQuerySummary(false)}
        />
      );
    } else if (selectedElement) {
      return (
        <ElementPanel
          id="elementPanel"
          element={selectedElement}
          metrics={metrics}
          metricType={metricType}
          truncateLength={topologyOptions.truncateLength}
          filters={filters.list}
          setFilters={setFiltersList}
          onClose={() => onElementSelect(undefined)}
        />
      );
    } else {
      return null;
    }
  };

  const resetText = t('Reset defaults');
  const clearText = t('Clear all');

  const filterLinks = React.useCallback(() => {
    const defFilters = getDefaultFilters();
    return (
      <LinksOverflow
        id={'filter-links-overflow'}
        items={[
          {
            id: 'reset-filters',
            label: resetText,
            onClick: resetDefaultFilters,
            enabled: defFilters.length > 0 && !_.isEqual(filters, defFilters)
          },
          {
            id: 'clear-all-filters',
            label: clearText,
            onClick: clearFilters,
            enabled: filters.list.length > 0
          }
        ]}
      />
    );
  }, [getDefaultFilters, filters, resetText, clearText, clearFilters, resetDefaultFilters]);

  const pageContent = () => {
    let content: JSX.Element | null = null;
    switch (selectedViewId) {
      case 'overview':
        content = (
          <NetflowOverview
            limit={limit}
            panels={panels.filter(panel => panel.isSelected && (isPktDrop() || !panel.id.includes('dropped')))}
            recordType={recordType}
            metricType={metricType}
            metrics={metrics}
            droppedMetrics={droppedMetrics}
            totalMetric={totalMetric}
            totalDroppedMetric={totalDroppedMetric}
            droppedStateMetrics={droppedStateMetrics}
            droppedCauseMetrics={droppedCauseMetrics}
            loading={loading}
            error={error}
            isDark={isDarkTheme}
            filterActionLinks={filterLinks()}
            truncateLength={overviewTruncateLength}
          />
        );
        break;
      case 'table':
        content = (
          <NetflowTable
            loading={loading}
            error={error}
            flows={flows}
            selectedRecord={selectedRecord}
            size={size}
            onSelect={onRecordSelect}
            columns={columns.filter(
              col =>
                col.isSelected &&
                (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
                (isDNSTracking() || ![ColumnsId.dnsid, ColumnsId.dnslatency].includes(col.id))
            )}
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
            metricFunction={metricFunction}
            metricType={metricType}
            metricScope={metricScope}
            setMetricScope={setMetricScope}
            metrics={metrics}
            droppedMetrics={droppedMetrics}
            options={topologyOptions}
            setOptions={setTopologyOptions}
            filters={filters}
            setFilters={setFilters}
            selected={selectedElement}
            onSelect={onElementSelect}
            searchHandle={searchRef?.current}
            searchEvent={searchEvent}
            isDark={isDarkTheme}
          />
        );
        break;
      default:
        content = null;
        break;
    }

    return (
      <Flex id="page-content-flex" direction={{ default: 'column' }}>
        <FlexItem flex={{ default: 'flex_1' }}>{content}</FlexItem>
        <FlexItem>
          {_.isEmpty(flows) ? (
            <MetricsQuerySummary
              metrics={metrics}
              droppedMetrics={droppedMetrics}
              appMetrics={totalMetric}
              appDroppedMetrics={totalDroppedMetric}
              metricType={metricType}
              lastRefresh={lastRefresh}
              isShowQuerySummary={isShowQuerySummary}
              toggleQuerySummary={() => onToggleQuerySummary(!isShowQuerySummary)}
            />
          ) : (
            <FlowsQuerySummary
              flows={flows}
              stats={stats}
              lastRefresh={lastRefresh}
              range={range}
              type={recordType}
              isShowQuerySummary={isShowQuerySummary}
              toggleQuerySummary={() => onToggleQuerySummary(!isShowQuerySummary)}
            />
          )}
        </FlexItem>
      </Flex>
    );
  };

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

  const slownessReason = React.useCallback(() => {
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
    <PageSection id="pageSection" className={isTab ? 'tab' : ''}>
      {
        //display title only if forced filters is not set
        _.isEmpty(forcedFilters) && (
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
          reporter,
          setReporter,
          allowFlow: isFlow(),
          allowConnection: isConnectionTracking(),
          allowReporterBoth: selectedViewId === 'table',
          allowPktDrops: isPktDrop(),
          useTopK: selectedViewId === 'overview'
        }}
        forcedFilters={forcedFilters}
        quickFilters={getQuickFilters()}
        isFullScreen={isFullScreen}
        setFullScreen={setFullScreen}
        allowConnectionFilter={isConnectionTracking()}
        allowDNSFilter={isDNSTracking()}
      />
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
              totalMetric={totalMetric}
              totalDroppedMetric={totalDroppedMetric}
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
                  metricType={metricType}
                  setMetricType={setMetricType}
                  metricScope={metricScope}
                  setMetricScope={setMetricScope}
                  truncateLength={overviewTruncateLength}
                  setTruncateLength={setOverviewTruncateLength}
                />
              )}
              {selectedViewId === 'table' && <TableDisplayDropdown size={size} setSize={setSize} />}
              {selectedViewId === 'topology' && (
                <TopologyDisplayDropdown
                  metricFunction={metricFunction}
                  setMetricFunction={setMetricFunction}
                  metricType={metricType}
                  setMetricType={setMetricType}
                  metricScope={metricScope}
                  setMetricScope={setMetricScope}
                  topologyOptions={topologyOptions}
                  setTopologyOptions={setTopologyOptions}
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
      <TimeRangeModal
        id="time-range-modal"
        isModalOpen={isTRModalOpen}
        setModalOpen={setTRModalOpen}
        range={typeof range === 'object' ? range : undefined}
        setRange={setRange}
      />
      <OverviewPanelsModal
        id="overview-panels-modal"
        isModalOpen={isOverviewModalOpen}
        setModalOpen={setOverviewModalOpen}
        recordType={recordType}
        panels={panels.filter(panel => isPktDrop() || !panel.id.includes('dropped'))}
        setPanels={setSelectedPanels}
      />
      <ColumnsModal
        id="columns-modal"
        isModalOpen={isColModalOpen}
        setModalOpen={setColModalOpen}
        columns={columns.filter(
          col =>
            (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
            (isDNSTracking() || ![ColumnsId.dnsid, ColumnsId.dnslatency, ColumnsId.dnsresponsecode].includes(col.id))
        )}
        setColumns={setColumns}
        setColumnSizes={setColumnSizes}
      />
      <ExportModal
        id="export-modal"
        isModalOpen={isExportModalOpen}
        setModalOpen={setExportModalOpen}
        flowQuery={buildFlowQuery()}
        columns={columns.filter(c => c.fieldName && !c.fieldName.startsWith('Time'))}
        range={range}
        filters={(forcedFilters || filters).list}
      />
      {!_.isEmpty(warningMessage) && (
        <Alert
          id="netflow-warning"
          title={warningMessage}
          variant="warning"
          actionClose={<AlertActionCloseButton onClose={() => setWarningMessage(undefined)} />}
        >
          {slownessReason()}
        </Alert>
      )}
      <GuidedTourPopover id="netobserv" ref={guidedTourRef} isDark={isDarkTheme} />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
