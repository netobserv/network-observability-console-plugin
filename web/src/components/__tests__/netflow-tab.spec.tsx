import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState } from '@patternfly/react-core';
import { mount } from 'enzyme';
import { waitFor } from '@testing-library/react';
import { extensionsMock } from '../__tests-data__/extensions';
import * as React from 'react';
import NetflowTab from '../netflow-tab';
import NetflowTraffic from '../netflow-traffic';
import { PodTabParam, ServiceTabParam, UnknownTabParam } from '../__tests-data__/tabs';
import { ConfigResultSample } from '../__tests-data__/config';
import { GenericMetricsResult, TopologyMetricsResult } from '../../api/loki';
import { AlertsResult, SilencedAlert } from '../../api/alert';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getConfig: jest.fn(() => Promise.resolve(ConfigResultSample)),
  getFlows: jest.fn(() => Promise.resolve([])),
  getTopologyMetrics: jest.fn(() =>
    Promise.resolve({ metrics: [], stats: { numQueries: 0, limitReached: false } } as TopologyMetricsResult)
  ),
  getGenericMetrics: jest.fn(() =>
    Promise.resolve({ metrics: [], stats: { numQueries: 0, limitReached: false } } as GenericMetricsResult)
  ),
  getAlerts: jest.fn(() => Promise.resolve({ data: { groups: [] }, status: 'success' } as AlertsResult)),
  getSilencedAlerts: jest.fn(() => Promise.resolve([] as SilencedAlert[]))
}));

describe('<NetflowTab />', () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
  });

  it('should mount component for Pod', async () => {
    const wrapper = mount(<NetflowTab obj={PodTabParam} />);
    await waitFor(() => {
      expect(wrapper.find(NetflowTab)).toBeTruthy();
      expect(wrapper.find(NetflowTraffic)).toHaveLength(1);
    });
  });
  it('should mount component for Service', async () => {
    const wrapper = mount(<NetflowTab obj={ServiceTabParam} />);
    await waitFor(() => {
      expect(wrapper.find(NetflowTab)).toBeTruthy();
      expect(wrapper.find(NetflowTraffic)).toHaveLength(1);
    });
  });
  it('should mount empty state', async () => {
    const wrapper = mount(<NetflowTab obj={UnknownTabParam} />);
    await waitFor(() => {
      expect(wrapper.find(NetflowTraffic)).toHaveLength(0);
      expect(wrapper.find(EmptyState)).toHaveLength(1);
    });
  });
});
