import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Content, Spinner } from '@patternfly/react-core';
import { Visualization, VisualizationProvider } from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlowMetricsResult,
  FunctionMetrics,
  getFunctionMetricKey,
  getRateMetricKey,
  NetflowMetrics,
  RateMetrics,
  Stats,
  TopologyMetrics
} from '../../../api/loki';
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
import { Warning } from '../../../model/warnings';
import { TimeRange } from '../../../utils/datetime';
import { getHTTPErrorDetails, getPromError, isPromError } from '../../../utils/errors';
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
    setWarning: (v?: Warning) => void,
    initFunction: () => void
  ) => Promise<Stats[]> | undefined;
};

export interface NetflowTopologyProps {
  ref?: React.Ref<NetflowTopologyHandle>;
  loading?: boolean;
  k8sModels: { [key: string]: K8sModel };
  metricFunction: StatFunction;
  metricType: MetricType;
  metricScope: FlowScope;
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

export const NetflowTopology: React.FC<NetflowTopologyProps> = React.forwardRef(
  (props, ref: React.Ref<NetflowTopologyHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');
    const [controller, setController] = React.useState<Visualization>();

    //show fully dropped metrics if no metrics available
    const displayedMetrics = _.isEmpty(props.metrics) ? props.droppedMetrics : props.metrics;

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
        setWarning: (v?: Warning) => void,
        initFunction: () => void
      ) => {
        initFunction();

        const droppedType = features.includes('pktDrop')
          ? fq.type === 'Bytes'
            ? 'PktDropBytes'
            : fq.type === 'Packets'
            ? 'PktDropPackets'
            : undefined
          : undefined;
        let currentMetrics = metricsRef.current;

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
                let strErr = getHTTPErrorDetails(err, true);
                if (isPromError(strErr)) {
                  strErr = getPromError(strErr);
                }
                setWarning({
                  type: 'cantfetchdrops',
                  summary: t('Could not fetch drop information'),
                  details: strErr
                });
                return { numQueries: 0, dataSources: [], limitReached: false };
              })
          );
        } else if (!['PktDropBytes', 'PktDropPackets'].includes(metricType)) {
          currentMetrics = { ...currentMetrics, droppedRateMetrics: undefined };
          setMetrics(currentMetrics);
        }
        return Promise.all(promises);
      },
      [t]
    );

    React.useImperativeHandle(ref, () => ({
      fetch
    }));

    const getContent = React.useCallback(() => {
      if (!controller || (_.isEmpty(props.metrics) && props.loading)) {
        return (
          <Bullseye data-test="loading-contents">
            <Spinner size="xl" />
          </Bullseye>
        );
      } else if (props.options.layout === LayoutName.threeD) {
        return <Content>{t('Sorry, 3D view is not implemented anymore.')}</Content>;
      } else {
        return (
          <VisualizationProvider data-test="visualization-provider" controller={controller}>
            <TopologyContent
              k8sModels={props.k8sModels}
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
    }, []);

    return (
      <div id="topology-container-div" style={{ width: '100%', height: '100%' }}>
        <div id={'topology-scope-slider-div'}>
          <ScopeSlider scope={props.metricScope} setScope={props.setMetricScope} scopeDefs={props.scopes} />
        </div>
        <div id="topology-view-div">{getContent()}</div>
      </div>
    );
  }
);

export default NetflowTopology;
