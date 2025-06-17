import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { createFilterValue, FilterDefinition, FilterValue } from '../../../model/filters';
import { doubleQuoteValue, undefinedValue } from '../../../utils/filter-definitions';
import { Indicator } from '../../../utils/filters-helper';

export interface TextFilterProps {
  filterDefinition: FilterDefinition;
  addFilter: (filter: FilterValue) => boolean;
  setMessage: (m: string | undefined) => void;
  indicator: Indicator;
  setIndicator: (ind: Indicator) => void;
  allowEmpty?: boolean;
  regexp?: RegExp;
  currentValue: string;
  setCurrentValue: (v: string) => void;
}

export const TextFilter: React.FC<TextFilterProps> = ({
  filterDefinition,
  addFilter,
  setMessage,
  indicator,
  setIndicator,
  allowEmpty,
  regexp,
  currentValue,
  setCurrentValue
}) => {
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

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
    [regexp, setCurrentValue]
  );

  const resetFilterValue = React.useCallback(() => {
    setCurrentValue('');
    setMessage(undefined);
    setIndicator(ValidatedOptions.default);
  }, [setCurrentValue, setMessage, setIndicator]);

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
      setMessage(validation.err);
      setIndicator(ValidatedOptions.error);
      return;
    }

    const fv = createFilterValue(filterDefinition, validation.val!);
    if (addFilter(fv)) {
      resetFilterValue();
    }
  }, [currentValue, allowEmpty, filterDefinition, setMessage, setIndicator, addFilter, resetFilterValue]);

  return (
    <TextInput
      type="search"
      aria-label="search"
      validated={indicator}
      placeholder={filterDefinition.placeholder}
      onChange={(event, value) => updateValue(value)}
      onKeyPress={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSelect();
        }
      }}
      value={currentValue}
      ref={searchInputRef}
      id="search"
    />
  );
};

export default TextFilter;
