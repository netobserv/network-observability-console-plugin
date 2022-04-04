import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { mount, render, shallow } from 'enzyme';
import * as React from 'react';
import { waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { getFlows, getConfig } from '../../api/routes';
import NetflowTraffic from '../netflow-traffic';
import { extensionsMock } from '../__tests-data__/extensions';
import { FlowsSample } from '../__tests-data__/flows';
import { Config } from '../../model/config';
import NetflowTrafficParent from '../netflow-traffic-parent';

const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getFlows: jest.fn(),
  getConfig: jest.fn()
}));
const getFlowsMock = getFlows as jest.Mock;
const getConfigMock = getConfig as jest.Mock;
const config: Config = { portNaming: { enable: true, portNames: new Map() } };

describe('<NetflowTraffic />', () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
    getFlowsMock.mockResolvedValue(FlowsSample);
    getConfigMock.mockResolvedValue(config);
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
    //should show flows at first load
    expect(getFlowsMock).toHaveBeenCalledTimes(1);
    act(() => {
      //should have called getFlow twice after click
      wrapper.find('#refresh-button').at(0).simulate('click');
    });
    await waitFor(() => {
      expect(getFlowsMock).toHaveBeenCalledTimes(2);
    });
  });
  it('should render toolbar components', async () => {
    act(() => {
      const cheerio = render(<NetflowTrafficParent />);
      expect(cheerio.find('#filter-toolbar').length).toEqual(1);
      expect(cheerio.find('#manage-columns-button').length).toEqual(1);
    });
  });
});
