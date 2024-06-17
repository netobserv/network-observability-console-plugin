import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Visualization, VisualizationProvider } from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { TopologyMetrics } from '../../api/loki';
import { Filter, FilterDefinition, Filters } from '../../model/filters';
import { FlowScope, MetricType, StatFunction } from '../../model/flow-query';
import { GraphElementPeer, LayoutName, TopologyOptions } from '../../model/topology';
import { observeDOMRect } from '../../utils/metrics-helper';
import { ScopeSlider } from '../scope-slider/scope-slider';
import { SearchEvent, SearchHandle } from '../search/search';
import componentFactory from './2d/componentFactories/componentFactory';
import stylesComponentFactory from './2d/componentFactories/stylesComponentFactory';
import layoutFactory from './2d/layouts/layoutFactory';
import { TopologyContent } from './2d/topology-content';
import ThreeDTopologyContent from './3d/three-d-topology-content';
import './netflow-topology.css';

export interface NetflowTopologyProps {
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
  allowedScopes: FlowScope[];
}

export const NetflowTopology: React.FC<NetflowTopologyProps> = ({
  loading,
  k8sModels,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
  droppedMetrics,
  options,
  setOptions,
  filters,
  filterDefinitions,
  setFilters,
  selected,
  onSelect,
  searchHandle,
  searchEvent,
  isDark,
  allowedScopes
}) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerSize, setContainerSize] = React.useState<DOMRect>({ width: 0, height: 0 } as DOMRect);
  const [controller, setController] = React.useState<Visualization>();

  //show fully dropped metrics if no metrics available
  const displayedMetrics = _.isEmpty(metrics) ? droppedMetrics : metrics;

  const getContent = React.useCallback(() => {
    if (!controller || (_.isEmpty(metrics) && loading)) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    } else if (options.layout === LayoutName.threeD) {
      return (
        <ThreeDTopologyContent
          k8sModels={k8sModels}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope}
          setMetricScope={setMetricScope}
          metrics={displayedMetrics}
          options={options}
          setOptions={setOptions}
          filters={filters.list}
          setFilters={(l: Filter[]) => setFilters({ ...filters, list: l })}
          selected={selected}
          onSelect={onSelect}
          searchHandle={searchHandle}
          searchEvent={searchEvent}
          isDark={isDark}
        />
      );
    } else {
      return (
        <VisualizationProvider data-test="visualization-provider" controller={controller}>
          <ScopeSlider
            sizePx={containerSize?.height || 300}
            scope={metricScope}
            setScope={setMetricScope}
            allowedScopes={allowedScopes}
          />
          <TopologyContent
            k8sModels={k8sModels}
            metricFunction={metricFunction}
            metricType={metricType}
            metricScope={metricScope}
            setMetricScope={setMetricScope}
            metrics={displayedMetrics}
            droppedMetrics={droppedMetrics}
            options={options}
            setOptions={setOptions}
            filters={filters}
            filterDefinitions={filterDefinitions}
            setFilters={setFilters}
            selected={selected}
            onSelect={onSelect}
            searchHandle={searchHandle}
            searchEvent={searchEvent}
            isDark={isDark}
          />
        </VisualizationProvider>
      );
    }
  }, [
    allowedScopes,
    containerSize?.height,
    controller,
    displayedMetrics,
    droppedMetrics,
    filterDefinitions,
    filters,
    isDark,
    k8sModels,
    loading,
    metricFunction,
    metricScope,
    metricType,
    metrics,
    onSelect,
    options,
    searchEvent,
    searchHandle,
    selected,
    setFilters,
    setMetricScope,
    setOptions
  ]);

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
    <div style={{ width: '100%', height: '100%' }} ref={containerRef}>
      {getContent()}
    </div>
  );
};

export default NetflowTopology;
