import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { mount, render, shallow } from 'enzyme';
import * as React from 'react';
import { waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { getFlows, getTopology } from '../../api/routes';
import NetflowTraffic from '../netflow-traffic';
import { extensionsMock } from '../__tests-data__/extensions';
import { FlowsResultSample } from '../__tests-data__/flows';
import NetflowTrafficParent from '../netflow-traffic-parent';
import { TopologyResult } from '../../api/loki';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getFlows: jest.fn(() => Promise.resolve(FlowsResultSample)),
  getTopology: jest.fn(() =>
    Promise.resolve({ metrics: [], stats: { numQueries: 0, limitReached: false } } as TopologyResult)
  )
}));
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
    act(() => {
      const wrapper = mount(<NetflowTrafficParent />);
      //should have called getTopology 4 times after click (2 for current scope and 2 for app)
      wrapper.find('#refresh-button').at(0).simulate('click');
    });
    await waitFor(() => {
      expect(getFlowsMock).toHaveBeenCalledTimes(0);
      expect(getTopologyMock).toHaveBeenCalledTimes(4);
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
