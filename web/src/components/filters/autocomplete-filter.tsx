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
import { usePrevious } from '../../utils/previous-hook';

const optionsMenuID = 'options-menu-list';
const isMenuOption = (elt?: Element) => {
  return elt?.parentElement?.id === optionsMenuID || elt?.parentElement?.parentElement?.id === optionsMenuID;
};

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
  const optionsRef = React.useRef<HTMLDivElement | null>(null);
  const [autocompleteOptions, setAutocompleteOptions] = React.useState<FilterOption[]>([]);
  const [isPopperVisible, setPopperVisible] = React.useState(false);
  const [currentValue, setCurrentValue] = React.useState<string>('');
  const previousFilterDefinition = usePrevious(filterDefinition);

  React.useEffect(() => {
    if (filterDefinition !== previousFilterDefinition) {
      //reset filter value if definition has changed
      resetFilterValue();
      searchInputRef?.current?.focus();
      autoCompleteCache.clear();
    } else if (_.isEmpty(currentValue)) {
      setIndicator(ValidatedOptions.default);
    } else {
      //update validation icon on field on value change
      const validation = filterDefinition.validate(currentValue);
      setIndicator(validation.err ? ValidatedOptions.warning : ValidatedOptions.success);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const onBlur = React.useCallback(() => {
    // Timeout hack: we need to reset autocompletion / close popup
    // only if the focus isn't moved from the text input to the popup itself
    // We need to skip a couple of render frames to get the new focused element
    setTimeout(() => {
      if (!isMenuOption(document.activeElement || undefined)) {
        setAutocompleteOptions([]);
      }
    }, 50);
  }, []);

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
              onBlur={onBlur}
              ref={searchInputRef}
              id="autocomplete-search"
            />
          }
          popper={
            <Menu ref={optionsRef} onSelect={onAutoCompleteSelect}>
              <MenuContent>
                <MenuList id={optionsMenuID}>
                  {autocompleteOptions.map(option => (
                    <MenuItem itemId={option.value} key={option.name} onBlur={onBlur}>
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
