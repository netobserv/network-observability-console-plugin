import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { actOn } from '../../../components/__tests__/common.spec';
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
    expect(wrapper.find('li').length).toBe(0);

    //open dropdow
    await actOn(() => wrapper.find('#truncate-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBeGreaterThan(0);

    //close dropdow
    await actOn(() => wrapper.find('#truncate-dropdown').at(0).simulate('click'), wrapper);
    expect(wrapper.find('li').length).toBe(0);

    //no setTruncateLength should be called
    expect(props.setTruncateLength).toHaveBeenCalledTimes(0);
  });
  it('should refresh on select', async () => {
    const wrapper = mount(<TruncateDropdown {...props} />);

    //open dropdown
    await actOn(() => wrapper.find('#truncate-dropdown').at(0).simulate('click'), wrapper);
    //select NONE
    await actOn(() => wrapper.find('[id="0"]').last().simulate('click'), wrapper);
    expect(props.setTruncateLength).toHaveBeenCalledWith(TruncateLength.OFF);
    expect(wrapper.find('li').length).toBe(0);

    //open dropdown
    await actOn(() => wrapper.find('#truncate-dropdown').at(0).simulate('click'), wrapper);
    //select OWNERS
    await actOn(() => wrapper.find('[id="40"]').last().simulate('click'), wrapper);

    //setTruncateLength should be called twice
    expect(props.setTruncateLength).toHaveBeenCalledTimes(2);
    expect(props.setTruncateLength).toHaveBeenCalledWith(TruncateLength.XL);
    expect(wrapper.find('li').length).toBe(0);
  });
});
