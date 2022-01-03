import * as React from 'react';
import { mount, shallow } from 'enzyme';

import RefreshDropdown from '../refresh-dropdown';

describe('<RefreshDropdown />', () => {
  const props = {
    interval: null,
    setInterval: jest.fn(),
    id: 'refresh'
  };
  it('should render component', async () => {
    const wrapper = shallow(<RefreshDropdown {...props} />);
    expect(wrapper.find(RefreshDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<RefreshDropdown {...props} />);

    const dropdown = wrapper.find('#refresh-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setInterval should be called
    expect(props.setInterval).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<RefreshDropdown {...props} />);

    const dropdown = wrapper.find('#refresh-dropdown');
    //open dropdown and select refresh off
    dropdown.at(0).simulate('click');
    wrapper.find('[id="OFF_KEY"]').at(0).simulate('click');
    expect(props.setInterval).toHaveBeenCalledWith(null);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select 15s
    dropdown.at(0).simulate('click');
    wrapper.find('[id="15s"]').at(0).simulate('click');
    expect(props.setInterval).toHaveBeenCalledWith(15000);
    expect(wrapper.find('li').length).toBe(0);

    //setInterval should be called twice
    expect(props.setInterval).toHaveBeenCalledTimes(2);
  });
});
