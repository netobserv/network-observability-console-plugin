import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { waitFor } from '@testing-library/react';
import { mount } from 'enzyme';
import * as React from 'react';
import { AlertsResult, SilencedAlert } from '../../api/alert';
import { FlowMetricsResult, GenericMetricsResult } from '../../api/loki';
import { getConfig } from '../../api/routes';
import { FullConfigResultSample } from '../__tests-data__/config';
import { extensionsMock } from '../__tests-data__/extensions';
import { PodTabParam, ServiceTabParam, UnknownTabParam } from '../__tests-data__/tabs';
import NetflowTraffic from '../netflow-traffic';
import NetflowTrafficParent from '../netflow-traffic-parent';
import NetflowTrafficTab from '../netflow-traffic-tab';
import { waitForRender } from './common.spec';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getConfig: jest.fn(() => Promise.resolve(FullConfigResultSample)),
  getFlowRecords: jest.fn(() => Promise.resolve([])),
  getFlowMetrics: jest.fn(() =>
    Promise.resolve({
      metrics: [],
      stats: { numQueries: 0, limitReached: false, dataSources: ['loki'] }
    } as FlowMetricsResult)
  ),
  getFlowGenericMetrics: jest.fn(() =>
    Promise.resolve({
      metrics: [],
      stats: { numQueries: 0, limitReached: false, dataSources: ['loki'] }
    } as GenericMetricsResult)
  ),
  getAlerts: jest.fn(() => Promise.resolve({ data: { groups: [] }, status: 'success' } as AlertsResult)),
  getSilencedAlerts: jest.fn(() => Promise.resolve([] as SilencedAlert[]))
}));

const getConfigMock = getConfig as jest.Mock;

describe('<NetflowTrafficTab />', () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should mount component for Pod', async () => {
    const wrapper = mount(<NetflowTrafficTab obj={PodTabParam} />);
    await waitForRender(wrapper);
    await waitFor(() => {
      expect(getConfigMock).toHaveBeenCalled();

      expect(wrapper.find(NetflowTrafficTab).last()).toBeTruthy();
      expect(wrapper.find(NetflowTrafficParent).last()).toBeTruthy();
      expect(wrapper.find(NetflowTraffic).last()).toBeTruthy();
    });
  });
  it('should mount component for Service', async () => {
    const wrapper = mount(<NetflowTrafficTab obj={ServiceTabParam} />);
    await waitForRender(wrapper);
    await waitFor(() => {
      expect(getConfigMock).toHaveBeenCalled();

      expect(wrapper.find(NetflowTrafficTab).last()).toBeTruthy();
      expect(wrapper.find(NetflowTrafficParent).last()).toBeTruthy();
      expect(wrapper.find(NetflowTraffic).last()).toBeTruthy();
    });
  });
  it('should mount empty state', async () => {
    const wrapper = mount(<NetflowTrafficTab obj={UnknownTabParam} />);
    await waitForRender(wrapper);
    await waitFor(() => {
      expect(getConfigMock).toHaveBeenCalled();

      expect(wrapper.find(NetflowTrafficTab).last()).toBeTruthy();
      expect(wrapper.find('EmptyState[data-test="error-state"]').last()).toBeTruthy();
    });
  });
});
