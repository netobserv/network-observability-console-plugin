import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { waitFor } from '@testing-library/react';
import { mount, render, shallow } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { AlertsResult, SilencedAlert } from '../../api/alert';
import { FlowMetricsResult, GenericMetricsResult } from '../../api/loki';
import { getConfig, getFlowGenericMetrics, getFlowMetrics, getFlowRecords } from '../../api/routes';
import { FlowQuery } from '../../model/flow-query';
import NetflowTraffic from '../netflow-traffic';
import NetflowTrafficParent from '../netflow-traffic-parent';
import { FullConfigResultSample, SimpleConfigResultSample } from '../__tests-data__/config';
import { extensionsMock } from '../__tests-data__/extensions';
import { FlowsResultSample } from '../__tests-data__/flows';
import { actOn, waitForRender } from './common.spec';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  // mock the most complete configuration to test all queries
  getConfig: jest.fn(() => Promise.resolve(FullConfigResultSample)),
  getFlowRecords: jest.fn(() => Promise.resolve(FlowsResultSample)),
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
const getFlowsMock = getFlowRecords as jest.Mock;
const getMetricsMock = getFlowMetrics as jest.Mock;
const getGenericMetricsMock = getFlowGenericMetrics as jest.Mock;

const defaultQuery = {
  aggregateBy: 'namespace',
  filters: '',
  groups: undefined,
  limit: 5,
  packetLoss: 'all',
  rateInterval: '30s',
  recordType: 'flowLog',
  dataSource: 'auto',
  step: '15s',
  timeRange: 300
} as FlowQuery;

describe('<NetflowTraffic />', () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should shallow component', async () => {
    const wrapper = shallow(<NetflowTrafficParent />);
    expect(wrapper.find(NetflowTraffic)).toBeTruthy();
    expect(localStorage.setItem).toHaveBeenCalledTimes(0);
  });

  it('should render refresh components', async () => {
    act(() => {
      const cheerio = render(<NetflowTrafficParent />);
      expect(cheerio.find('#refresh-dropdown-container').length).toEqual(1);
      expect(cheerio.find('#refresh-button').length).toEqual(1);
    });
  });

  it('should load default metrics on button click', async () => {
    const wrapper = mount(<NetflowTrafficParent />);
    //should have called getMetricsMock & getGenericMetricsMock multiple times on render:
    const expectedMetricsQueries: FlowQuery[] = [
      // 4 queries for bytes & packets rate on current scope & app scope
      { ...defaultQuery, function: 'rate', type: 'Bytes' },
      { ...defaultQuery, function: 'rate', type: 'Packets' },
      { ...defaultQuery, function: 'rate', aggregateBy: 'app', type: 'Bytes' },
      { ...defaultQuery, function: 'rate', aggregateBy: 'app', type: 'Packets' },
      // 2 queries for dropped packets rate on current scope & app scope
      { ...defaultQuery, function: 'rate', type: 'PktDropPackets' },
      { ...defaultQuery, function: 'rate', aggregateBy: 'app', type: 'PktDropPackets' },
      // 4 queries for dns latency avg & p90 on current scope & app scope
      { ...defaultQuery, function: 'avg', type: 'DnsLatencyMs' },
      { ...defaultQuery, function: 'p90', type: 'DnsLatencyMs' },
      { ...defaultQuery, function: 'avg', aggregateBy: 'app', type: 'DnsLatencyMs' },
      { ...defaultQuery, function: 'p90', aggregateBy: 'app', type: 'DnsLatencyMs' },
      // 6 queries for avg, min & p90 RTT on current scope & app scope
      { ...defaultQuery, function: 'avg', type: 'TimeFlowRttNs' },
      { ...defaultQuery, function: 'min', type: 'TimeFlowRttNs' },
      { ...defaultQuery, function: 'p90', type: 'TimeFlowRttNs' },
      { ...defaultQuery, function: 'avg', aggregateBy: 'app', type: 'TimeFlowRttNs' },
      { ...defaultQuery, function: 'min', aggregateBy: 'app', type: 'TimeFlowRttNs' },
      { ...defaultQuery, function: 'p90', aggregateBy: 'app', type: 'TimeFlowRttNs' }
    ];
    const expectedGenericMetricsQueries: FlowQuery[] = [
      // 2 queries for packet dropped states & causes
      { ...defaultQuery, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestState' },
      { ...defaultQuery, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestDropCause' },
      // 2 queries for dns response codes count
      { ...defaultQuery, function: 'count', type: 'DnsFlows', aggregateBy: 'DnsFlagsResponseCode' },
      { ...defaultQuery, function: 'count', type: 'DnsFlows', aggregateBy: 'app' }
    ];
    await waitForRender(wrapper);
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      expect(getMetricsMock).toHaveBeenCalledTimes(expectedMetricsQueries.length);
      expectedMetricsQueries.forEach((q, i) =>
        expect(getMetricsMock).toHaveBeenNthCalledWith(i + 1, q, defaultQuery.timeRange)
      );
      expect(getGenericMetricsMock).toHaveBeenCalledTimes(expectedGenericMetricsQueries.length);
    });
    await actOn(() => wrapper.find('#refresh-button').last().simulate('click'), wrapper);
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      //should have called getMetricsMock & getGenericMetricsMock original count twice
      expect(getMetricsMock).toHaveBeenCalledTimes(expectedMetricsQueries.length * 2);
      expect(getGenericMetricsMock).toHaveBeenCalledTimes(expectedGenericMetricsQueries.length * 2);
    });
  });

  it('should render toolbar components when config loaded', async () => {
    const wrapper = mount(<NetflowTrafficParent />);
    await waitFor(() => {
      expect(getConfigMock).toHaveBeenCalled();
    });
    await act(async () => {
      expect(wrapper.find('#filter-toolbar').last()).toBeTruthy();
      expect(wrapper.find('#fullscreen-button').last()).toBeTruthy();
    });
  });

  it('should load basic metrics on button click', async () => {
    // override config to mock the simplest configuration and test minimal set of queries at once
    getConfigMock.mockReturnValue(Promise.resolve(SimpleConfigResultSample));

    const wrapper = mount(<NetflowTrafficParent />);
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      /** should have called getMetricsMock 2 times on render:
       * 2 queries for metrics on current scope & app scope
       */
      expect(getMetricsMock).toHaveBeenCalledTimes(2);
      //should have called getGenericMetricsMock 0 times
      expect(getGenericMetricsMock).toHaveBeenCalledTimes(0);
    });
    await act(async () => {
      wrapper.find('#refresh-button').at(0).simulate('click');
    });
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      //should have called getMetricsMock 4 times after click (2 * 2)
      expect(getMetricsMock).toHaveBeenCalledTimes(4);
      //should have called getGenericMetricsMock 0 times
      expect(getGenericMetricsMock).toHaveBeenCalledTimes(0);
    });
  });
});
