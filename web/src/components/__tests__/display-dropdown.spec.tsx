import * as React from 'react';
import { mount, shallow } from 'enzyme';

import DisplayDropdown from '../display-dropdown';

describe('<DisplayDropdown />', () => {
  const props = {
    setSize: jest.fn(),
    id: 'display'
  };
  it('should render component', async () => {
    const wrapper = shallow(<DisplayDropdown {...props} />);
    expect(wrapper.find(DisplayDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<DisplayDropdown {...props} />);

    const dropdown = wrapper.find('#display-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setSize should be called
    expect(props.setSize).toHaveBeenCalledTimes(0);
  });
  it('should setSize on select', async () => {
    const wrapper = mount(<DisplayDropdown {...props} />);

    const dropdown = wrapper.find('#display-dropdown');
    //open dropdown and select compact
    dropdown.at(0).simulate('click');
    wrapper.find('[id="s"]').at(0).simulate('click');
    expect(props.setSize).toHaveBeenCalledWith('s');
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select large
    dropdown.at(0).simulate('click');
    wrapper.find('[id="l"]').at(0).simulate('click');
    expect(props.setSize).toHaveBeenCalledWith('l');
    expect(wrapper.find('li').length).toBe(0);

    //setInterval should be called twice
    expect(props.setSize).toHaveBeenCalledTimes(2);
  });
});
