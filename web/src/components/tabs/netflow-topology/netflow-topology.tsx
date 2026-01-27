import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner, Text } from '@patternfly/react-core';
import { Visualization, VisualizationProvider } from '@patternfly/react-topology';
import _ from 'lodash';
import { murmur3 } from 'murmurhash-js';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlowMetricsResult,
  FunctionMetrics,
  getFunctionMetricKey,
  getRateMetricKey,
  MetricError,
  NetflowMetrics,
  RateMetrics,
  Stats,
  TopologyMetrics
} from '../../../api/loki';
import { getAlerts, getK8SUDNIds } from '../../../api/routes';
import { Config, Feature } from '../../../model/config';
import { FilterDefinition, Filters } from '../../../model/filters';
import {
  FlowQuery,
  FlowScope,
  isTimeMetric,
  MetricFunction,
  MetricType,
  StatFunction
} from '../../../model/flow-query';
import { ScopeConfigDef } from '../../../model/scope';
import { GraphElementPeer, LayoutName, TopologyOptions } from '../../../model/topology';
import { TimeRange } from '../../../utils/datetime';
import { getHTTPErrorDetails } from '../../../utils/errors';
import { observeDOMRect } from '../../../utils/metrics-helper';
import { buildStats, HealthStat } from '../../health/health-helper';
import { SearchEvent, SearchHandle } from '../../search/search';
import { ScopeSlider } from '../../slider/scope-slider';
import componentFactory from './2d/componentFactories/componentFactory';
import stylesComponentFactory from './2d/componentFactories/stylesComponentFactory';
import layoutFactory from './2d/layouts/layoutFactory';
import { TopologyContent } from './2d/topology-content';
import './netflow-topology.css';

export type NetflowTopologyHandle = {
  fetch: (
    fq: FlowQuery,
    metricType: MetricType,
    metricFunction: StatFunction,
    range: number | TimeRange,
    features: Feature[],
    metricsRef: React.MutableRefObject<NetflowMetrics>,
    getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
    setMetrics: (v: NetflowMetrics) => void,
    initFunction: () => void
  ) => Promise<Stats[]> | undefined;
  fetchUDNs: () => Promise<string[]>;
};

export interface NetflowTopologyProps {
  ref?: React.Ref<NetflowTopologyHandle>;
  loading?: boolean;
  k8sModels: { [key: string]: K8sModel };
  metricFunction: StatFunction;
  metricType: MetricType;
  metricScope: FlowScope;
  expectedNodes: string[];
  setMetricScope: (ms: FlowScope) => void;
  metrics: TopologyMetrics[];
  droppedMetrics: TopologyMetrics[];
  options: TopologyOptions;
  setOptions: (o: TopologyOptions) => void;
  filters: Filters;
  filterDefinitions: FilterDefinition[];
  setFilters: (v: Filters) => void;
  selected: GraphElementPeer | undefined;
  onSelect: (e: GraphElementPeer | undefined) => void;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  isDark?: boolean;
  scopes: ScopeConfigDef[];
  resetDefaultFilters?: (c?: Config) => void;
  clearFilters?: () => void;
}

// eslint-disable-next-line react/display-name
export const NetflowTopology: React.FC<NetflowTopologyProps> = React.forwardRef(
  (props, ref: React.Ref<NetflowTopologyHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    const containerRef = React.createRef<HTMLDivElement>();
    const [containerSize, setContainerSize] = React.useState<DOMRect>({ width: 0, height: 0 } as DOMRect);
    const [controller, setController] = React.useState<Visualization>();
    const [alerts, setAlerts] = React.useState<{ [dimension: string]: HealthStat[] }>({});
    const [lastStatsUpdateTime, setLastStatsUpdateTime] = React.useState<number>(0);
    const statsRefreshIntervalMs = 30000; // Refresh stats every 30 seconds if outdated

    //show fully dropped metrics if no metrics available
    const displayedMetrics = _.isEmpty(props.metrics) ? props.droppedMetrics : props.metrics;

    const fetchAlerts = React.useCallback(async () => {
      try {
        // matching netobserv="true" catches all alerts designed for netobserv (not necessarily owned by it)
        const res = await getAlerts('netobserv="true"');
        const rules = res.data.groups.flatMap(group => {
          // Inject rule id, for links to the alerting page
          // Warning: ID generation may in theory differ with openshift version (in practice, this has been stable across versions since 4.12 at least)
          // See https://github.com/openshift/console/blob/29374f38308c4ebe9ea461a5d69eb3e4956c7086/frontend/public/components/monitoring/utils.ts#L47-L56
          group.rules.forEach(r => {
            const key = [
              group.file,
              group.name,
              r.name,
              r.duration,
              r.query,
              ..._.map(r.labels, (k, v) => `${k}=${v}`)
            ].join(',');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            r.id = String(murmur3(key, 'monitoring-salt' as any));
          });
          return group.rules;
        });

        // Build topology alerts (includes all alert states, skip inactive rules and recording rules)
        const stats = buildStats(rules, [], [], true);
        // Convert HealthStats to dictionary format for topology
        const topologyAlerts: { [dimension: string]: HealthStat[] } = {
          byNamespace: stats.byNamespace,
          byNode: stats.byNode,
          byOwner: stats.byOwner
        };
        setAlerts(topologyAlerts);
        setLastStatsUpdateTime(Date.now());
      } catch (err) {
        console.log('Could not fetch topology alerts:', err);
        setAlerts({});
      }
    }, []);

    // Trigger stats refresh if outdated
    const refreshResourceStatsIfNeeded = React.useCallback(() => {
      const now = Date.now();
      if (now - lastStatsUpdateTime > statsRefreshIntervalMs) {
        fetchAlerts();
      }
    }, [lastStatsUpdateTime, statsRefreshIntervalMs, fetchAlerts]);

    const fetch = React.useCallback(
      (
        fq: FlowQuery,
        metricType: MetricType,
        metricFunction: StatFunction,
        range: number | TimeRange,
        features: Feature[],
        metricsRef: React.MutableRefObject<NetflowMetrics>,
        getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
        setMetrics: (v: NetflowMetrics) => void,
        initFunction: () => void
      ) => {
        initFunction();

        // Refresh resource stats if outdated
        refreshResourceStatsIfNeeded();

        const droppedType = features.includes('pktDrop')
          ? fq.type === 'Bytes'
            ? 'PktDropBytes'
            : fq.type === 'Packets'
            ? 'PktDropPackets'
            : undefined
          : undefined;
        let currentMetrics = { ...metricsRef.current, errors: [] as MetricError[] };

        const promises: Promise<Stats>[] = [
          getMetrics(
            {
              ...fq,
              function: isTimeMetric(metricType) ? (metricFunction as MetricFunction) : 'rate'
            },
            range
          ).then(res => {
            if (['Bytes', 'Packets'].includes(metricType)) {
              const rateMetrics = {} as RateMetrics;
              rateMetrics[getRateMetricKey(metricType)] = res.metrics;
              currentMetrics = { ...currentMetrics, rateMetrics, dnsLatencyMetrics: undefined, rttMetrics: undefined };
              setMetrics(currentMetrics);
            } else if (['PktDropBytes', 'PktDropPackets'].includes(metricType)) {
              const droppedRateMetrics = {} as RateMetrics;
              droppedRateMetrics[getRateMetricKey(metricType)] = res.metrics;
              currentMetrics = { ...currentMetrics, droppedRateMetrics };
              setMetrics(currentMetrics);
            } else if (['DnsLatencyMs'].includes(metricType)) {
              const dnsLatencyMetrics = {} as FunctionMetrics;
              dnsLatencyMetrics[getFunctionMetricKey(metricFunction)] = res.metrics;
              currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics, rttMetrics: undefined };
              setMetrics(currentMetrics);
            } else if (['TimeFlowRttNs'].includes(metricType)) {
              const rttMetrics = {} as FunctionMetrics;
              rttMetrics[getFunctionMetricKey(metricFunction)] = res.metrics;
              currentMetrics = { ...currentMetrics, rateMetrics: undefined, dnsLatencyMetrics: undefined, rttMetrics };
              setMetrics(currentMetrics);
            }
            return res.stats;
          })
        ];

        if (droppedType) {
          promises.push(
            getMetrics({ ...fq, type: droppedType }, range)
              .then(res => {
                const droppedRateMetrics = {} as RateMetrics;
                droppedRateMetrics[getRateMetricKey(metricType)] = res.metrics;
                currentMetrics = { ...currentMetrics, droppedRateMetrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
              .catch(err => {
                // Error might occur for instance when fetching node-based topology with drop feature enabled, and Loki disabled
                // We don't want to break the whole topology due to missing drops enrichement
                const errorMsg = getHTTPErrorDetails(err, true);
                const droppedMetricType = droppedType === 'PktDropBytes' ? t('Dropped bytes') : t('Dropped packets');
                const metricError: MetricError = { metricType: droppedMetricType, error: errorMsg };
                currentMetrics = {
                  ...currentMetrics,
                  errors: [...currentMetrics.errors, metricError]
                };
                setMetrics(currentMetrics);
                return { numQueries: 0, dataSources: [], limitReached: false };
              })
          );
        } else if (!['PktDropBytes', 'PktDropPackets'].includes(metricType)) {
          currentMetrics = { ...currentMetrics, droppedRateMetrics: undefined };
          setMetrics(currentMetrics);
        }
        return Promise.all(promises);
      },
      [t, refreshResourceStatsIfNeeded]
    );

    // Initial fetch and setup update trigger
    React.useEffect(() => {
      fetchAlerts();
    }, [fetchAlerts]);

    const fetchUDNs = React.useCallback(() => {
      // Refresh resource stats if outdated
      refreshResourceStatsIfNeeded();
      return getK8SUDNIds();
    }, [refreshResourceStatsIfNeeded]);

    React.useImperativeHandle(ref, () => ({
      fetch,
      fetchUDNs
    }));

    const getContent = React.useCallback(() => {
      if (!controller || (_.isEmpty(props.metrics) && props.loading)) {
        return (
          <Bullseye data-test="loading-contents">
            <Spinner size="xl" />
          </Bullseye>
        );
      } else if (props.options.layout === LayoutName.threeD) {
        return <Text>{t('Sorry, 3D view is not implemented anymore.')}</Text>;
      } else {
        return (
          <VisualizationProvider data-test="visualization-provider" controller={controller}>
            <TopologyContent
              containerRef={containerRef}
              k8sModels={props.k8sModels}
              expectedNodes={props.expectedNodes}
              metricFunction={props.metricFunction}
              metricType={props.metricType}
              metricScope={props.metricScope}
              setMetricScope={props.setMetricScope}
              scopes={props.scopes}
              metrics={displayedMetrics}
              droppedMetrics={props.droppedMetrics}
              options={props.options}
              setOptions={props.setOptions}
              filters={props.filters}
              filterDefinitions={props.filterDefinitions}
              setFilters={props.setFilters}
              selected={props.selected}
              onSelect={props.onSelect}
              searchHandle={props.searchHandle}
              searchEvent={props.searchEvent}
              isDark={props.isDark}
              resetDefaultFilters={props.resetDefaultFilters}
              clearFilters={props.clearFilters}
              resourceStats={Object.values(alerts).flat()}
            />
          </VisualizationProvider>
        );
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controller, props, displayedMetrics]);

    //create controller on startup and register factories
    React.useEffect(() => {
      const c = new Visualization();
      c.registerLayoutFactory(layoutFactory);
      c.registerComponentFactory(componentFactory);
      c.registerComponentFactory(stylesComponentFactory);
      setController(c);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    React.useEffect(() => {
      observeDOMRect(containerRef, containerSize, setContainerSize);
    }, [containerRef, containerSize]);

    return (
      <div id="topology-container-div" style={{ width: '100%', height: '100%' }} ref={containerRef}>
        <div id={'topology-scope-slider-div'}>
          <ScopeSlider scope={props.metricScope} setScope={props.setMetricScope} scopeDefs={props.scopes} />
        </div>
        <div id="topology-view-div">{getContent()}</div>
      </div>
    );
  }
);

export default NetflowTopology;
