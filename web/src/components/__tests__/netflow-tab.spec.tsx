import { EmptyState } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import NetflowTab from '../netflow-tab';
import NetflowTraffic from '../netflow-traffic';
import { PodTabParam, ServiceTabParam, UnknownTabParam } from '../__tests-data__/tabs';

describe('<NetflowTab />', () => {
  it('should shallow component for Pod', async () => {
    const wrapper = shallow(<NetflowTab obj={PodTabParam} />);
    expect(wrapper.find(NetflowTab)).toBeTruthy();
    expect(wrapper.find(NetflowTraffic)).toHaveLength(1);
  });
  it('should shallow component for Service', async () => {
    const wrapper = shallow(<NetflowTab obj={ServiceTabParam} />);
    expect(wrapper.find(NetflowTab)).toBeTruthy();
    expect(wrapper.find(NetflowTraffic)).toHaveLength(1);
  });
  it('should render empty state', async () => {
    const wrapper = shallow(<NetflowTab obj={UnknownTabParam} />);
    expect(wrapper.find(NetflowTraffic)).toHaveLength(0);
    expect(wrapper.find(EmptyState)).toHaveLength(1);
  });
});
