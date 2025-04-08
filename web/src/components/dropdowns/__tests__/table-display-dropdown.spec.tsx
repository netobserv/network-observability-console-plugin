import { Radio } from '@patternfly/react-core';
import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { act } from 'react-dom/test-utils';
import { Size, TableDisplayDropdown } from '../table-display-dropdown';
import { TableDisplayOptions } from '../table-display-options';

describe('<DisplayDropdown />', () => {
  const props = {
    size: 's' as Size,
    setSize: jest.fn(),
    showDuplicates: true,
    setShowDuplicates: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = shallow(<TableDisplayDropdown {...props} />);
    expect(wrapper.find(TableDisplayDropdown)).toBeTruthy();
  });
  it('should setSize on select', async () => {
    const wrapper = mount(<TableDisplayOptions {...props} />);

    //select compact
    act(() => {
      wrapper.find('#size-s').find(Radio).props().onChange!(true, {} as React.FormEvent<HTMLInputElement>);
    });
    expect(props.setSize).toHaveBeenCalledWith('s');
    expect(wrapper.find('li').length).toBe(0);

    //select large
    act(() => {
      wrapper.find('#size-l').find(Radio).props().onChange!(true, {} as React.FormEvent<HTMLInputElement>);
    });
    expect(props.setSize).toHaveBeenCalledWith('l');

    //setSize should be called twice
    expect(props.setSize).toHaveBeenCalledTimes(2);
  });
});
