import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { LayoutName } from '../../../model/topology';
import { LayoutDropdown } from '../layout-dropdown';

describe('<LayoutDropdown />', () => {
  const props = {
    selected: LayoutName.cola,
    setLayout: jest.fn(),
    id: 'layout'
  };
  it('should render component', async () => {
    const wrapper = shallow(<LayoutDropdown {...props} />);
    expect(wrapper.find(LayoutDropdown)).toBeTruthy();
  });
  it('should open and close', async () => {
    const wrapper = mount(<LayoutDropdown {...props} />);

    const dropdown = wrapper.find('#layout-dropdown');
    expect(wrapper.find('li').length).toBe(0);
    //open dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    dropdown.at(0).simulate('click');
    expect(wrapper.find('li').length).toBe(0);

    //no setLayout should be called
    expect(props.setLayout).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<LayoutDropdown {...props} />);

    const dropdown = wrapper.find('#layout-dropdown');
    //open dropdown and select Dagre
    dropdown.at(0).simulate('click');
    wrapper.find('[id="Dagre"]').at(0).simulate('click');
    expect(props.setLayout).toHaveBeenCalledWith(LayoutName.dagre);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown and select Force
    dropdown.at(0).simulate('click');
    wrapper.find('[id="Force"]').at(0).simulate('click');
    expect(props.setLayout).toHaveBeenCalledWith(LayoutName.force);
    expect(wrapper.find('li').length).toBe(0);

    //setLayout should be called twice
    expect(props.setLayout).toHaveBeenCalledTimes(2);
  });
});
