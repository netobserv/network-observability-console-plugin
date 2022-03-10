import { shallow } from 'enzyme';
import * as React from 'react';
import NetflowTopology from '../netflow-topology';

describe('<NetflowTopology />', () => {
  it('should render component', async () => {
    const wrapper = shallow(<NetflowTopology />);
    expect(wrapper.find(NetflowTopology)).toBeTruthy();
  });
});
