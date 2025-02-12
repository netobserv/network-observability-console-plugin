import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
import { RefreshDropdown, RefreshDropdownProps } from '../refresh-dropdown';

describe('<RefreshDropdown />', () => {
  const props: RefreshDropdownProps = {
    interval: undefined,
    setInterval: jest.fn(),
    id: 'refresh'
  };

  it('should render component', async () => {
    const wrapper = shallow(<RefreshDropdown {...props} />);
    expect(wrapper.find(RefreshDropdown)).toBeTruthy();
  });

  it('should open and close', async () => {
    const wrapper = mount(<RefreshDropdown {...props} />);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#refresh-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#refresh-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setInterval should be called
    expect(props.setInterval).toHaveBeenCalledTimes(0);
  });

  it('should refresh on select', async () => {
    const wrapper = mount(<RefreshDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#refresh-dropdown').at(0).simulate('click'), wrapper);

    //select refresh off
    await actOn(() => wrapper.find('[id="OFF_KEY"]').last().simulate('click'), wrapper);
    expect(props.setInterval).toHaveBeenCalledWith(undefined);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#refresh-dropdown').at(0).simulate('click'), wrapper);

    //select 15s
    await actOn(() => wrapper.find('[id="15s"]').last().simulate('click'), wrapper);

    //setInterval should be called twice
    expect(props.setInterval).toHaveBeenCalledTimes(2);
    expect(props.setInterval).toHaveBeenCalledWith(15000);
    expect(wrapper.find('li').length).toBe(0);
  });
});
