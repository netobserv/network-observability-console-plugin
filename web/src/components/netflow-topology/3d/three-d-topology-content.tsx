import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { SearchHandle, SearchEvent } from '../../../components/search/search';
import { Filter } from '../../../model/filters';
import { MetricFunction, MetricType, MetricScope } from '../../../model/flow-query';
import { TopologyOptions, GraphElementPeer } from '../../../model/topology';

export const ThreeDTopologyContent: React.FC<{
  k8sModels: { [key: string]: K8sModel };
  metricFunction: MetricFunction;
  metricType: MetricType;
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
  metrics: TopologyMetrics[];
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
  k8sModels,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
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
  //const { t } = useTranslation('plugin__netobserv-plugin');

  return <span>TODO 3D topology content</span>;
};

export default ThreeDTopologyContent;
