import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { ScopeDefSample } from '../../../components/__tests-data__/scopes';
import { actOn } from '../../../components/__tests__/common.spec';
import { MetricScopeOptions } from '../../../model/metrics';
import { GroupDropdown } from '../group-dropdown';

describe('<GroupDropdown />', () => {
  const props = {
    scope: MetricScopeOptions.RESOURCE,
    selected: 'hosts',
    setGroupType: jest.fn(),
    id: 'group',
    scopes: ScopeDefSample
  };

  it('should render component', async () => {
    const wrapper = shallow(<GroupDropdown {...props} />);
    expect(wrapper.find(GroupDropdown)).toBeTruthy();
  });

  it('should open and close', async () => {
    const wrapper = mount(<GroupDropdown {...props} />);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#group-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#group-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setGroupType should be called
    expect(props.setGroupType).toHaveBeenCalledTimes(0);
  });

  it('should refresh on select', async () => {
    const wrapper = mount(<GroupDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#group-dropdown').at(0).simulate('click'), wrapper);

    //select NONE
    await actOn(() => wrapper.find('[id="none"]').last().simulate('click'), wrapper);
    expect(props.setGroupType).toHaveBeenCalledWith('none');
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#group-dropdown').at(0).simulate('click'), wrapper);

    //select OWNERS
    await actOn(() => wrapper.find('[id="owners"]').last().simulate('click'), wrapper);

    //setGroupType should be called twice
    expect(props.setGroupType).toHaveBeenCalledTimes(2);
    expect(props.setGroupType).toHaveBeenCalledWith('owners');
    expect(wrapper.find('li').length).toBe(0);
  });
});
