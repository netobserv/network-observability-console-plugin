import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { FlowScope } from '../../../model/flow-query';
import { MetricScopeOptions } from '../../../model/metrics';
import { TopologyGroupTypes } from '../../../model/topology';
import { GroupDropdown } from '../group-dropdown';

describe('<GroupDropdown />', () => {
  const props = {
    scope: MetricScopeOptions.RESOURCE,
    selected: TopologyGroupTypes.hosts,
    setGroupType: jest.fn(),
    id: 'group',
    allowedScopes: ['host', 'namespace', 'owner'] as FlowScope[]
  };
  it('should render component', async () => {
    const wrapper = shallow(<GroupDropdown {...props} />);
    expect(wrapper.find(GroupDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<GroupDropdown {...props} />);

    const dropdown = wrapper.find('#group-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setGroupType should be called
    expect(props.setGroupType).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<GroupDropdown {...props} />);

    const dropdown = wrapper.find('#group-dropdown');
    //open dropdown and select NONE
    dropdown.at(0).simulate('click');
    wrapper.find('[id="none"]').at(0).simulate('click');
    expect(props.setGroupType).toHaveBeenCalledWith(TopologyGroupTypes.none);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select OWNERS
    dropdown.at(0).simulate('click');
    wrapper.find('[id="owners"]').at(0).simulate('click');
    expect(props.setGroupType).toHaveBeenCalledWith(TopologyGroupTypes.owners);
    expect(wrapper.find('li').length).toBe(0);

    //setGroupType should be called twice
    expect(props.setGroupType).toHaveBeenCalledTimes(2);
  });
});
