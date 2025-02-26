import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, PageSection, Text, TextVariants, Title } from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultNetflowMetrics, Stats } from '../api/loki';
import { Config } from '../model/config';
import { Filters, getDisabledFiltersRecord, getEnabledFilters } from '../model/filters';
import { filtersToString, FlowQuery, MetricType } from '../model/flow-query';
import { netflowTrafficModel } from '../model/netflow-traffic';
import { parseQuickFilters } from '../model/quick-filters';
import { getFetchFunctions as getBackAndForthFetch } from '../utils/back-and-forth';
import { ColumnsId, getDefaultColumns } from '../utils/columns';
import { loadConfig } from '../utils/config';
import { ContextSingleton } from '../utils/context';
import { computeStepInterval } from '../utils/datetime';
import { getHTTPErrorDetails, getPromError, isPromMissingLabelError } from '../utils/errors';
import { checkFilterAvailable, getFilterDefinitions } from '../utils/filter-definitions';
import {
  defaultArraySelectionOptions,
  getLocalStorage,
  localStorageColsKey,
  localStorageOverviewIdsKey
} from '../utils/local-storage-hook';
import { mergeStats } from '../utils/metrics';
import { dnsIdMatcher, droppedIdMatcher, getDefaultOverviewPanels, rttIdMatcher } from '../utils/overview-panels';
import { usePoll } from '../utils/poll-hook';
import {
  defaultMetricScope,
  defaultMetricType,
  defaultTimeRange,
  getFiltersFromURL,
  setURLDatasource,
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
import NetflowTrafficDrawer, { NetflowTrafficDrawerHandle } from './drawer/netflow-traffic-drawer';
import { limitValues, topValues } from './dropdowns/query-options-panel';
import { RefreshDropdown } from './dropdowns/refresh-dropdown';
import TimeRangeDropdown from './dropdowns/time-range-dropdown';
import { navigate } from './dynamic-loader/dynamic-loader';
import GuidedTourPopover, { GuidedTourHandle } from './guided-tour/guided-tour';
import Modals from './modals/modals';
import './netflow-traffic.css';
import { SearchHandle } from './search/search';
import TabsContainer from './tabs/tabs-container';
import { FiltersToolbar } from './toolbar/filters-toolbar';
import ChipsPopover from './toolbar/filters/chips-popover';
import HistogramToolbar from './toolbar/histogram-toolbar';
import ViewOptionsToolbar from './toolbar/view-options-toolbar';

export type ViewId = 'overview' | 'table' | 'topology';

export interface NetflowTrafficProps {
  forcedNamespace?: string;
  forcedFilters?: Filters | null;
  isTab?: boolean;
  parentConfig?: Config;
}

export const NetflowTraffic: React.FC<NetflowTrafficProps> = ({
  forcedNamespace,
  forcedFilters,
  isTab,
  parentConfig
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const isDarkTheme = useTheme();
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  ContextSingleton.setContext(extensions, forcedNamespace);

  const model = netflowTrafficModel();

  // Refs
  const metricsRef = React.useRef(model.metrics);
  const drawerRef = React.useRef<NetflowTrafficDrawerHandle>(null);
  const searchRef = React.useRef<SearchHandle>(null);
  const guidedTourRef = React.useRef<GuidedTourHandle>(null);
  // use this ref to list any props / content loading state & events to skip tick function
  const initState = React.useRef<
    Array<
      'initDone' | 'configLoading' | 'configLoaded' | 'configLoadError' | 'forcedFiltersLoaded' | 'urlFiltersPending'
    >
  >([]);

  // Callbacks
  const allowLoki = React.useCallback(() => {
    return model.config.dataSources.some(ds => ds === 'loki');
  }, [model.config.dataSources]);

  const allowProm = React.useCallback(() => {
    return model.config.dataSources.some(ds => ds === 'prom') && model.selectedViewId !== 'table';
  }, [model.config.dataSources, model.selectedViewId]);

  const isFlow = React.useCallback(() => {
    return model.config.recordTypes.some(rt => rt === 'flowLog');
  }, [model.config.recordTypes]);

  const isConnectionTracking = React.useCallback(() => {
    return model.config.recordTypes.some(rt => rt === 'newConnection' || rt === 'heartbeat' || rt === 'endConnection');
  }, [model.config.recordTypes]);

  const isDNSTracking = React.useCallback(() => {
    return model.config.features.includes('dnsTracking');
  }, [model.config.features]);

  const isFlowRTT = React.useCallback(() => {
    return model.config.features.includes('flowRTT');
  }, [model.config.features]);

  const isPktDrop = React.useCallback(() => {
    return model.config.features.includes('pktDrop');
  }, [model.config.features]);

  const isUdn = React.useCallback(() => {
    return model.config.features.includes('udnMapping');
  }, [model.config.features]);

  const isPktXlat = React.useCallback(() => {
    return model.config.features.includes('packetTranslation');
  }, [model.config.features]);

  const isNetEvents = React.useCallback(() => {
    return model.config.features.includes('networkEvents');
  }, [model.config.features]);

  const isPromOnly = React.useCallback(() => {
    return !allowLoki() || model.dataSource === 'prom';
  }, [allowLoki, model.dataSource]);

  const dataSourceHasLabels = React.useCallback(
    (labels: string[]) => {
      if (!isPromOnly()) {
        return true;
      }
      for (let i = 0; i < labels.length; i++) {
        if (!model.config.promLabels.includes(labels[i])) {
          return false;
        }
      }
      return true;
    },
    [model.config.promLabels, isPromOnly]
  );

  const isMultiCluster = React.useCallback(() => {
    return isPromOnly() ? dataSourceHasLabels(['K8S_ClusterName']) : model.config.features.includes('multiCluster');
  }, [model.config.features, dataSourceHasLabels, isPromOnly]);

  const isZones = React.useCallback(() => {
    return isPromOnly() ? dataSourceHasLabels(['SrcK8S_Zone', 'DstK8S_Zone']) : model.config.features.includes('zones');
  }, [model.config.features, dataSourceHasLabels, isPromOnly]);

  const getAvailableScopes = React.useCallback(() => {
    return model.config.scopes.filter(sc => {
      if (sc.feature) {
        return model.config.features.includes(sc.feature);
      } else {
        return dataSourceHasLabels(sc.labels);
      }
    });
  }, [model.config.scopes, model.config.features, dataSourceHasLabels]);

  const getAllowedMetricTypes = React.useCallback(() => {
    let options: MetricType[] = ['Bytes', 'Packets'];
    if (model.selectedViewId === 'topology') {
      if (isPktDrop()) {
        options = options.concat('PktDropBytes', 'PktDropPackets');
      }
      if (isDNSTracking()) {
        options.push('DnsLatencyMs');
      }
      if (isFlowRTT()) {
        options.push('TimeFlowRttNs');
      }
    }
    return options;
  }, [isDNSTracking, isFlowRTT, isPktDrop, model.selectedViewId]);

  const getAvailablePanels = React.useCallback(() => {
    return model.panels.filter(
      panel =>
        (isPktDrop() || !panel.id.includes(droppedIdMatcher)) &&
        (isDNSTracking() || !panel.id.includes(dnsIdMatcher)) &&
        (isFlowRTT() || !panel.id.includes(rttIdMatcher))
    );
  }, [isDNSTracking, isFlowRTT, isPktDrop, model.panels]);

  const getSelectedPanels = React.useCallback(() => {
    return getAvailablePanels().filter(panel => panel.isSelected);
  }, [getAvailablePanels]);

  const getAvailableColumns = React.useCallback(() => {
    return model.columns.filter(
      col =>
        (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
        (!col.feature || model.config.features.includes(col.feature))
    );
  }, [model.columns, model.config.features, isConnectionTracking]);

  const getSelectedColumns = React.useCallback(() => {
    return getAvailableColumns().filter(column => column.isSelected);
  }, [getAvailableColumns]);

  const getFilterDefs = React.useCallback(() => {
    return getFilterDefinitions(model.config.filters, model.config.columns, t).filter(
      fd =>
        (isMultiCluster() || fd.id !== 'cluster_name') &&
        (isZones() || !fd.id.endsWith('_zone')) &&
        (isConnectionTracking() || fd.id !== 'id') &&
        (isDNSTracking() || !fd.id.startsWith('dns_')) &&
        (isPktDrop() || !fd.id.startsWith('pkt_drop_')) &&
        (isFlowRTT() || fd.id !== 'time_flow_rtt') &&
        (isUdn() || fd.id !== 'udns') &&
        (isPktXlat() || fd.id.startsWith('xlat_')) &&
        (isNetEvents() || fd.id !== 'network_events') &&
        (!isPromOnly() || checkFilterAvailable(fd, model.config.promLabels))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.config.columns, model.config.filters, model.config.promLabels, isPromOnly]);

  const getQuickFilters = React.useCallback(
    (c: Config = model.config) => {
      return parseQuickFilters(getFilterDefs(), c.quickFilters);
    },
    [model.config, getFilterDefs]
  );

  const getDefaultFilters = React.useCallback(
    (c: Config = model.config) => {
      // skip default quick filters until https://issues.redhat.com/browse/NETOBSERV-1690
      if (forcedNamespace) {
        return [];
      }
      const quickFilters = getQuickFilters(c);
      return quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
    },
    [model.config, forcedNamespace, getQuickFilters]
  );

  // updates table filters and clears up the table for proper visualization of the
  // updating process
  const updateTableFilters = React.useCallback(
    (f: Filters) => {
      initState.current = initState.current.filter(s => s !== 'urlFiltersPending');
      model.setFilters(f);
      model.setFlows([]);
      model.setMetrics(defaultNetflowMetrics);
      model.setWarning(undefined);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.setFilters, model.setFlows, model.setMetrics, model.setWarning]
  );

  const resetDefaultFilters = React.useCallback(
    (c = model.config) => {
      const def = getDefaultFilters(c);
      updateTableFilters({ backAndForth: model.filters.backAndForth, list: def });
    },
    [model.config, model.filters.backAndForth, getDefaultFilters, updateTableFilters]
  );

  const setFiltersFromURL = React.useCallback(
    (config: Config) => {
      if (forcedFilters === null) {
        //set filters from url or freshly loaded quick filters defaults
        const filtersPromise = getFiltersFromURL(getFilterDefs(), model.disabledFilters);
        if (filtersPromise) {
          initState.current.push('urlFiltersPending');
          filtersPromise.then(updateTableFilters);
        } else {
          resetDefaultFilters(config);
        }
      }
    },
    [model.disabledFilters, forcedFilters, getFilterDefs, resetDefaultFilters, updateTableFilters]
  );

  const buildFlowQuery = React.useCallback((): FlowQuery => {
    const enabledFilters = getEnabledFilters(forcedFilters || model.filters);
    const query: FlowQuery = {
      namespace: forcedNamespace,
      filters: filtersToString(enabledFilters.list, model.match === 'any'),
      limit: limitValues.includes(model.limit) ? model.limit : limitValues[0],
      recordType: model.recordType,
      dataSource: model.dataSource,
      //only manage duplicates when mark is enabled
      dedup: model.config.deduper.mark && !model.showDuplicates,
      packetLoss: model.packetLoss
    };
    if (model.range) {
      if (typeof model.range === 'number') {
        query.timeRange = model.range;
      } else if (typeof model.range === 'object') {
        query.startTime = model.range.from.toString();
        query.endTime = model.range.to.toString();
      }

      const info = computeStepInterval(model.range);
      query.rateInterval = `${info.rateIntervalSeconds}s`;
      query.step = `${info.stepSeconds}s`;
    }
    if (model.selectedViewId === 'table') {
      query.type = 'Flows';
    } else {
      query.aggregateBy = model.metricScope;
      if (model.selectedViewId === 'topology') {
        query.type = model.topologyMetricType;
        query.groups = model.topologyOptions.groupTypes !== 'none' ? model.topologyOptions.groupTypes : undefined;
      } else if (model.selectedViewId === 'overview') {
        query.limit = topValues.includes(model.limit) ? model.limit : topValues[0];
        query.groups = undefined;
      }
    }
    return query;
  }, [
    forcedNamespace,
    forcedFilters,
    model.filters,
    model.match,
    model.limit,
    model.recordType,
    model.dataSource,
    model.config.deduper.mark,
    model.showDuplicates,
    model.packetLoss,
    model.range,
    model.selectedViewId,
    model.topologyMetricType,
    model.metricScope,
    model.topologyOptions.groupTypes
  ]);

  const getFetchFunctions = React.useCallback(() => {
    // check back-and-forth
    const enabledFilters = getEnabledFilters(forcedFilters || model.filters);
    const matchAny = model.match === 'any';
    return getBackAndForthFetch(getFilterDefs(), enabledFilters, matchAny);
  }, [forcedFilters, model.filters, model.match, getFilterDefs]);

  const manageWarnings = React.useCallback(
    (query: Promise<unknown>) => {
      model.setLastRefresh(undefined);
      model.setLastDuration(undefined);
      model.setWarning(undefined);
      Promise.race([query, new Promise((resolve, reject) => setTimeout(reject, 4000, 'slow'))]).then(
        null,
        (reason: string) => {
          if (reason === 'slow') {
            model.setWarning({ type: 'slow', summary: `${t('Query is slow')}` });
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
    if (
      !initState.current.includes('forcedFiltersLoaded') ||
      !initState.current.includes('configLoaded') ||
      initState.current.includes('configLoadError')
    ) {
      console.error('tick skipped', initState.current);
      return;
    } else if (model.isTRModalOpen || model.isOverviewModalOpen || model.isColModalOpen || model.isExportModalOpen) {
      // also skip tick if modal is open
      console.debug('tick skipped since modal is open');
      return;
    } else if (drawerRef.current == null) {
      console.debug('tick called before drawer rendering. Retrying after render');
      setTimeout(tick);
      return;
    }

    model.setLoading(true);
    model.setError(undefined);
    const fq = buildFlowQuery();

    const clearMetrics = () => {
      if (!model.showHistogram) {
        model.setMetrics(defaultNetflowMetrics);
      }
    };
    const clearFlows = () => {
      model.setFlows([]);
    };
    const { getRecords, getMetrics } = getFetchFunctions();
    let promises: Promise<Stats[]> | undefined = undefined;
    switch (model.selectedViewId) {
      case 'table':
        if (allowLoki()) {
          promises = drawerRef.current
            ?.getTableHandle()
            ?.fetch(
              fq,
              model.range,
              model.histogramRange,
              model.showHistogram,
              model.showDuplicates,
              metricsRef,
              getRecords,
              getMetrics,
              model.setFlows,
              model.setMetrics,
              clearMetrics
            );
        } else {
          model.setError(t('Only available when FlowCollector.loki.enable is true'));
        }
        break;
      case 'overview':
        promises = drawerRef.current
          ?.getOverviewHandle()
          ?.fetch(
            fq,
            model.metricScope,
            model.range,
            model.config.features,
            metricsRef,
            getMetrics,
            model.setMetrics,
            clearFlows
          );
        break;
      case 'topology':
        promises = drawerRef.current
          ?.getTopologyHandle()
          ?.fetch(
            fq,
            model.topologyMetricType,
            model.topologyMetricFunction,
            model.range,
            model.config.features,
            metricsRef,
            getMetrics,
            model.setMetrics,
            model.setWarning,
            clearFlows
          );
        break;
      default:
        console.error('tick called on not implemented view Id', model.selectedViewId);
        model.setLoading(false);
        break;
    }
    if (promises) {
      const startDate = new Date();
      model.setStats(undefined);
      manageWarnings(
        promises
          .then(allStats => {
            const stats = allStats.reduce(mergeStats, undefined);
            model.setStats(stats);
          })
          .catch(err => {
            const errStr = getHTTPErrorDetails(err, true);
            const promErrStr = getPromError(errStr);

            // check if it's a prom missing label error and remove filters
            // when the prom error is different to the new one
            if (isPromMissingLabelError(errStr) && promErrStr !== model.chipsPopoverMessage) {
              let filtersDisabled = false;
              model.filters.list.forEach(filter => {
                const fieldName = model.config.columns.find(col => col.filter === filter.def.id)?.field;
                if (!fieldName || errStr.includes(fieldName)) {
                  filtersDisabled = true;
                  filter.values.forEach(fv => {
                    fv.disabled = true;
                  });
                }
              });
              if (filtersDisabled) {
                // update filters to retrigger query without showing the error
                updateTableFilters({ ...model.filters });
                model.setChipsPopoverMessage(promErrStr);
                return;
              }
            }

            // clear flows and metrics + show error
            // always clear chip message to focus on the error
            model.setFlows([]);
            model.setMetrics(defaultNetflowMetrics);
            model.setError(errStr);
            model.setWarning(undefined);
            model.setChipsPopoverMessage(undefined);
          })
          .finally(() => {
            const endDate = new Date();
            model.setLoading(false);
            model.setLastRefresh(endDate);
            model.setLastDuration(endDate.getTime() - startDate.getTime());
          })
      );
    } else if (model.error) {
      // recall tick after drawer rendering to ensure query is properly loaded
      setTimeout(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model.isTRModalOpen,
    model.isOverviewModalOpen,
    model.isColModalOpen,
    model.isExportModalOpen,
    model.showHistogram,
    model.range,
    model.histogramRange,
    model.showDuplicates,
    model.metricScope,
    model.config.features,
    model.topologyMetricType,
    model.topologyMetricFunction,
    model.selectedViewId,
    buildFlowQuery,
    manageWarnings,
    allowLoki
  ]);
  usePoll(tick, model.interval);

  const clearFilters = React.useCallback(() => {
    if (forcedFilters) {
      navigate(netflowTrafficPath);
    } else if (model.filters) {
      //set URL Param to empty value to be able to restore state coming from another page
      const empty: Filters = { ...model.filters, list: [] };
      setURLFilters(empty);
      updateTableFilters(empty);
    }
  }, [forcedFilters, model.filters, updateTableFilters]);

  // Effects

  // invalidate record type if not available
  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      if (model.recordType === 'flowLog' && !isFlow() && isConnectionTracking()) {
        model.setRecordType('allConnections');
      } else if (model.recordType === 'allConnections' && isFlow() && !isConnectionTracking()) {
        model.setRecordType('flowLog');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.config.recordTypes, isConnectionTracking, isFlow, model.recordType]);

  // invalidate datasource if not available
  React.useEffect(() => {
    if (
      initState.current.includes('configLoaded') &&
      ((model.dataSource === 'loki' && !allowLoki() && allowProm()) ||
        (model.dataSource === 'prom' && allowLoki() && !allowProm()))
    ) {
      model.setDataSource('auto');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowLoki, allowProm, model.dataSource]);

  // invalidate packet loss if not available
  React.useEffect(() => {
    if (initState.current.includes('configLoaded') && !isPktDrop() && model.packetLoss !== 'all') {
      model.setPacketLoss('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPktDrop, model.packetLoss, model.setPacketLoss]);

  // invalidate metric scope / group if not available
  React.useEffect(() => {
    if (
      initState.current.includes('configLoaded') &&
      !getAvailableScopes()
        .map(sc => sc.id)
        .includes(model.metricScope)
    ) {
      model.setMetricScope(defaultMetricScope);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAvailableScopes, model.metricScope, model.setMetricScope]);

  // invalidate metric type / function if not available
  React.useEffect(() => {
    if (initState.current.includes('configLoaded') && !getAllowedMetricTypes().includes(model.topologyMetricType)) {
      model.setTopologyMetricType(defaultMetricType);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllowedMetricTypes, model.topologyMetricType, model.setTopologyMetricType]);

  // select columns / panels from local storage
  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      model.setColumns(
        getLocalStorage(
          localStorageColsKey,
          getDefaultColumns(model.config.columns, model.config.fields),
          defaultArraySelectionOptions
        )
      );
      model.setPanels(
        getLocalStorage(
          localStorageOverviewIdsKey,
          getDefaultOverviewPanels(model.config.panels),
          defaultArraySelectionOptions
        )
      );
      setFiltersFromURL(model.config);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.config]);

  // tick on state change
  React.useEffect(() => {
    // init function will be triggered only once
    if (!initState.current.includes('initDone')) {
      initState.current.push('initDone');

      // set url params from local storage saved items at startup if empty
      if (hasEmptyParams() && model.queryParams) {
        setURLParams(model.queryParams);
      }

      if (parentConfig) {
        initState.current.push('configLoaded');
        model.setConfig(parentConfig);
      } else {
        // load config only once and track its state
        if (!initState.current.includes('configLoading')) {
          initState.current.push('configLoading');
          loadConfig().then(v => {
            initState.current.push('configLoaded');
            model.setConfig(v.config);
            if (v.error) {
              initState.current.push('configLoadError');
              model.setError(v.error);
            }
          });
        }
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

    if (!initState.current.includes('urlFiltersPending')) {
      tick();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.filters, forcedFilters, model.config, tick, model.setConfig]);

  // Rewrite URL params on state change
  React.useEffect(() => {
    //with forced filters in url if specified
    if (forcedFilters) {
      setURLFilters(forcedFilters!, true);
    } else if (initState.current.includes('configLoaded')) {
      //write filters in url
      setURLFilters(model.filters, !initState.current.includes('configLoaded'));
    }
  }, [model.filters, forcedFilters]);

  React.useEffect(() => {
    model.setTRModalOpen(false);
    setURLRange(model.range, !initState.current.includes('configLoaded'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.range]);

  React.useEffect(() => {
    setURLLimit(model.limit, !initState.current.includes('configLoaded'));
  }, [model.limit]);

  React.useEffect(() => {
    setURLMatch(model.match, !initState.current.includes('configLoaded'));
  }, [model.match]);

  React.useEffect(() => {
    if (model.config.deduper.mark) {
      setURLShowDup(model.showDuplicates, !initState.current.includes('configLoaded'));
    } else {
      removeURLParam(URLParam.ShowDuplicates);
    }
  }, [model.config.deduper.mark, model.showDuplicates]);

  React.useEffect(() => {
    setURLMetricFunction(
      model.selectedViewId === 'topology' ? model.topologyMetricFunction : undefined,
      !initState.current.includes('configLoaded')
    );
    setURLMetricType(
      model.selectedViewId === 'topology' ? model.topologyMetricType : undefined,
      !initState.current.includes('configLoaded')
    );
  }, [model.topologyMetricFunction, model.selectedViewId, model.topologyMetricType]);

  React.useEffect(() => {
    setURLPacketLoss(model.packetLoss);
  }, [model.packetLoss]);

  React.useEffect(() => {
    setURLRecortType(model.recordType, !initState.current.includes('configLoaded'));
  }, [model.recordType]);

  React.useEffect(() => {
    setURLDatasource(model.dataSource, !initState.current.includes('configLoaded'));
  }, [model.dataSource]);

  // update local storage saved query params
  React.useEffect(() => {
    if (!forcedFilters) {
      model.setQueryParams(getURLParams().toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model.filters,
    model.range,
    model.limit,
    model.match,
    model.showDuplicates,
    model.topologyMetricFunction,
    model.topologyMetricType,
    model.setQueryParams,
    forcedFilters
  ]);

  // update local storage enabled filters
  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      model.setDisabledFilters(getDisabledFiltersRecord(model.filters.list));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.filters]);

  //update page on full screen change
  React.useEffect(() => {
    const header = document.getElementById('page-main-header');
    const sideBar = document.getElementById('page-sidebar');
    const notification = document.getElementsByClassName('co-global-notifications');
    [header, sideBar, ...notification].forEach(e => {
      if (model.isFullScreen) {
        e?.classList.add('hidden');
      } else {
        e?.classList.remove('hidden');
      }
    });
  }, [model.isFullScreen]);

  // Functions
  const clearSelections = () => {
    model.setTRModalOpen(false);
    model.setOverviewModalOpen(false);
    model.setColModalOpen(false);
    model.setSelectedRecord(undefined);
    model.setShowQuerySummary(false);
    model.setSelectedElement(undefined);
  };

  const selectView = (view: ViewId) => {
    clearSelections();
    //save / restore top / limit parameter according to selected view
    if (view === 'overview' && model.selectedViewId !== 'overview') {
      model.setLastLimit(model.limit);
      model.setLimit(model.lastTop);
    } else if (view !== 'overview' && model.selectedViewId === 'overview') {
      model.setLastTop(model.limit);
      model.setLimit(model.lastLimit);
    }

    if (view !== model.selectedViewId) {
      model.setFlows([]);
      model.setMetrics(defaultNetflowMetrics);
      if (!initState.current.includes('configLoadError')) {
        model.setError(undefined);
      }
    }
    model.setSelectedViewId(view);
  };

  // Views
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
                range={model.range}
                setRange={model.setRange}
                openCustomModal={() => model.setTRModalOpen(true)}
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
                disabled={model.showHistogram || typeof model.range !== 'number'}
                interval={model.interval}
                setInterval={model.setInterval}
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
            icon={<SyncAltIcon style={{ animation: `spin ${model.loading ? 1 : 0}s linear infinite` }} />}
          />
        </FlexItem>
      </Flex>
    );
  };

  const pageHeader = () => {
    return (
      <div id="pageHeader">
        <Flex direction={{ default: 'row' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Title headingLevel={TextVariants.h1}>{t('Network Traffic')}</Title>
          </FlexItem>
          <FlexItem>{actions()}</FlexItem>
        </Flex>
      </div>
    );
  };

  const isShowViewOptions =
    model.selectedViewId === 'table' ? model.showViewOptions && !model.showHistogram : model.showViewOptions;
  const isForced = forcedFilters || forcedNamespace;

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection" className={`${isDarkTheme ? 'dark' : 'light'} ${isTab ? 'tab' : ''}`}>
      {
        //display title only if forced filters is not set
        !forcedFilters && !forcedNamespace && pageHeader()
      }
      {!_.isEmpty(getFilterDefs()) && (
        <Flex direction={{ default: 'row' }} style={{ paddingRight: isForced ? '1.5rem' : undefined }}>
          <FlexItem style={{ paddingTop: isForced ? '1.8rem' : undefined }} flex={{ default: 'flex_1' }}>
            <FiltersToolbar
              {...model}
              id="filter-toolbar"
              setFilters={updateTableFilters}
              clearFilters={clearFilters}
              resetFilters={resetDefaultFilters}
              queryOptionsProps={{
                ...model,
                allowLoki: allowLoki(),
                allowProm: allowProm(),
                allowFlow: isFlow(),
                allowConnection: isConnectionTracking(),
                allowShowDuplicates: model.selectedViewId === 'table' && model.recordType !== 'allConnections',
                deduperMark: model.config.deduper.mark,
                allowPktDrops: isPktDrop(),
                useTopK: model.selectedViewId === 'overview'
              }}
              forcedFilters={forcedFilters}
              quickFilters={getQuickFilters()}
              filterDefinitions={getFilterDefs()}
            />
          </FlexItem>
          {isForced && <FlexItem style={{ alignSelf: 'flex-start' }}>{actions()}</FlexItem>}
        </Flex>
      )}
      {
        <TabsContainer
          {...model}
          isDarkTheme={isDarkTheme}
          selectView={selectView}
          isAllowLoki={allowLoki()}
          isShowViewOptions={isShowViewOptions}
          style={{ paddingRight: isForced ? '1.5rem' : undefined }}
        />
      }
      {model.selectedViewId === 'table' && model.showHistogram && (
        <HistogramToolbar
          {...model}
          isDarkTheme={isDarkTheme}
          totalMetric={model.metrics.totalFlowCountMetric}
          guidedTourHandle={guidedTourRef.current}
          resetRange={() => model.setRange(defaultTimeRange)}
          tick={tick}
        />
      )}
      {isShowViewOptions && (
        <ViewOptionsToolbar
          {...model}
          isDarkTheme={isDarkTheme}
          allowedTypes={getAllowedMetricTypes()}
          scopes={getAvailableScopes()}
          ref={searchRef}
        />
      )}
      {
        <NetflowTrafficDrawer
          {...model}
          ref={drawerRef}
          isDarkTheme={isDarkTheme}
          defaultFilters={getDefaultFilters()}
          currentState={initState.current}
          panels={getSelectedPanels()}
          allowPktDrop={isPktDrop()}
          allowDNSMetric={isDNSTracking()}
          allowRTTMetric={isFlowRTT()}
          resetDefaultFilters={resetDefaultFilters}
          clearFilters={clearFilters}
          filterDefinitions={getFilterDefs()}
          searchHandle={searchRef.current}
          scopes={getAvailableScopes()}
          canSwitchTypes={isFlow() && isConnectionTracking()}
          clearSelections={clearSelections}
          availableColumns={getAvailableColumns()}
          maxChunkAge={model.config.maxChunkAgeMs}
          selectedColumns={getSelectedColumns()}
        />
      }
      {initState.current.includes('initDone') && (
        <Modals
          {...model}
          panels={getAvailablePanels()}
          availableColumns={getAvailableColumns()}
          flowQuery={buildFlowQuery()}
          filters={(forcedFilters || model.filters).list}
          maxChunkAge={model.config.maxChunkAgeMs}
        />
      )}
      <GuidedTourPopover id="netobserv" ref={guidedTourRef} isDark={isDarkTheme} />
      <ChipsPopover
        chipsPopoverMessage={model.chipsPopoverMessage}
        setChipsPopoverMessage={model.setChipsPopoverMessage}
      />
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
