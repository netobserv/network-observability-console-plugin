import * as React from 'react';
import { shallow } from 'enzyme';

import NetflowTraffic from "../netflow-traffic";

/*jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));*/

describe("<NetflowTraffic />", () => {
  it('should render component', () => {
    const wrapper = shallow(
      <NetflowTraffic />
    );
    expect(wrapper.find(NetflowTraffic)).toBeTruthy();
  });
});