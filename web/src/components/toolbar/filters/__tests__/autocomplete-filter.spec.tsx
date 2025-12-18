import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { FilterDefinitionSample } from '../../../../components/__tests-data__/filters';
import { actOn } from '../../../../components/__tests__/common.spec';
import { findFilter } from '../../../../utils/filter-definitions';
import AutocompleteFilter, { AutocompleteFilterProps } from '../autocomplete-filter';

describe('<AutocompleteFilter />', () => {
  const props: AutocompleteFilterProps = {
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

  it('should filter valid port by name', async () => {
    const wrapper = mount(
      <AutocompleteFilter {...props} filterDefinition={findFilter(FilterDefinitionSample, 'src_port')!} />
    );
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for source name
    await actOn(() => wrapper.find(TextInput).last().props().onChange!(null!, 'ftp'), wrapper);
    expect(props.setCurrentValue).toHaveBeenNthCalledWith(1, 'ftp');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ currentValue: 'ftp' });
    await actOn(() => wrapper.find('#autocomplete-search').last().simulate('keydown', { key: 'Enter' }), wrapper);

    act(() => {
      wrapper.update();
      expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: '21', display: 'ftp' });
    });
  });

  it('should reject invalid port by name', async () => {
    const wrapper = mount(
      <AutocompleteFilter {...props} filterDefinition={findFilter(FilterDefinitionSample, 'dst_port')!} />
    );
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for source name
    await actOn(() => textInput.props().onChange!(null!, 'no match'), wrapper);
    expect(props.setCurrentValue).toHaveBeenNthCalledWith(1, 'no match');

    // update prop as if the value was stored in parent component
    wrapper.setProps({ currentValue: 'no match' });
    expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.warning);

    // try to filter
    await actOn(() => wrapper.find('#autocomplete-search').last().simulate('keydown', { key: 'Enter' }), wrapper);

    act(() => {
      wrapper.update();
      expect(props.setIndicator).toHaveBeenNthCalledWith(3, ValidatedOptions.error);
      expect(props.addFilter).toHaveBeenCalledTimes(0);
    });
  });
});
