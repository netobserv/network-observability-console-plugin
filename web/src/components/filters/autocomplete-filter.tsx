import * as React from 'react';
import * as _ from 'lodash';
import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  Popper,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { createFilterValue, FilterDefinition, FilterOption, FilterValue } from '../../model/filters';
import { getHTTPErrorDetails } from '../../utils/errors';
import { autoCompleteCache } from '../../utils/autocomplete-cache';
import { Indicator } from './filters-helper';

export interface AutocompleteFilterProps {
  filterDefinition: FilterDefinition;
  addFilter: (filter: FilterValue) => boolean;
  setMessageWithDelay: (m: string | undefined) => void;
  indicator: Indicator;
  setIndicator: (ind: Indicator) => void;
}

export const AutocompleteFilter: React.FC<AutocompleteFilterProps> = ({
  filterDefinition,
  addFilter: addFilterParent,
  setMessageWithDelay,
  indicator,
  setIndicator
}) => {
  const autocompleteContainerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = React.useState<FilterOption[]>([]);
  const [isPopperVisible, setPopperVisible] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState<string>('');

  React.useEffect(() => {
    //update validation icon on field on value change
    if (!_.isEmpty(currentValue)) {
      const validation = filterDefinition.validate(currentValue);
      setIndicator(!_.isEmpty(validation.err) ? ValidatedOptions.warning : ValidatedOptions.success);
    } else {
      setIndicator(ValidatedOptions.default);
    }
  }, [currentValue, filterDefinition, setIndicator]);

  React.useEffect(() => {
    // The menu is hidden if there are no options
    setPopperVisible(autocompleteOptions.length > 0);
  }, [autocompleteOptions]);

  const resetFilterValue = React.useCallback(() => {
    setCurrentValue('');
    setAutocompleteOptions([]);
    setMessageWithDelay(undefined);
    setIndicator(ValidatedOptions.default);
  }, [setCurrentValue, setAutocompleteOptions, setMessageWithDelay, setIndicator]);

  React.useEffect(() => {
    resetFilterValue();
    searchInputRef?.current?.focus();
    autoCompleteCache.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDefinition]);

  const addFilter = React.useCallback(
    (option: FilterOption) => {
      if (addFilterParent({ v: option.value, display: option.name })) {
        resetFilterValue();
      }
    },
    [addFilterParent, resetFilterValue]
  );

  const onAutoCompleteChange = React.useCallback(
    (newValue: string) => {
      setCurrentValue(newValue);
      filterDefinition
        .getOptions(newValue)
        .then(setAutocompleteOptions)
        .catch(err => {
          const errorMessage = getHTTPErrorDetails(err);
          setMessageWithDelay(errorMessage);
          setAutocompleteOptions([]);
        });
    },
    [setCurrentValue, filterDefinition, setAutocompleteOptions, setMessageWithDelay]
  );

  const onAutoCompleteOptionSelected = React.useCallback(
    (option: FilterOption) => {
      if (filterDefinition.checkCompletion) {
        const completion = filterDefinition.checkCompletion(currentValue, option.name);
        if (completion.completed) {
          addFilter(completion.option);
        } else {
          onAutoCompleteChange(completion.option.value);
        }
      } else {
        addFilter(option);
        setAutocompleteOptions([]);
      }
    },
    [addFilter, onAutoCompleteChange, filterDefinition, currentValue]
  );

  const onAutoCompleteSelect = React.useCallback(
    (e: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string) => {
      e?.stopPropagation();
      const option = autocompleteOptions.find(opt => opt.value === itemId);
      if (!option) {
        return;
      }
      onAutoCompleteOptionSelected(option);
    },
    [autocompleteOptions, onAutoCompleteOptionSelected]
  );

  const onEnter = React.useCallback(() => {
    // Only one choice is present, consider this is what is desired
    if (autocompleteOptions.length === 1) {
      onAutoCompleteOptionSelected(autocompleteOptions[0]);
      return;
    }

    const validation = filterDefinition.validate(currentValue);
    //show tooltip and icon when user try to validate filter
    if (!_.isEmpty(validation.err)) {
      setMessageWithDelay(validation.err);
      setIndicator(ValidatedOptions.error);
      return;
    }

    createFilterValue(filterDefinition, validation.val!).then(v => {
      if (addFilterParent(v)) {
        resetFilterValue();
      }
    });
  }, [
    autocompleteOptions,
    filterDefinition,
    currentValue,
    onAutoCompleteOptionSelected,
    setMessageWithDelay,
    setIndicator,
    addFilterParent,
    resetFilterValue
  ]);

  return (
    <>
      <div ref={autocompleteContainerRef}>
        <Popper
          trigger={
            <TextInput
              type="search"
              aria-label="search"
              validated={indicator}
              placeholder={filterDefinition.placeholder}
              value={currentValue}
              onKeyPress={e => e.key === 'Enter' && onEnter()}
              onChange={onAutoCompleteChange}
              ref={searchInputRef}
              id="autocomplete-search"
            />
          }
          popper={
            <Menu onSelect={onAutoCompleteSelect}>
              <MenuContent>
                <MenuList>
                  {autocompleteOptions.map(option => (
                    <MenuItem itemId={option.value} key={option.name}>
                      {option.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuContent>
            </Menu>
          }
          isVisible={isPopperVisible}
          enableFlip={false}
          appendTo={autocompleteContainerRef.current!}
        />
      </div>
      <Button id="search-button" variant="control" aria-label="search button for filter" onClick={() => onEnter()}>
        <SearchIcon />
      </Button>
    </>
  );
};

export default AutocompleteFilter;
