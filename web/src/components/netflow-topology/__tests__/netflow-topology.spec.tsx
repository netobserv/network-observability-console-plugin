import { EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import { DefaultOptions, LayoutName } from '../../../model/topology';
import { TopologyMetrics } from '../../../api/loki';
import { DEFAULT_TIME_RANGE } from '../../../utils/router';
import NetflowTopology from '../netflow-topology';

describe('<NetflowTopology />', () => {
  const mocks = {
    error: undefined as string | undefined,
    loading: false,
    range: DEFAULT_TIME_RANGE,
    metrics: [] as TopologyMetrics[],
    layout: LayoutName.Cola,
    options: DefaultOptions,
    lowScale: 0.3,
    medScale: 0.5,
    toggleTopologyOptions: jest.fn()
  };

  it('should render component', async () => {
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(NetflowTopology)).toBeTruthy();
  });

  it('should render loading', async () => {
    mocks.loading = true;
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(Spinner)).toHaveLength(1);
  });

  it('should render error', async () => {
    mocks.error = 'test error message';
    const wrapper = shallow(<NetflowTopology {...mocks} />);
    expect(wrapper.find(EmptyState)).toHaveLength(1);
    expect(wrapper.find(EmptyStateBody)).toHaveLength(1);
  });
});
