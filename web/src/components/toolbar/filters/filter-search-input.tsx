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
import { matcher } from '../../../utils/filter-definitions';
import { Indicator, setTargeteableFilters } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import { Direction } from '../filters-toolbar';
import AutocompleteFilter from './autocomplete-filter';
import CompareFilter, { FilterCompare } from './compare-filter';
import { FilterHints } from './filter-hints';
import './filter-search-input.css';
import FiltersDropdown from './filters-dropdown';
import TextFilter from './text-filter';

export interface FilterSearchInputProps {
  filterDefinitions: FilterDefinition[];
  filters?: Filters;
  searchInputValue: string;
  indicator: Indicator;
  direction: Direction;
  filter: FilterDefinition;
  compare: FilterCompare;
  value: string;
  setValue: (v: string) => void;
  setCompare: (v: FilterCompare) => void;
  setFilter: (v: FilterDefinition) => void;
  setDirection: (v: Direction) => void;
  setIndicator: (v: Indicator) => void;
  setSearchInputValue: (v: string) => void;
  setFilters: (v: Filters) => void;
  setMessage: (m: string | undefined) => void;
}

export const FilterSearchInput: React.FC<FilterSearchInputProps> = ({
  filterDefinitions,
  filters,
  searchInputValue,
  indicator,
  direction,
  filter,
  compare,
  value,
  setValue,
  setCompare,
  setFilter,
  setDirection,
  setIndicator,
  setSearchInputValue,
  setFilters,
  setMessage
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const searchInputRef = React.useRef(null);
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
  }, [setCompare, setSearchInputValue, setValue]);

  const addFilter = React.useCallback(
    (filterValue: FilterValue) => {
      if (filter === null) {
        console.error('addFilter called with', filter);
        return false;
      }
      let newFilters = _.cloneDeep(filters?.list) || [];
      const def = filter;
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

      // force peers mode to have directions set
      if (filters?.match === 'peers') {
        newFilters = setTargeteableFilters(filterDefinitions, newFilters, direction === 'destination' ? 'dst' : 'src');
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
      const fieldValue = searchInputValue.replaceAll('!=', '|').replaceAll('>=', '|').replaceAll('=', '|').split('|');

      // if field + value are valid, we should end with 2 items only
      if (fieldValue.length == 2) {
        const searchValue = fieldValue[0].toLowerCase();
        const def = filterDefinitions.find(def => def.id.toLowerCase() === searchValue);
        if (def) {
          // set compare
          if (searchInputValue.includes('>=')) {
            if (def.component != 'number') {
              setMessage(t('`>=` is not allowed with `{{searchValue}}`. Use `=` or `!=` instead.', { searchValue }));
              setIndicator(ValidatedOptions.error);
              return;
            }
            setCompare(FilterCompare.moreThanOrEqual);
          } else if (searchInputValue.includes('!=')) {
            setCompare(FilterCompare.notEqual);
          } else {
            setCompare(FilterCompare.equal);
          }
          // set direction
          if (searchValue.startsWith('src')) {
            setDirection('source');
          } else if (searchValue.startsWith('dst')) {
            setDirection('destination');
          } else {
            setDirection(undefined);
          }
          //set filter
          setFilter(def);
        } else if (submitOnRefresh) {
          setMessage(t("Can't find filter `{{searchValue}}`", { searchValue }));
          setIndicator(ValidatedOptions.error);
          return;
        }
        setValue(fieldValue[1]);
      } else if (fieldValue.length === 1) {
        // set simple value on current filter if no splitter found
        setValue(searchInputValue);
      } else {
        setMessage(t('Invalid format. The input should be <filter><comparator><value> such as `name=netobserv`.'));
        setIndicator(ValidatedOptions.error);
        return;
      }

      if (submitOnRefresh) {
        setSubmitPending(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compare, filterDefinitions, searchInputValue, setMessage]
  );

  const getEncodedValue = React.useCallback(() => {
    if (filter === null) {
      return '';
    }
    return matcher(filter.id, [value], compare === FilterCompare.notEqual, compare === FilterCompare.moreThanOrEqual);
  }, [compare, filter, value]);

  const onToggle = React.useCallback(() => {
    updateForm();
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
    [
      filter?.hint,
      getEncodedValue,
      isAdvancedSearchOpen,
      onToggle,
      reset,
      searchInputValue,
      setSearchInputValue,
      updateForm
    ]
  );

  const advancedForm = React.useCallback(() => {
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
