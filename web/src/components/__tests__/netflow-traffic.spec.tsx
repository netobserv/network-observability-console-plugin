import * as React from 'react';
import { shallow } from 'enzyme';

import NetflowTraffic from "../netflow-traffic";

describe("<NetflowTraffic />", () => {
  it('should render component', () => {
    const wrapper = shallow(
      <NetflowTraffic />
    );
    expect(wrapper.find(NetflowTraffic)).toBeTruthy();
  });
});