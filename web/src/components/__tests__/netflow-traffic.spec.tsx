import * as React from 'react';
import { shallow, render } from 'enzyme';
import { useResolvedExtensions } from '@openshift-console/dynamic-plugin-sdk';
import NetflowTraffic from "../netflow-traffic";
import { extensionsMock } from "../__tests-data__/extensions";

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useResolvedExtensions: jest.fn(),
}));
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;

describe("<NetflowTraffic />", () => {
  beforeAll(() => {
    useResolvedExtensionsMock.mockReturnValue(extensionsMock);
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
});