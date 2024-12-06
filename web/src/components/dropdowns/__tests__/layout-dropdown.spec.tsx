import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
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
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#layout-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#layout-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setLayout should be called
    expect(props.setLayout).toHaveBeenCalledTimes(0);
  });

  it('should refresh on select', async () => {
    const wrapper = mount(<LayoutDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#layout-dropdown').at(0).simulate('click'), wrapper);

    //select Dagre
    await actOn(() => wrapper.find('[id="Dagre"]').last().simulate('click'), wrapper);
    expect(props.setLayout).toHaveBeenCalledWith(LayoutName.dagre);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#layout-dropdown').at(0).simulate('click'), wrapper);

    //select Force
    await actOn(() => wrapper.find('[id="Force"]').last().simulate('click'), wrapper);

    //setLayout should be called twice
    expect(props.setLayout).toHaveBeenCalledTimes(2);
    expect(props.setLayout).toHaveBeenCalledWith(LayoutName.force);
    expect(wrapper.find('li').length).toBe(0);
  });
});
