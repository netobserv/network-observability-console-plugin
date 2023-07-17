import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { mount, render, shallow } from 'enzyme';
import * as React from 'react';
import { waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { getConfig, getFlows, getTopology } from '../../api/routes';
import NetflowTraffic from '../netflow-traffic';
import { extensionsMock } from '../__tests-data__/extensions';
import { FlowsResultSample } from '../__tests-data__/flows';
import NetflowTrafficParent from '../netflow-traffic-parent';
import { TopologyResult } from '../../api/loki';
import { AlertsResult, SilencedAlert } from '../../api/alert';
import { ConfigResultSample } from '../__tests-data__/config';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getConfig: jest.fn(() => Promise.resolve(ConfigResultSample)),
  getFlows: jest.fn(() => Promise.resolve(FlowsResultSample)),
  getTopology: jest.fn(() =>
    Promise.resolve({ metrics: [], stats: { numQueries: 0, limitReached: false } } as TopologyResult)
  ),
  getAlerts: jest.fn(() => Promise.resolve({ data: { groups: [] }, status: 'success' } as AlertsResult)),
  getSilencedAlerts: jest.fn(() => Promise.resolve([] as SilencedAlert[]))
}));
const getConfigMock = getConfig as jest.Mock;
const getFlowsMock = getFlows as jest.Mock;
const getTopologyMock = getTopology as jest.Mock;

describe('<NetflowTraffic />', () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
  });

  it('should shallow component', async () => {
    const wrapper = shallow(<NetflowTrafficParent />);
    expect(wrapper.find(NetflowTraffic)).toBeTruthy();
    expect(localStorage.setItem).toHaveBeenCalledTimes(0);
  });

  it('should render refresh components', async () => {
    act(() => {
      const cheerio = render(<NetflowTrafficParent />);
      expect(cheerio.find('#refresh-dropdown').length).toEqual(1);
      expect(cheerio.find('#refresh-button').length).toEqual(1);
    });
  });

  it('should refresh on button click', async () => {
    const wrapper = mount(<NetflowTrafficParent />);
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      /** should have called getTopology 6 times on render
       * 2 queries for metrics on current scope & app scope
       * 2 queries for dropped metrics on current scope & app scope
       * dropped states
       * dropped causes
       */
      expect(getTopologyMock).toHaveBeenCalledTimes(6);
    });
    await act(async () => {
      wrapper.find('#refresh-button').at(0).simulate('click');
    });
    await waitFor(() => {
      //config is get only once
      expect(getConfigMock).toHaveBeenCalledTimes(1);
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      //should have called getTopology 12 times after click (6 * 2)
      expect(getTopologyMock).toHaveBeenCalledTimes(12);
    });
  });

  it('should render toolbar components', async () => {
    act(() => {
      const cheerio = render(<NetflowTrafficParent />);
      expect(cheerio.find('#filter-toolbar').length).toEqual(1);
      expect(cheerio.find('#fullscreen-button').length).toEqual(1);
    });
  });
});
