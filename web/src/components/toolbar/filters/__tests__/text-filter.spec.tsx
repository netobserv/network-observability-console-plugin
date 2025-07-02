import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import { act } from '@testing-library/react';
import { mount } from 'enzyme';
import * as React from 'react';
import { FilterDefinitionSample } from '../../../../components/__tests-data__/filters';
import { actOn } from '../../../../components/__tests__/common.spec';
import { findFilter } from '../../../../utils/filter-definitions';
import TextFilter, { TextFilterProps } from '../text-filter';

describe('<TextFilter />', () => {
  const props: TextFilterProps = {
    filterDefinition: findFilter(FilterDefinitionSample, 'src_name')!,
    indicator: ValidatedOptions.default,
    currentValue: '',
    setCurrentValue: jest.fn(),
    addFilter: jest.fn(),
    setMessage: jest.fn(),
    setIndicator: jest.fn()
  };
  beforeEach(() => {
    props.setCurrentValue = jest.fn();
    props.addFilter = jest.fn();
    props.setIndicator = jest.fn();
  });
  it('should filter name', async () => {
    const wrapper = mount(<TextFilter {...props} filterDefinition={findFilter(FilterDefinitionSample, 'src_name')!} />);
    const textInput = wrapper.find(TextInput).last();

    expect(textInput).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for source name
    await actOn(() => wrapper.find(TextInput).last().props().onChange!(null!, 'abcd'), wrapper);
    expect(props.setCurrentValue).toHaveBeenNthCalledWith(1, 'abcd');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ currentValue: 'abcd' });
    await actOn(() => wrapper.find('#search').last().simulate('keydown', { key: 'Enter' }), wrapper);
    expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: 'abcd' });
  });

  it('should filter valid IP', async () => {
    const wrapper = mount(
      <TextFilter {...props} filterDefinition={findFilter(FilterDefinitionSample, 'src_address')!} />
    );
    const textInput = wrapper.find(TextInput).at(0);

    expect(textInput).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for dest IP
    await actOn(() => wrapper.find(TextInput).last().props().onChange!(null!, '10.0.0.1'), wrapper);
    expect(props.setCurrentValue).toHaveBeenNthCalledWith(1, '10.0.0.1');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ currentValue: '10.0.0.1' });

    // Add filter
    await actOn(() => wrapper.find('#search').last().simulate('keydown', { key: 'Enter' }), wrapper);
    act(() => {
      wrapper.update();
      expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: '10.0.0.1' });
    });
  });

  it('should not filter invalid IP', async () => {
    const wrapper = mount(
      <TextFilter {...props} filterDefinition={findFilter(FilterDefinitionSample, 'dst_host_address')!} />
    );
    const textInput = wrapper.find(TextInput).at(0);

    expect(textInput).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for dest IP
    await actOn(() => wrapper.find(TextInput).last().props().onChange!(null!, '10.0.'), wrapper);
    expect(props.setCurrentValue).toHaveBeenNthCalledWith(1, '10.0.');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ currentValue: '10.0.' });
    expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.warning);
    expect(props.addFilter).toHaveBeenCalledTimes(0);

    // try to filter
    await actOn(() => wrapper.find('#search').last().simulate('keydown', { key: 'Enter' }), wrapper);

    act(() => {
      wrapper.update();
      expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.warning);
      expect(props.addFilter).toHaveBeenCalledTimes(0);
    });
  });
});
