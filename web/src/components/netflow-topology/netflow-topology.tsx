import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Visualization, VisualizationProvider } from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyMetrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import { GraphElementPeer, LayoutName, TopologyOptions } from '../../model/topology';
import LokiError from '../messages/loki-error';
import { SearchEvent, SearchHandle } from '../search/search';
import { TopologyContent } from './2d/topology-content';
import ThreeDTopologyContent from './3d/three-d-topology-content';
import componentFactory from './2d/componentFactories/componentFactory';
import stylesComponentFactory from './2d/componentFactories/stylesComponentFactory';
import layoutFactory from './2d/layouts/layoutFactory';

export const NetflowTopology: React.FC<{
  loading?: boolean;
  k8sModels: { [key: string]: K8sModel };
  error?: string;
  metricFunction: MetricFunction;
  metricType: MetricType;
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
  metrics: TopologyMetrics[];
  droppedMetrics: TopologyMetrics[];
  options: TopologyOptions;
  setOptions: (o: TopologyOptions) => void;
  filters: Filter[];
  setFilters: (v: Filter[]) => void;
  selected: GraphElementPeer | undefined;
  onSelect: (e: GraphElementPeer | undefined) => void;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  isDark?: boolean;
}> = ({
  loading,
  k8sModels,
  error,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
  droppedMetrics,
  options,
  setOptions,
  filters,
  setFilters,
  selected,
  onSelect,
  searchHandle,
  searchEvent,
  isDark
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [controller, setController] = React.useState<Visualization>();

  //create controller on startup and register factories
  React.useEffect(() => {
    const c = new Visualization();
    c.registerLayoutFactory(layoutFactory);
    c.registerComponentFactory(componentFactory);
    c.registerComponentFactory(stylesComponentFactory);
    setController(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return <LokiError title={t('Unable to get topology')} error={error} />;
  } else if (!controller || (_.isEmpty(metrics) && loading)) {
    return (
      <Bullseye data-test="loading-contents">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else if (options.layout === LayoutName.ThreeD) {
    return (
      <ThreeDTopologyContent
        k8sModels={k8sModels}
        metricFunction={metricFunction}
        metricType={metricType}
        metricScope={metricScope}
        setMetricScope={setMetricScope}
        metrics={metrics}
        options={options}
        setOptions={setOptions}
        filters={filters}
        setFilters={setFilters}
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
        <TopologyContent
          k8sModels={k8sModels}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope}
          setMetricScope={setMetricScope}
          metrics={metrics}
          droppedMetrics={droppedMetrics}
          options={options}
          setOptions={setOptions}
          filters={filters}
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
};

export default NetflowTopology;
