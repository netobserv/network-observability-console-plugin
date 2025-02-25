import { Button, SearchInput, ValidatedOptions } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { createFilterValue, FilterDefinition, FilterValue } from '../../../model/filters';
import { doubleQuoteValue, undefinedValue } from '../../../utils/filter-definitions';
import { Indicator } from '../../../utils/filters-helper';

export interface TextFilterProps {
  filterDefinition: FilterDefinition;
  addFilter: (filter: FilterValue) => boolean;
  setMessageWithDelay: (m: string | undefined) => void;
  indicator: Indicator;
  setIndicator: (ind: Indicator) => void;
  allowEmpty?: boolean;
  regexp?: RegExp;
}

export const TextFilter: React.FC<TextFilterProps> = ({
  filterDefinition,
  addFilter,
  setMessageWithDelay,
  indicator,
  setIndicator,
  allowEmpty,
  regexp
}) => {
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [currentValue, setCurrentValue] = React.useState<string>('');

  React.useEffect(() => {
    //update validation icon on field on value change
    if (!_.isEmpty(currentValue)) {
      const validation = filterDefinition.validate(String(currentValue));
      setIndicator(!_.isEmpty(validation.err) ? ValidatedOptions.warning : ValidatedOptions.success);
    } else {
      setIndicator(ValidatedOptions.default);
    }
  }, [currentValue, filterDefinition, setIndicator]);

  const updateValue = React.useCallback(
    (v: string) => {
      let filteredValue = v;
      if (![doubleQuoteValue, undefinedValue].includes(filteredValue) && regexp) {
        filteredValue = filteredValue.replace(regexp, '');
      }
      setCurrentValue(filteredValue);
    },
    [regexp]
  );

  const resetFilterValue = React.useCallback(() => {
    setCurrentValue('');
    setMessageWithDelay(undefined);
    setIndicator(ValidatedOptions.default);
  }, [setCurrentValue, setMessageWithDelay, setIndicator]);

  const onSelect = React.useCallback(() => {
    // override empty value by undefined value
    let v = currentValue;
    if (allowEmpty) {
      if (currentValue.length === 0) {
        v = undefinedValue;
      }
    } else if (v === undefinedValue) {
      v = '';
    }

    const validation = filterDefinition.validate(String(v));
    //show tooltip and icon when user try to validate filter
    if (!_.isEmpty(validation.err)) {
      setMessageWithDelay(validation.err);
      setIndicator(ValidatedOptions.error);
      return;
    }

    createFilterValue(filterDefinition, validation.val!).then(v => {
      if (addFilter(v)) {
        resetFilterValue();
      }
    });
  }, [currentValue, allowEmpty, filterDefinition, setMessageWithDelay, setIndicator, addFilter, resetFilterValue]);

  return (
    <>
      <SearchInput
        type="search"
        aria-label="search"
        placeholder={filterDefinition.placeholder}
        onChange={(event, value) => updateValue(value)}
        onKeyPress={e => e.key === 'Enter' && onSelect()}
        value={currentValue}
        ref={searchInputRef}
        id="search"
      />
      <Button
        icon={<SearchIcon />}
        id="search-button"
        variant="control"
        aria-label="search button for filter"
        onClick={() => onSelect()}
      />
    </>
  );
};

export default TextFilter;
