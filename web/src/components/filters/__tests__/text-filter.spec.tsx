import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { findFilter } from '../../../utils/filter-definitions';
import TextFilter, { TextFilterProps } from '../text-filter';

const t = (k: string) => k;

describe('<TextFilter />', () => {
  const props: TextFilterProps = {
    filterDefinition: findFilter(t, 'src_name')!,
    indicator: ValidatedOptions.default,
    addFilter: jest.fn(),
    setMessageWithDelay: jest.fn(),
    setIndicator: jest.fn()
  };
  beforeEach(() => {
    props.addFilter = jest.fn();
    props.setIndicator = jest.fn();
  });
  it('should filter name', done => {
    const wrapper = mount(<TextFilter {...props} filterDefinition={findFilter(t, 'src_name')!} />);
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
    act(() => {
      textInput.props().onChange!('abcd', null!);
    });
    setImmediate(() => {
      wrapper.update();
      expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.success);
      expect(props.addFilter).toHaveBeenCalledTimes(0);

      // Add filter
      searchButton.simulate('click');

      setImmediate(() => {
        wrapper.update();
        expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: 'abcd' });
        done();
      });
    });
  });

  it('should filter valid IP', done => {
    const wrapper = mount(<TextFilter {...props} filterDefinition={findFilter(t, 'src_address')!} />);
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for dest IP
    act(() => {
      textInput.props().onChange!('10.0.0.1', null!);
    });

    // Add filter
    searchButton.simulate('click');

    setImmediate(() => {
      wrapper.update();
      expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: '10.0.0.1' });
      done();
    });
  });

  it('should not filter invalid IP', done => {
    const wrapper = mount(<TextFilter {...props} filterDefinition={findFilter(t, 'dst_host_address')!} />);
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(1);
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for dest IP
    act(() => {
      textInput.props().onChange!('10.0.', null!);
    });
    setImmediate(() => {
      wrapper.update();
      expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.warning);
      expect(props.addFilter).toHaveBeenCalledTimes(0);

      // Add filter
      searchButton.simulate('click');

      setImmediate(() => {
        wrapper.update();
        expect(props.setIndicator).toHaveBeenNthCalledWith(2, ValidatedOptions.warning);
        expect(props.addFilter).toHaveBeenCalledTimes(0);
        done();
      });
    });
  });
});
