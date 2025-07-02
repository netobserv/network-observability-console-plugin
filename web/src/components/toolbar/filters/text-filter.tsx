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

  const updateIndicator = React.useCallback(
    (v = currentValue) => {
      //update validation icon on field on value change
      if (!_.isEmpty(v)) {
        const validation = filterDefinition.validate(String(v));
        setIndicator(!_.isEmpty(validation.err) ? ValidatedOptions.warning : ValidatedOptions.success);
      } else {
        setIndicator(ValidatedOptions.default);
      }
    },
    [currentValue, filterDefinition, setIndicator]
  );

  const updateValue = React.useCallback(
    (v: string) => {
      let filteredValue = v;
      if (![doubleQuoteValue, undefinedValue].includes(filteredValue) && regexp) {
        filteredValue = filteredValue.replace(regexp, '');
      }
      setCurrentValue(filteredValue);
      updateIndicator(filteredValue);
    },
    [regexp, setCurrentValue, updateIndicator]
  );

  const resetFilterValue = React.useCallback(() => {
    setCurrentValue('');
    setMessage(undefined);
    setIndicator(ValidatedOptions.default);
  }, [setCurrentValue, setMessage, setIndicator]);

  const onEnter = React.useCallback(() => {
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

  React.useEffect(() => {
    updateIndicator();
  }, [currentValue, updateIndicator]);

  return (
    <TextInput
      type="search"
      aria-label="search"
      validated={indicator}
      placeholder={filterDefinition.placeholder}
      onChange={(event, value) => updateValue(value)}
      onKeyDown={e => e.key === 'Enter' && onEnter()}
      value={currentValue}
      ref={searchInputRef}
      id="search"
    />
  );
};

export default TextFilter;
