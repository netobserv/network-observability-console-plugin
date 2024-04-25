import { Spinner } from '@patternfly/react-core';
import { TopologyView, VisualizationSurface } from '@patternfly/react-topology';
import { shallow } from 'enzyme';
import * as React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { StatFunction, FlowScope, MetricType } from '../../../model/flow-query';
import { DefaultOptions, LayoutName } from '../../../model/topology';
import { defaultTimeRange } from '../../../utils/router';
import { NetflowTopology } from '../netflow-topology';
import { TopologyContent } from '../2d/topology-content';
import { dataSample } from '../__tests-data__/metrics';
import { LokiError } from '../../messages/loki-error';
import { FilterDefinitionSample } from '../../../components/__tests-data__/filters';

describe('<NetflowTopology />', () => {
  const mocks = {
    error: undefined as string | undefined,
    loading: false,
    k8sModels: {},
    range: defaultTimeRange,
    metricFunction: 'sum' as StatFunction,
    metricType: 'Bytes' as MetricType,
    metricScope: 'host' as FlowScope,
    setMetricScope: jest.fn(),
    metrics: [] as TopologyMetrics[],
    droppedMetrics: [] as TopologyMetrics[],
    layout: LayoutName.Cola,
    options: DefaultOptions,
    setOptions: jest.fn(),
    lowScale: 0.3,
    medScale: 0.5,
    filters: { backAndForth: false, list: [] },
    filterDefinitions: FilterDefinitionSample,
    setFilters: jest.fn(),
    toggleTopologyOptions: jest.fn(),
    selected: undefined,
    onSelect: jest.fn(),
    searchHandle: null,
    searchEvent: undefined,
    allowMultiCluster: false,
    allowZone: false,
    allowHost: true,
    allowNamespace: true,
    allowOwner: true,
    allowResource: true
  };

  it('should render component', async () => {
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(NetflowTopology)).toBeTruthy();
  });

  it('should have topology view', async () => {
    const wrapper = shallow(<TopologyContent {...mocks} metrics={dataSample} />);
    expect(wrapper.find(TopologyView)).toHaveLength(1);
    expect(wrapper.find(VisualizationSurface)).toHaveLength(1);
  });

  it('should render loading', async () => {
    mocks.loading = true;
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(Spinner)).toHaveLength(1);
  });

  it('should render error', async () => {
    mocks.error = 'test error message';
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(LokiError)).toHaveLength(1);
  });
});
