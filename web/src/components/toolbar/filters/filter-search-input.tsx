import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  Panel,
  PanelMain,
  PanelMainBody,
  Popper,
  SearchInput,
  ValidatedOptions
} from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition, Filters, FilterValue, findFromFilters } from '../../../model/filters';
import { findFilter, matcher } from '../../../utils/filter-definitions';
import { Indicator, swapFilterDefinition } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import AutocompleteFilter from './autocomplete-filter';
import CompareFilter, { FilterCompare } from './compare-filter';
import { FilterHints } from './filter-hints';
import './filter-search-input.css';
import FiltersDropdown from './filters-dropdown';
import TextFilter from './text-filter';

export interface FilterSearchInputProps {
  filterDefinitions: FilterDefinition[];
  filters?: Filters;
  setFilters: (v: Filters) => void;
  setMessage: (m: string | undefined) => void;
}

export const FilterSearchInput: React.FC<FilterSearchInputProps> = ({
  filterDefinitions,
  filters,
  setFilters,
  setMessage
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [direction, setDirection] = React.useState<'source' | 'destination'>();
  const [filter, setFilter] = React.useState<FilterDefinition | null>(
    findFilter(filterDefinitions, 'src_namespace') || filterDefinitions.length ? filterDefinitions[0] : null
  );
  const [compare, setCompare] = React.useState<FilterCompare>(FilterCompare.equal);
  const [value, setValue] = React.useState<string>('');
  const [indicator, setIndicator] = React.useState<Indicator>(ValidatedOptions.default);

  const searchInputRef = React.useRef(null);
  const [searchInputValue, setSearchInputValue] = React.useState('');
  const advancedSearchPaneRef = useOutsideClickEvent(() => {
    setSearchInputValue(getEncodedValue());
    setAdvancedSearchOpen(false);
    // clear search field to show the placeholder back
    if (_.isEmpty(value)) {
      setSearchInputValue('');
    }
  });
  const [isAdvancedSearchOpen, setAdvancedSearchOpen] = React.useState(false);
  const [submitPending, setSubmitPending] = React.useState(false);

  const reset = React.useCallback(() => {
    setCompare(FilterCompare.equal);
    setValue('');
    setSearchInputValue('');
  }, []);

  const addFilter = React.useCallback(
    (filterValue: FilterValue) => {
      if (filter === null) {
        console.error('addFilter called with', filter);
        return false;
      }
      const def = filters?.match !== 'any' ? swapFilterDefinition(filterDefinitions, filter, 'src') : filter;
      const newFilters = _.cloneDeep(filters?.list) || [];
      const not = compare === FilterCompare.notEqual;
      const moreThan = compare === FilterCompare.moreThanOrEqual;
      const found = findFromFilters(newFilters, { def, not, moreThan });
      if (found) {
        if (found.values.map(value => value.v).includes(filterValue.v)) {
          setMessage(t('Filter already exists'));
          setIndicator(ValidatedOptions.error);
          return false;
        } else {
          found.values.push(filterValue);
        }
      } else {
        newFilters.push({ def, not, moreThan, values: [filterValue] });
      }
      setFilters({ ...filters!, list: newFilters });
      setAdvancedSearchOpen(false);
      reset();
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, filters, filterDefinitions, compare, setFilters, setMessage]
  );

  const updateForm = React.useCallback(
    (submitOnRefresh?: boolean) => {
      // parse search input value to form content
      let fieldValue: string[] = [];

      if (searchInputValue.includes('!=')) {
        fieldValue = searchInputValue.replace('!=', '|').split('|');
        setCompare(FilterCompare.notEqual);
      } else if (searchInputValue.includes('>=')) {
        fieldValue = searchInputValue.replace('>=', '|').split('|');
        setCompare(FilterCompare.moreThanOrEqual);
      } else if (searchInputValue.includes('=')) {
        fieldValue = searchInputValue.replace('=', '|').split('|');
        setCompare(FilterCompare.equal);
      } else {
        setValue(searchInputValue);
      }

      if (fieldValue.length == 2) {
        const searchValue = fieldValue[0].toLowerCase();
        if (searchValue.startsWith('src')) {
          setDirection('source');
        } else if (searchValue.startsWith('dst')) {
          setDirection('destination');
        } else {
          setDirection(undefined);
        }

        const def = filterDefinitions.find(def => def.id.toLowerCase() === searchValue);
        if (def) {
          setFilter(def);
        }
        setValue(fieldValue[1]);
      }

      if (submitOnRefresh) {
        setSubmitPending(true);
      }
    },
    [filterDefinitions, searchInputValue]
  );

  const getEncodedValue = React.useCallback(() => {
    if (filter === null) {
      return '';
    }
    return matcher(filter.id, [value], compare === FilterCompare.notEqual, compare === FilterCompare.moreThanOrEqual);
  }, [compare, filter, value]);

  const onToggle = React.useCallback(() => {
    if (isAdvancedSearchOpen) {
      setTimeout(() => {
        updateForm();
      });
    }
    setAdvancedSearchOpen(!isAdvancedSearchOpen);
  }, [isAdvancedSearchOpen, updateForm]);

  const searchInput = React.useCallback(
    () => (
      <SearchInput
        onClear={reset}
        onChange={(e, v) => {
          setSearchInputValue(v);
        }}
        onSearch={(e, v) => {
          if (_.isEmpty(v)) {
            setAdvancedSearchOpen(true);
          } else {
            setSearchInputValue(v);
            updateForm(true);
          }
        }}
        onToggleAdvancedSearch={onToggle}
        value={isAdvancedSearchOpen ? getEncodedValue() : searchInputValue}
        isAdvancedSearchOpen={isAdvancedSearchOpen}
        placeholder={filter?.hint}
        ref={searchInputRef}
        id="filter-search-input"
      />
    ),
    [filter?.hint, getEncodedValue, isAdvancedSearchOpen, onToggle, reset, searchInputValue, updateForm]
  );

  const advancedForm = React.useCallback(() => {
    if (!filter) {
      return <></>;
    }

    return (
      <div id="filter-search-form" ref={advancedSearchPaneRef} role="dialog">
        <Panel variant="raised">
          <PanelMain>
            <PanelMainBody>
              <Form>
                <FormGroup label={t('Filter')} fieldId="field" key="field">
                  <FiltersDropdown
                    filterDefinitions={filterDefinitions}
                    selectedDirection={direction}
                    setSelectedDirection={setDirection}
                    selectedFilter={filter}
                    setSelectedFilter={setFilter}
                  />
                  <FilterHints def={filter} />
                </FormGroup>
                <FormGroup label={t('Comparator')} fieldId="compare" key="compare">
                  <CompareFilter value={compare} setValue={setCompare} component={filter.component} />
                </FormGroup>
                <FormGroup label={t('Value')} fieldId="value" key="value">
                  {filter.component === 'autocomplete' ? (
                    <AutocompleteFilter
                      filterDefinition={filter}
                      addFilter={addFilter}
                      setMessage={setMessage}
                      indicator={indicator}
                      setIndicator={setIndicator}
                      currentValue={value}
                      setCurrentValue={setValue}
                    />
                  ) : (
                    <TextFilter
                      filterDefinition={filter}
                      addFilter={addFilter}
                      setMessage={setMessage}
                      indicator={indicator}
                      setIndicator={setIndicator}
                      allowEmpty={compare !== FilterCompare.moreThanOrEqual}
                      regexp={filter.component === 'number' ? /\D/g : undefined}
                      currentValue={value}
                      setCurrentValue={setValue}
                    />
                  )}
                </FormGroup>
                <ActionGroup className="filters-actions">
                  <Button variant="link" type="reset" onClick={reset}>
                    {t('Reset')}
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    onClick={e => {
                      e.preventDefault();
                      console.log('Add filter', e);
                      addFilter({ v: value });
                    }}
                  >
                    {t('Add filter')}
                  </Button>
                </ActionGroup>
              </Form>
            </PanelMainBody>
          </PanelMain>
        </Panel>
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    addFilter,
    advancedSearchPaneRef,
    compare,
    direction,
    filter,
    filterDefinitions,
    indicator,
    reset,
    setMessage,
    value
  ]);

  React.useEffect(() => {
    if (submitPending) {
      setSubmitPending(false);
      addFilter({ v: value });
    }
  }, [submitPending, setSubmitPending, addFilter, value]);

  if (filter == null) {
    return <></>;
  }
  // Popper is just one way to build a relationship between a toggle and a menu.
  return (
    <Popper
      trigger={searchInput()}
      triggerRef={searchInputRef}
      popper={advancedForm()}
      popperRef={advancedSearchPaneRef}
      isVisible={isAdvancedSearchOpen}
      enableFlip={false}
      appendTo={() => document.querySelector('#filter-search-input')!}
    />
  );
};

export default FilterSearchInput;
