import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import { mount } from 'enzyme';
import * as React from 'react';
import { act } from 'react-dom/test-utils';
import { findFilter } from '../../../utils/filter-definitions';
import AutocompleteFilter, { AutocompleteFilterProps } from '../autocomplete-filter';

const t = (k: string) => k;

const waitForComponentToPaint = async (): Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
};

describe('<AutocompleteFilter />', () => {
  const props: AutocompleteFilterProps = {
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

  it('should filter valid port by name', async () => {
    const wrapper = mount(<AutocompleteFilter {...props} filterDefinition={findFilter(t, 'src_port')!} />);
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(2); // <-- WHY ?
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for source name
    await act(() => {
      textInput.props().onChange!('ftp', null!);
      return waitForComponentToPaint();
    });
    textInput.simulate('keypress', { key: 'Enter' });

    expect(props.addFilter).toHaveBeenNthCalledWith(1, { v: '21', display: 'ftp' });
  });

  it('should reject invalid port by name', async () => {
    const wrapper = mount(<AutocompleteFilter {...props} filterDefinition={findFilter(t, 'dst_port')!} />);
    const textInput = wrapper.find(TextInput).at(0);
    const searchButton = wrapper.find('#search-button').at(0);

    expect(textInput).toBeDefined();
    expect(searchButton).toBeDefined();

    // No initial call
    expect(props.addFilter).toHaveBeenCalledTimes(0);
    // Initial setup
    expect(props.setIndicator).toHaveBeenCalledTimes(2); // <-- WHY ?
    expect(textInput.props().validated).toBe(ValidatedOptions.default);

    // Filter for source name
    await act(() => {
      textInput.props().onChange!('no match', null!);
      return waitForComponentToPaint();
    });
    expect(props.setIndicator).toHaveBeenNthCalledWith(3, ValidatedOptions.warning);
    textInput.simulate('keypress', { key: 'Enter' });

    expect(props.setIndicator).toHaveBeenNthCalledWith(4, ValidatedOptions.error);
    expect(props.addFilter).toHaveBeenCalledTimes(0);
  });
});
