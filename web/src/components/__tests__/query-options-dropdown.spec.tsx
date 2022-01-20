import * as React from 'react';
import { Radio, Select } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import { act } from 'react-dom/test-utils';
import QueryOptionsDropdown, { QueryOptionsDropdownProps, QueryOptionsPanel } from '../query-options-dropdown';
import { QueryOptions } from '../../model/query-options';

describe('<QueryOptionsDropdown />', () => {
  const props: QueryOptionsDropdownProps = {
    options: { reporter: 'destination', limit: 100 },
    setOptions: jest.fn()
  };
  it('should render component', async () => {
    const wrapper = shallow(<QueryOptionsDropdown {...props} />);
    expect(wrapper.find(QueryOptionsDropdown)).toBeTruthy();
    expect(wrapper.find(Select)).toBeTruthy();
  });
});

describe('<QueryOptionsPanel />', () => {
  const props: QueryOptionsDropdownProps = {
    options: { reporter: 'destination', limit: 100 },
    setOptions: jest.fn()
  };
  beforeEach(() => {
    props.setOptions = jest.fn();
  });
  it('should render component', async () => {
    const wrapper = shallow(<QueryOptionsPanel {...props} />);
    expect(wrapper.find('.pf-c-select__menu-group').length).toBe(1);
    expect(wrapper.find('.pf-c-select__menu-group-title').length).toBe(2);
    expect(wrapper.find(Radio)).toHaveLength(6);

    //setOptions should not be called at startup, because it is supposed to be already initialized from URL
    expect(props.setOptions).toHaveBeenCalledTimes(0);
  });
  it('should set options', async () => {
    const wrapper = shallow(<QueryOptionsPanel {...props} />);
    let setOptionsCallsExpected = 0;
    expect(props.setOptions).toHaveBeenCalledTimes(setOptionsCallsExpected);

    act(() => {
      // Radio 0 = reporter-source
      wrapper.find(Radio).at(0).props().onChange!(true, {} as React.FormEvent<HTMLInputElement>);
    });
    let expected: QueryOptions = {
      reporter: 'source',
      limit: 100
    };
    expect(props.setOptions).toHaveBeenNthCalledWith(++setOptionsCallsExpected, expected);
    wrapper.setProps({ ...props, options: expected });

    act(() => {
      // Radio 2 = reporter-both
      wrapper.find(Radio).at(2).props().onChange!(true, {} as React.FormEvent<HTMLInputElement>);
    });
    expected = {
      reporter: 'both',
      limit: 100
    };
    expect(props.setOptions).toHaveBeenNthCalledWith(++setOptionsCallsExpected, expected);
    wrapper.setProps({ ...props, options: expected });

    act(() => {
      // Radio 5 = limit-1000
      wrapper.find(Radio).at(5).props().onChange!(true, {} as React.FormEvent<HTMLInputElement>);
    });
    expected = {
      reporter: 'both',
      limit: 1000
    };
    expect(props.setOptions).toHaveBeenNthCalledWith(++setOptionsCallsExpected, expected);
    wrapper.setProps(props as Pick<QueryOptionsDropdownProps, keyof QueryOptionsDropdownProps>);
  });
});
