import { isModelFeatureFlag, ModelFeatureFlag, useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, PageSection, Text, TextVariants } from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultNetflowMetrics,
  FunctionMetrics,
  getFunctionMetricKey,
  getRateMetricKey,
  initFunctionMetricKeys,
  initRateMetricKeys,
  RateMetrics,
  Stats,
  TotalFunctionMetrics,
  TotalRateMetrics
} from '../api/loki';
import { getFlowGenericMetrics } from '../api/routes';
import { Config } from '../model/config';
import { Filters, getDisabledFiltersRecord, getEnabledFilters } from '../model/filters';
import { filtersToString, FlowQuery, FlowScope, isTimeMetric, MetricFunction, MetricType } from '../model/flow-query';
import { MetricScopeOptions } from '../model/metrics';
import { netflowTrafficModel } from '../model/netflow-traffic';
import { parseQuickFilters } from '../model/quick-filters';
import { getGroupsForScope, TopologyGroupTypes } from '../model/topology';
import { getFetchFunctions as getBackAndForthFetch } from '../utils/back-and-forth';
import { ColumnsId, getDefaultColumns } from '../utils/columns';
import { loadConfig } from '../utils/config';
import { ContextSingleton } from '../utils/context';
import { computeStepInterval } from '../utils/datetime';
import { getHTTPErrorDetails, getPromUnsupportedError, isPromUnsupportedError } from '../utils/errors';
import { checkFilterAvailable, getFilterDefinitions } from '../utils/filter-definitions';
import { mergeFlowReporters } from '../utils/flows';
import {
  defaultArraySelectionOptions,
  getLocalStorage,
  localStorageColsKey,
  localStorageOverviewIdsKey
} from '../utils/local-storage-hook';
import { mergeStats } from '../utils/metrics';
import {
  customPanelMatcher,
  dnsIdMatcher,
  droppedIdMatcher,
  getDefaultOverviewPanels,
  parseCustomMetricId,
  rttIdMatcher
} from '../utils/overview-panels';
import { usePoll } from '../utils/poll-hook';
import {
  defaultTimeRange,
  getFiltersFromURL,
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
import NetflowTrafficDrawer from './drawer/drawer';
import { rateMetricFunctions, timeMetricFunctions } from './dropdowns/metric-function-dropdown';
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
import HistogramToolbar from './toolbar/histogram-toolbar';
import ViewOptionsToolbar from './toolbar/view-options-toolbar';

export type ViewId = 'overview' | 'table' | 'topology';

export interface NetflowTrafficProps {
  forcedFilters?: Filters | null;
  isTab?: boolean;
  parentConfig?: Config;
}

export const NetflowTraffic: React.FC<NetflowTrafficProps> = ({ forcedFilters, isTab, parentConfig }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const isDarkTheme = useTheme();
  const [extensions] = useResolvedExtensions<ModelFeatureFlag>(isModelFeatureFlag);
  ContextSingleton.setContext(extensions);

  const model = netflowTrafficModel();

  // set url params from local storage saved items at startup if empty
  if (hasEmptyParams() && model.queryParams) {
    setURLParams(model.queryParams);
  }

  // Refs
  const metricsRef = React.useRef(model.metrics);
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

  const getAllowedScopes = React.useCallback(() => {
    const scopes: FlowScope[] = [];
    if (isMultiCluster()) {
      scopes.push('cluster');
    }
    if (isZones()) {
      scopes.push('zone');
    }
    if (dataSourceHasLabels(['SrcK8S_HostName', 'DstK8S_HostName'])) {
      scopes.push('host');
    }
    if (dataSourceHasLabels(['SrcK8S_Namespace', 'DstK8S_Namespace'])) {
      scopes.push('namespace');
    }
    if (dataSourceHasLabels(['SrcK8S_OwnerName', 'DstK8S_OwnerName'])) {
      scopes.push('owner');
    }
    if (dataSourceHasLabels(['SrcK8S_Name', 'DstK8S_Name'])) {
      scopes.push('resource');
    }
    return scopes;
  }, [isMultiCluster, isZones, dataSourceHasLabels]);

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

  const getAvailableColumns = React.useCallback(
    (isSidePanel = false) => {
      return model.columns.filter(
        col =>
          (!isSidePanel || !col.isCommon) &&
          (isConnectionTracking() || ![ColumnsId.recordtype, ColumnsId.hashid].includes(col.id)) &&
          (!col.feature || model.config.features.includes(col.feature))
      );
    },
    [model.columns, model.config.features, isConnectionTracking]
  );

  const updateTopologyMetricType = React.useCallback(
    (metricType: MetricType) => {
      if (isTimeMetric(metricType)) {
        // fallback on average if current function not available for time queries
        if (!timeMetricFunctions.includes(model.topologyMetricFunction)) {
          model.setTopologyMetricFunction('avg');
        }
      } else {
        // fallback on average if current function not available for rate queries
        if (!rateMetricFunctions.includes(model.topologyMetricFunction)) {
          model.setTopologyMetricFunction('avg');
        }
      }
      model.setTopologyMetricType(metricType);
    },
    [model.topologyMetricFunction, model.setTopologyMetricFunction, model.setTopologyMetricType]
  );

  const getFilterDefs = React.useCallback(() => {
    return getFilterDefinitions(model.config.filters, model.config.columns, t).filter(
      fd =>
        (isMultiCluster() || fd.id !== 'cluster_name') &&
        (isZones() || !fd.id.endsWith('_zone')) &&
        (isConnectionTracking() || fd.id !== 'id') &&
        (isDNSTracking() || !fd.id.startsWith('dns_')) &&
        (isPktDrop() || !fd.id.startsWith('pkt_drop_')) &&
        (isFlowRTT() || fd.id !== 'time_flow_rtt') &&
        (!isPromOnly() || checkFilterAvailable(fd, model.config.promLabels))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.config.columns, model.config.filters, model.config.promLabels, isPromOnly]);

  const getQuickFilters = React.useCallback(
    (c = model.config) => {
      return parseQuickFilters(getFilterDefs(), c.quickFilters);
    },
    [model.config, getFilterDefs]
  );

  const getDefaultFilters = React.useCallback(
    (c = model.config) => {
      const quickFilters = getQuickFilters(c);
      return quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
    },
    [model.config, getQuickFilters]
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
    [model.setFilters, model.setFlows]
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
        query.groups =
          model.topologyOptions.groupTypes !== TopologyGroupTypes.none ? model.topologyOptions.groupTypes : undefined;
      } else if (model.selectedViewId === 'overview') {
        query.limit = topValues.includes(model.limit) ? model.limit : topValues[0];
        query.groups = undefined;
      }
    }
    return query;
  }, [
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

  const fetchTable = React.useCallback(
    (fq: FlowQuery) => {
      if (!model.showHistogram) {
        model.setMetrics(defaultNetflowMetrics);
      }

      let currentMetrics = metricsRef.current;
      const { getRecords, getMetrics } = getFetchFunctions();

      // table query is based on histogram range if available
      const tableQuery = { ...fq };
      if (model.histogramRange) {
        tableQuery.startTime = model.histogramRange.from.toString();
        tableQuery.endTime = model.histogramRange.to.toString();
      }
      const promises: Promise<Stats>[] = [
        getRecords(tableQuery).then(res => {
          const flows = model.showDuplicates ? res.records : mergeFlowReporters(res.records);
          model.setFlows(flows);
          return res.stats;
        })
      ];
      if (model.showHistogram) {
        promises.push(
          getMetrics({ ...fq, function: 'count', aggregateBy: 'app', type: 'Flows' }, model.range).then(res => {
            const totalFlowCountMetric = res.metrics[0];
            currentMetrics = { ...currentMetrics, totalFlowCountMetric };
            model.setMetrics(currentMetrics);
            return res.stats;
          })
        );
      } else {
        currentMetrics = { ...currentMetrics, totalRateMetric: undefined };
        model.setMetrics(currentMetrics);
      }
      return Promise.all(promises);
    },
    [getFetchFunctions, model.histogramRange, model.showHistogram, model.showDuplicates, model.range]
  );

  const fetchOverview = React.useCallback(
    (fq: FlowQuery) => {
      model.setFlows([]);

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
              getMetrics({ ...fq, function: 'rate', type: key === 'bytes' ? 'Bytes' : 'Packets' }, model.range).then(
                res => {
                  //set matching value and apply changes on the entire object to trigger refresh
                  rateMetrics[key] = res.metrics;
                  currentMetrics = { ...currentMetrics, rateMetrics };
                  model.setMetrics(currentMetrics);
                  return res.stats;
                }
              )
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
              model.range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalRateMetric[key] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalRateMetric };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });
      } else {
        currentMetrics = { ...currentMetrics, rateMetrics: undefined, totalRateMetric: undefined };
        model.setMetrics(currentMetrics);
      }

      const droppedPanels = selectedPanels.filter(p => p.id.includes(droppedIdMatcher));
      if (!_.isEmpty(droppedPanels)) {
        //run same queries for drops
        const droppedRateMetrics = initRateMetricKeys(droppedPanels.map(p => p.id)) as RateMetrics;
        (Object.keys(droppedRateMetrics) as (keyof typeof droppedRateMetrics)[]).map(key => {
          promises.push(
            getMetrics(
              { ...fq, function: 'rate', type: key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets' },
              model.range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              droppedRateMetrics[key] = res.metrics;
              currentMetrics = { ...currentMetrics, droppedRateMetrics };
              model.setMetrics(currentMetrics);
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
              model.range
            ).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalDroppedRateMetric[key] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalDroppedRateMetric };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        //get drop state & cause
        promises.push(
          ...[
            getFlowGenericMetrics(
              { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestState' },
              model.range
            ).then(res => {
              currentMetrics = { ...currentMetrics, droppedStateMetrics: res.metrics };
              model.setMetrics(currentMetrics);
              return res.stats;
            }),
            getFlowGenericMetrics(
              { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestDropCause' },
              model.range
            ).then(res => {
              currentMetrics = { ...currentMetrics, droppedCauseMetrics: res.metrics };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          ]
        );
      } else {
        model.setMetrics({
          ...currentMetrics,
          droppedRateMetrics: undefined,
          totalDroppedRateMetric: undefined,
          droppedStateMetrics: undefined,
          droppedCauseMetrics: undefined
        });
      }

      const dnsPanels = selectedPanels.filter(p => p.id.includes(dnsIdMatcher));
      if (model.config.features.includes('dnsTracking') && !_.isEmpty(dnsPanels)) {
        //set dns metrics
        const dnsLatencyMetrics = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as FunctionMetrics;
        (Object.keys(dnsLatencyMetrics) as (keyof typeof dnsLatencyMetrics)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, type: 'DnsLatencyMs' }, model.range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              dnsLatencyMetrics[fn] = res.metrics;
              currentMetrics = { ...currentMetrics, dnsLatencyMetrics };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        const totalDnsLatencyMetric = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as TotalFunctionMetrics;
        (Object.keys(totalDnsLatencyMetric) as (keyof typeof totalDnsLatencyMetric)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'DnsLatencyMs' }, model.range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalDnsLatencyMetric[fn] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalDnsLatencyMetric };
              model.setMetrics(currentMetrics);
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
                model.range
              ).then(res => {
                currentMetrics = { ...currentMetrics, dnsRCodeMetrics: res.metrics };
                model.setMetrics(currentMetrics);
                return res.stats;
              }),
              getFlowGenericMetrics(
                { ...fq, aggregateBy: 'app', function: 'count', type: 'DnsFlows' },
                model.range
              ).then(res => {
                currentMetrics = { ...currentMetrics, totalDnsCountMetric: res.metrics[0] };
                model.setMetrics(currentMetrics);
                return res.stats;
              })
            ]
          );
        }
      } else {
        model.setMetrics({
          ...currentMetrics,
          dnsLatencyMetrics: undefined,
          dnsRCodeMetrics: undefined,
          totalDnsLatencyMetric: undefined,
          totalDnsCountMetric: undefined
        });
      }

      const rttPanels = selectedPanels.filter(p => p.id.includes(rttIdMatcher));
      if (model.config.features.includes('flowRTT') && !_.isEmpty(rttPanels)) {
        //set RTT metrics
        const rttMetrics = initFunctionMetricKeys(rttPanels.map(p => p.id)) as FunctionMetrics;
        (Object.keys(rttMetrics) as (keyof typeof rttMetrics)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, type: 'TimeFlowRttNs' }, model.range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              rttMetrics[fn] = res.metrics;
              currentMetrics = { ...currentMetrics, rttMetrics };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });

        const totalRttMetric = initFunctionMetricKeys(rttPanels.map(p => p.id)) as TotalFunctionMetrics;
        (Object.keys(totalRttMetric) as (keyof typeof totalRttMetric)[]).map(fn => {
          promises.push(
            getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'TimeFlowRttNs' }, model.range).then(res => {
              //set matching value and apply changes on the entire object to trigger refresh
              totalRttMetric[fn] = res.metrics[0];
              currentMetrics = { ...currentMetrics, totalRttMetric };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
          );
        });
      } else {
        model.setMetrics({ ...currentMetrics, rttMetrics: undefined, totalRttMetric: undefined });
      }

      const customPanels = selectedPanels.filter(p => p.id.startsWith(customPanelMatcher));
      if (!_.isEmpty(customPanels)) {
        //set custom metrics
        customPanels
          .map(p => p.id)
          .forEach(id => {
            const parsedId = parseCustomMetricId(id);
            const key = id.replaceAll(customPanelMatcher + '_', '');
            const getMetricFunc = parsedId.aggregateBy ? getFlowGenericMetrics : getMetrics;
            if (parsedId.isValid) {
              promises.push(
                ...[
                  getMetricFunc(
                    {
                      ...fq,
                      type: parsedId.type,
                      function: parsedId.fn,
                      aggregateBy: parsedId.aggregateBy || model.metricScope
                    },
                    model.range
                  ).then(res => {
                    //set matching value and apply changes on the entire object to trigger refresh
                    currentMetrics = {
                      ...currentMetrics,
                      customMetrics: currentMetrics.customMetrics.set(key, res.metrics)
                    };
                    model.setMetrics(currentMetrics);
                    return res.stats;
                  }),
                  getMetricFunc(
                    {
                      ...fq,
                      type: parsedId.type,
                      function: parsedId.fn,
                      aggregateBy: 'app'
                    },
                    model.range
                  ).then(res => {
                    //set matching value and apply changes on the entire object to trigger refresh
                    currentMetrics = {
                      ...currentMetrics,
                      totalCustomMetrics: currentMetrics.totalCustomMetrics.set(key, res.metrics[0])
                    };
                    model.setMetrics(currentMetrics);
                    return res.stats;
                  })
                ]
              );
            }
          });
      }

      return Promise.all(promises);
    },
    [getSelectedPanels, getFetchFunctions, model.config.features, model.range, model.metricScope]
  );

  const fetchTopology = React.useCallback(
    (fq: FlowQuery) => {
      model.setFlows([]);

      const droppedType = model.config.features.includes('pktDrop')
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
            function: isTimeMetric(model.topologyMetricType) ? (model.topologyMetricFunction as MetricFunction) : 'rate'
          },
          model.range
        ).then(res => {
          if (['Bytes', 'Packets'].includes(model.topologyMetricType)) {
            const rateMetrics = {} as RateMetrics;
            rateMetrics[getRateMetricKey(model.topologyMetricType)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics, dnsLatencyMetrics: undefined, rttMetrics: undefined };
            model.setMetrics(currentMetrics);
          } else if (['PktDropBytes', 'PktDropPackets'].includes(model.topologyMetricType)) {
            const droppedRateMetrics = {} as RateMetrics;
            droppedRateMetrics[getRateMetricKey(model.topologyMetricType)] = res.metrics;
            currentMetrics = { ...currentMetrics, droppedRateMetrics };
            model.setMetrics(currentMetrics);
          } else if (['DnsLatencyMs'].includes(model.topologyMetricType)) {
            const dnsLatencyMetrics = {} as FunctionMetrics;
            dnsLatencyMetrics[getFunctionMetricKey(model.topologyMetricFunction)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics, rttMetrics: undefined };
            model.setMetrics(currentMetrics);
          } else if (['TimeFlowRttNs'].includes(model.topologyMetricType)) {
            const rttMetrics = {} as FunctionMetrics;
            rttMetrics[getFunctionMetricKey(model.topologyMetricFunction)] = res.metrics;
            currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics: undefined, rttMetrics };
            model.setMetrics(currentMetrics);
          }
          return res.stats;
        })
      ];

      if (droppedType) {
        promises.push(
          getMetrics({ ...fq, type: droppedType }, model.range)
            .then(res => {
              const droppedRateMetrics = {} as RateMetrics;
              droppedRateMetrics[getRateMetricKey(model.topologyMetricType)] = res.metrics;
              currentMetrics = { ...currentMetrics, droppedRateMetrics };
              model.setMetrics(currentMetrics);
              return res.stats;
            })
            .catch(err => {
              // Error might occur for instance when fetching node-based topology with drop feature enabled, and Loki disabled
              // We don't want to break the whole topology due to missing drops enrichement
              let strErr = getHTTPErrorDetails(err, true);
              if (isPromUnsupportedError(strErr)) {
                strErr = getPromUnsupportedError(strErr);
              }
              model.setWarning({
                type: 'cantfetchdrops',
                summary: t('Could not fetch drop information'),
                details: strErr
              });
              return { numQueries: 0, dataSources: [], limitReached: false };
            })
        );
      } else if (!['PktDropBytes', 'PktDropPackets'].includes(model.topologyMetricType)) {
        currentMetrics = { ...currentMetrics, droppedRateMetrics: undefined };
        model.setMetrics(currentMetrics);
      }
      return Promise.all(promises);
    },
    [
      model.config.features,
      getFetchFunctions,
      model.topologyMetricType,
      model.topologyMetricFunction,
      model.range,
      model.setWarning
    ]
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
    }

    model.setLoading(true);
    model.setError(undefined);
    const fq = buildFlowQuery();

    let promises: Promise<Stats[]> | undefined = undefined;
    switch (model.selectedViewId) {
      case 'table':
        if (allowLoki()) {
          promises = fetchTable(fq);
        } else {
          model.setError(t('Only available when FlowCollector.loki.enable is true'));
        }
        break;
      case 'overview':
        promises = fetchOverview(fq);
        break;
      case 'topology':
        promises = fetchTopology(fq);
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
            model.setFlows([]);
            model.setMetrics(defaultNetflowMetrics);
            model.setError(getHTTPErrorDetails(err, true));
            model.setWarning(undefined);
          })
          .finally(() => {
            const endDate = new Date();
            model.setLoading(false);
            model.setLastRefresh(endDate);
            model.setLastDuration(endDate.getTime() - startDate.getTime());
          })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    model.isTRModalOpen,
    model.isOverviewModalOpen,
    model.isColModalOpen,
    model.isExportModalOpen,
    buildFlowQuery,
    model.selectedViewId,
    fetchTable,
    fetchOverview,
    fetchTopology,
    manageWarnings,
    allowLoki
  ]);
  usePoll(tick, model.interval);

  const setMetricScope = React.useCallback(
    (scope: FlowScope) => {
      model.setMetricScope(scope);
      // Invalidate groups if necessary, when metrics scope changed
      const groups = getGroupsForScope(scope as MetricScopeOptions);
      if (!groups.includes(model.topologyOptions.groupTypes)) {
        model.setTopologyOptions({ ...model.topologyOptions, groupTypes: TopologyGroupTypes.none });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [model.setMetricScope, model.topologyOptions, model.setTopologyOptions]
  );

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
  React.useEffect(() => {
    if (initState.current.includes('configLoaded')) {
      if (model.recordType === 'flowLog' && !isFlow() && isConnectionTracking()) {
        model.setRecordType('allConnections');
      } else if (model.recordType === 'allConnections' && isFlow() && !isConnectionTracking()) {
        model.setRecordType('flowLog');
      }
    }
  }, [model.config.recordTypes, isConnectionTracking, isFlow, model.recordType]);

  React.useEffect(() => {
    if (
      initState.current.includes('configLoaded') &&
      ((model.dataSource === 'loki' && !allowLoki() && allowProm()) ||
        (model.dataSource === 'prom' && allowLoki() && !allowProm()))
    ) {
      model.setDataSource('auto');
    }
  }, [allowLoki, allowProm, model.dataSource]);

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
    } else if (!_.isEmpty(model.filters) && !_.isEmpty(model.filters.list)) {
      //write filters in url if not empty
      setURLFilters(model.filters, !initState.current.includes('configLoaded'));
    }
  }, [model.filters, forcedFilters]);

  React.useEffect(() => {
    model.setTRModalOpen(false);
    setURLRange(model.range, !initState.current.includes('configLoaded'));
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

  // update local storage saved query params
  React.useEffect(() => {
    if (!forcedFilters) {
      model.setQueryParams(getURLParams().toString());
    }
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
    model.setDisabledFilters(getDisabledFiltersRecord(model.filters.list));
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
  const pageHeader = () => {
    return (
      <div id="pageHeader">
        <Flex direction={{ default: 'row' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Text component={TextVariants.h1}>{t('Network Traffic')}</Text>
          </FlexItem>
          <FlexItem>
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
          </FlexItem>
        </Flex>
      </div>
    );
  };

  const isShowViewOptions =
    model.selectedViewId === 'table' ? model.showViewOptions && !model.showHistogram : model.showViewOptions;

  return !_.isEmpty(extensions) ? (
    <PageSection id="pageSection" className={`${isDarkTheme ? 'dark' : 'light'} ${isTab ? 'tab' : ''}`}>
      {
        //display title only if forced filters is not set
        !forcedFilters && pageHeader()
      }
      {!_.isEmpty(getFilterDefs()) && (
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
      )}
      {
        <TabsContainer
          {...model}
          isDarkTheme={isDarkTheme}
          selectView={selectView}
          isAllowLoki={allowLoki()}
          isShowViewOptions={isShowViewOptions}
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
          setMetricType={updateTopologyMetricType}
          allowPktDrop={isPktDrop()}
          allowDNSMetric={isDNSTracking()}
          allowRTTMetric={isFlowRTT()}
          allowedScopes={getAllowedScopes()}
          setMetricScope={setMetricScope}
        />
      )}
      {
        <NetflowTrafficDrawer
          {...model}
          isDarkTheme={isDarkTheme}
          defaultFilters={getDefaultFilters()}
          currentState={initState.current}
          panels={getSelectedPanels()}
          allowPktDrop={isPktDrop()}
          allowDNSMetric={isDNSTracking()}
          allowRTTMetric={isFlowRTT()}
          setMetricScope={setMetricScope}
          resetDefaultFilters={resetDefaultFilters}
          clearFilters={clearFilters}
          filterDefinitions={getFilterDefs()}
          searchHandle={searchRef.current}
          allowedScopes={getAllowedScopes()}
          canSwitchTypes={isFlow() && isConnectionTracking()}
          clearSelections={clearSelections}
          availableColumns={getAvailableColumns(true)}
          maxChunkAge={model.config.maxChunkAgeMs}
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
    </PageSection>
  ) : null;
};

export default NetflowTraffic;
