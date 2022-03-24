import { DrawerCloseButton, Switch } from '@patternfly/react-core';
import { shallow } from 'enzyme';
import * as React from 'react';
import { DefaultOptions, LayoutName } from '../../../model/topology';
import { OptionsPanel } from '../options-panel';

describe('<OptionsPanel />', () => {
  const mocks = {
    layout: LayoutName.Cola,
    setLayout: jest.fn(),
    options: DefaultOptions,
    setOptions: jest.fn(),
    onClose: jest.fn(),
    id: 'options-panel-test'
  };
  it('should render component', async () => {
    const wrapper = shallow(<OptionsPanel {...mocks} />);
    expect(wrapper.find(OptionsPanel)).toBeTruthy();
    expect(wrapper.find('#options-panel-test')).toHaveLength(1);
  });

  it('should close on click', async () => {
    const wrapper = shallow(<OptionsPanel {...mocks} />);
    const closeButton = wrapper.find(DrawerCloseButton);
    expect(closeButton).toHaveLength(1);
    closeButton.simulate('click');
    expect(mocks.onClose).toHaveBeenCalled();
  });

  it('should update options', async () => {
    const wrapper = shallow(<OptionsPanel {...mocks} />);

    //switch group option
    wrapper.find('#group-collapsed-switch').find(Switch).props().onChange!(
      !mocks.options.startCollapsed,
      {} as React.FormEvent<HTMLInputElement>
    );
    expect(mocks.setOptions).toHaveBeenCalledWith({ ...mocks.options, startCollapsed: !mocks.options.startCollapsed });

    //switch edges option
    wrapper.find('#edges-switch').find(Switch).props().onChange!(
      !mocks.options.edges,
      {} as React.FormEvent<HTMLInputElement>
    );
    expect(mocks.setOptions).toHaveBeenCalledWith({ ...mocks.options, edges: !mocks.options.edges });

    //setOptions should be called twice
    expect(mocks.setOptions).toHaveBeenCalledTimes(2);
  });
});
