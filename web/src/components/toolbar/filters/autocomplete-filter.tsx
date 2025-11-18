import {
  Button,
  Flex,
  FlexItem,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  Popper,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { createFilterValue, FilterDefinition, FilterOption, FilterValue } from '../../../model/filters';
import { getHTTPErrorDetails } from '../../../utils/errors';
import { undefinedValue } from '../../../utils/filter-definitions';
import { Indicator } from '../../../utils/filters-helper';
import './autocomplete-filter.css';

const optionsMenuID = 'options-menu-list';
const isMenuOption = (elt?: Element) => {
  return elt?.parentElement?.id === optionsMenuID || elt?.parentElement?.parentElement?.id === optionsMenuID;
};

export interface AutocompleteFilterProps {
  filterDefinition: FilterDefinition;
  addFilter: (filter: FilterValue) => boolean;
  setMessage: (m: string | undefined) => void;
  indicator: Indicator;
  setIndicator: (ind: Indicator) => void;
  currentValue: string;
  setCurrentValue: (v: string) => void;
}

export const AutocompleteFilter: React.FC<AutocompleteFilterProps> = ({
  filterDefinition,
  addFilter: addFilterParent,
  setMessage,
  indicator,
  setIndicator,
  currentValue,
  setCurrentValue
}) => {
  const autocompleteContainerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const optionsRef = React.useRef<HTMLDivElement | null>(null);
  const [options, setOptions] = React.useState<FilterOption[]>([]);

  React.useEffect(() => {
    if (_.isEmpty(currentValue)) {
      setIndicator(ValidatedOptions.default);
    } else {
      //update validation icon on field on value change
      const validation = filterDefinition.validate(currentValue);
      setIndicator(validation.err ? ValidatedOptions.warning : ValidatedOptions.success);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentValue, filterDefinition, setIndicator]);

  const resetFilterValue = React.useCallback(() => {
    setCurrentValue('');
    setOptions([]);
    setMessage(undefined);
    setIndicator(ValidatedOptions.default);
  }, [setCurrentValue, setMessage, setIndicator, setOptions]);

  const addFilter = React.useCallback(
    (option: FilterOption) => {
      const filter: FilterValue = filterDefinition.autoCompleteAddsQuotes
        ? { v: `"${option.value}"`, display: `"${option.name}"` }
        : { v: option.value, display: option.name };
      if (addFilterParent(filter)) {
        resetFilterValue();
      }
    },
    [filterDefinition, addFilterParent, resetFilterValue]
  );

  const onAutoCompleteChange = React.useCallback(
    (newValue: string) => {
      setCurrentValue(newValue);
      filterDefinition
        .autocomplete(newValue)
        .then(setOptions)
        .catch(err => {
          const errorMessage = getHTTPErrorDetails(err);
          setMessage(errorMessage);
          setOptions([]);
        });
    },
    [setOptions, setCurrentValue, filterDefinition, setMessage]
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
        setOptions([]);
      }
    },
    [addFilter, onAutoCompleteChange, filterDefinition, currentValue, setOptions]
  );

  const onAutoCompleteSelect = React.useCallback(
    (e: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string) => {
      e?.stopPropagation();
      const option = options.find(opt => opt.value === itemId);
      if (!option) {
        return;
      }
      onAutoCompleteOptionSelected(option);
    },
    [options, onAutoCompleteOptionSelected]
  );

  const onEnter = React.useCallback(() => {
    // override empty value by undefined value
    let v = currentValue;
    if (currentValue.length === 0) {
      v = undefinedValue;
    }

    // Only one choice is present, consider this is what is desired
    if (options.length === 1) {
      onAutoCompleteOptionSelected(options[0]);
      return;
    }

    const validation = filterDefinition.validate(v);
    //show tooltip and icon when user try to validate filter
    if (!_.isEmpty(validation.err)) {
      setMessage(validation.err);
      setIndicator(ValidatedOptions.error);
      return;
    }

    const fv = createFilterValue(filterDefinition, validation.val!);
    if (addFilterParent(fv)) {
      resetFilterValue();
    }
  }, [
    options,
    filterDefinition,
    currentValue,
    onAutoCompleteOptionSelected,
    setMessage,
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
        setOptions([]);
      }
    }, 50);
  }, []);

  return (
    <Flex direction={{ default: 'row' }}>
      <div
        id="autocomplete-container"
        data-test="autocomplete-container"
        ref={autocompleteContainerRef}
        className="flex"
      >
        <Popper
          trigger={
            <TextInput
              type="search"
              aria-label="search"
              validated={indicator}
              placeholder={filterDefinition.placeholder}
              value={currentValue}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  onEnter();
                  e.preventDefault();
                }
              }}
              onChange={(event, value) => onAutoCompleteChange(value)}
              onBlur={onBlur}
              ref={searchInputRef}
              data-test="autocomplete-search"
              id="autocomplete-search"
            />
          }
          popper={
            <Menu ref={optionsRef} onSelect={onAutoCompleteSelect} isScrollable={options.length > 8}>
              <MenuContent>
                <MenuList id={optionsMenuID}>
                  {options.map(option => (
                    <MenuItem data-test={option.value} itemId={option.value} key={option.name} onBlur={onBlur}>
                      {option.name}
                    </MenuItem>
                  ))}
                </MenuList>
              </MenuContent>
            </Menu>
          }
          isVisible={!_.isEmpty(options)}
          enableFlip={false}
          appendTo={autocompleteContainerRef.current || undefined}
        />
      </div>
      <FlexItem>
        <Button
          data-test="autocomplete-menu-button"
          id="autocomplete-menu-button"
          variant="control"
          aria-label="show values"
          onClick={() =>
            setTimeout(() => {
              if (_.isEmpty(options)) {
                onAutoCompleteChange(currentValue);
              } else {
                setOptions([]);
              }
            }, 100)
          }
        >
          <CaretDownIcon />
        </Button>
      </FlexItem>
    </Flex>
  );
};

export default AutocompleteFilter;
