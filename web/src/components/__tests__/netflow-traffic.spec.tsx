import * as React from 'react';
import { shallow, render, mount } from 'enzyme';
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import { getFlows } from '../../api/routes';
import NetflowTraffic from "../netflow-traffic";
import { extensionsMock } from "../__tests-data__/extensions";
import { FlowsSample } from '../__tests-data__/flows';

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}));
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

jest.mock('../../api/routes', () => ({
  getFlows: jest.fn(),
}));
const getFlowsMock = getFlows as jest.Mock;

describe("<NetflowTraffic />", () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
    getFlowsMock.mockResolvedValue(FlowsSample)
  });

  it('should shallow component', () => {
    const wrapper = shallow(
      <NetflowTraffic />
    );
    expect(wrapper.find(NetflowTraffic)).toBeTruthy();
  });
  it('should render refresh components', () => {
    const cheerio = render(
      <NetflowTraffic />
    );
    expect(cheerio.find('#refresh-dropdown').length).toEqual(1);
    expect(cheerio.find('#refresh-button').length).toEqual(1);
  });
  it('should refresh on button click', () => {
    const wrapper = mount(
      <NetflowTraffic />
    );
    //should show flows at first load
    expect(getFlowsMock).toHaveBeenCalledTimes(1);

    //should have called getFlow twice after click
    wrapper.find('#refresh-button').at(0).simulate('click');
    expect(getFlowsMock).toHaveBeenCalledTimes(2);
  });
});