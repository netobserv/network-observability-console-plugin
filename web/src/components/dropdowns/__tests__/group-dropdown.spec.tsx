import * as React from 'react';
import { mount, shallow } from 'enzyme';

import GroupDropdown from '../group-dropdown';
import { TopologyGroupTypes } from '../../../model/topology';

describe('<GroupDropdown />', () => {
  const props = {
    selected: TopologyGroupTypes.HOSTS,
    setGroupType: jest.fn(),
    id: 'group'
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
    expect(props.setGroupType).toHaveBeenCalledWith(TopologyGroupTypes.NONE);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select OWNERS
    dropdown.at(0).simulate('click');
    wrapper.find('[id="owners"]').at(0).simulate('click');
    expect(props.setGroupType).toHaveBeenCalledWith(TopologyGroupTypes.OWNERS);
    expect(wrapper.find('li').length).toBe(0);

    //setGroupType should be called twice
    expect(props.setGroupType).toHaveBeenCalledTimes(2);
  });
});
