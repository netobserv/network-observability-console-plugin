import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { TruncateDropdown, TruncateLength } from '../truncate-dropdown';

describe('<TruncateDropdown />', () => {
  const props = {
    selected: TruncateLength.M,
    setTruncateLength: jest.fn(),
    id: 'truncate'
  };
  it('should render component', async () => {
    const wrapper = shallow(<TruncateDropdown {...props} />);
    expect(wrapper.find(TruncateDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<TruncateDropdown {...props} />);

    const dropdown = wrapper.find('#truncate-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setTruncateLength should be called
    expect(props.setTruncateLength).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<TruncateDropdown {...props} />);

    const dropdown = wrapper.find('#truncate-dropdown');
    //open dropdown and select NONE
    dropdown.at(0).simulate('click');
    wrapper.find('[id="0"]').at(0).simulate('click');
    expect(props.setTruncateLength).toHaveBeenCalledWith(TruncateLength.OFF);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select OWNERS
    dropdown.at(0).simulate('click');
    wrapper.find('[id="40"]').at(0).simulate('click');
    expect(props.setTruncateLength).toHaveBeenCalledWith(TruncateLength.XL);
    expect(wrapper.find('li').length).toBe(0);

    //setTruncateLength should be called twice
    expect(props.setTruncateLength).toHaveBeenCalledTimes(2);
  });
});
