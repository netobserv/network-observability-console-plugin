import * as React from 'react';
import { shallow } from 'enzyme';

import RefreshDropdown from "../refresh-dropdown";

describe("<RefreshDropdown />", () => {
  const props = {
    interval: null,
    setInterval: jest.fn(),
  }
  it('should render component', () => {
    const wrapper = shallow(
      <RefreshDropdown {...props} />
    );
    expect(wrapper.find(RefreshDropdown)).toBeTruthy();
  });
});