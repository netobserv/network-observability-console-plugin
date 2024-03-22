import { Radio } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { act } from 'react-dom/test-utils';
import { Size, TableDisplayDropdown, TableDisplayOptions } from '../table-display-dropdown';

describe('<DisplayDropdown />', () => {
  const props = {
    size: 's' as Size,
    setSize: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = shallow(<TableDisplayDropdown {...props} />);
    expect(wrapper.find(TableDisplayDropdown)).toBeTruthy();
  });
  it('should setSize on select', async () => {
    const wrapper = mount(<TableDisplayOptions {...props} />);

    //select compact
    act(() => {
      wrapper.find('#size-s').find(Radio).props().onChange!({} as React.FormEvent<HTMLInputElement>, true);
    });
    expect(props.setSize).toHaveBeenCalledWith('s');
    expect(wrapper.find('li').length).toBe(0);

    //select large
    act(() => {
      wrapper.find('#size-l').find(Radio).props().onChange!({} as React.FormEvent<HTMLInputElement>, true);
    });
    expect(props.setSize).toHaveBeenCalledWith('l');

    //setSize should be called twice
    expect(props.setSize).toHaveBeenCalledTimes(2);
  });
});
