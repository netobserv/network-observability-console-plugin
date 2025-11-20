import {
  ActionGroup,
  Button,
  Form,
  FormGroup,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
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
import {
  FilterCompare,
  FilterDefinition,
  FilterOption,
  Filters,
  FilterValue,
  findFromFilters,
  getCompareText
} from '../../../model/filters';
import { getHTTPErrorDetails } from '../../../utils/errors';
import { matcher } from '../../../utils/filter-definitions';
import { Indicator, setTargeteableFilters } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import { usePrevious } from '../../../utils/previous-hook';
import { Direction } from '../filters-toolbar';
import AutocompleteFilter from './autocomplete-filter';
import CompareFilter from './compare-filter';
import { FilterHints } from './filter-hints';
import './filter-search-input.css';
import FiltersDropdown from './filters-dropdown';
import TextFilter from './text-filter';

interface FormUpdateResult {
  def?: FilterDefinition;
  comparator?: FilterCompare;
  value?: string;
  hasError: boolean;
}

interface Suggestion {
  display?: string;
  value: string;
  validate?: boolean;
}

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

  const filterSearchInputContainerRef = React.useRef(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const popperRef = useOutsideClickEvent(() => {
    // delay this to avoid conflict with onToggle event
    // clicking on the arrow will skip the onToggle and trigger this code after the delay
    setTimeout(() => {
      if (suggestions.length) {
        setSuggestions([]);
      } else {
        setPopperOpen(false);
        setSearchInputValue(getEncodedValue());
        // clear search field to show the placeholder back
        if (_.isEmpty(value)) {
          setSearchInputValue('');
        }
      }
    }, 100);
  });
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);
  const prevSuggestions = usePrevious(suggestions);
  const [isPopperOpen, setPopperOpen] = React.useState(false);
  const [submitPending, setSubmitPending] = React.useState(false);

  const reset = React.useCallback(() => {
    setCompare(FilterCompare.equal);
    setValue('');
    setSearchInputValue('');
  }, [setCompare, setSearchInputValue, setValue]);

  const addFilter = React.useCallback(
    (filterValue: FilterValue) => {
      let newFilters = _.cloneDeep(filters?.list) || [];
      const def = filter;
      const found = findFromFilters(newFilters, { def, compare });
      if (found) {
        if (found.values.map(value => value.v).includes(filterValue.v)) {
          setMessage(t('Filter already exists'));
          setIndicator(ValidatedOptions.error);
          return false;
        } else {
          found.values.push(filterValue);
        }
      } else {
        newFilters.push({ def, compare, values: [filterValue] });
      }

      // force bidirectionnal mode to have directions set
      if (filters?.match === 'bidirectionnal') {
        newFilters = setTargeteableFilters(filterDefinitions, newFilters, direction === 'destination' ? 'dst' : 'src');
      }
      setFilters({ ...filters!, list: newFilters });
      setPopperOpen(false);
      setSuggestions([]);
      reset();
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, filters, filterDefinitions, compare, setFilters, setMessage]
  );

  const addFilterFromSuggestions = React.useCallback(
    (sug: Suggestion[] | undefined = prevSuggestions) => {
      if (!value.length) {
        addFilter({ display: t('n/a'), v: `""` });
      }
      // check if a previous suggestion match value, else just add it as filter
      const found = filter.component === 'autocomplete' && sug?.find(s => s.value === value || s.display === value);
      if (found) {
        addFilter({ display: found.display, v: found.value });
      } else {
        addFilter({ v: value });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addFilter, filter.component, prevSuggestions, value]
  );

  const updateForm = React.useCallback(
    (v: string = searchInputValue, submitOnRefresh?: boolean) => {
      // parse search input value to form content
      const fieldValue = v.split(/>=|!=|!~|=|~/);
      const result: FormUpdateResult = { hasError: false };

      // if field + value are valid, we should end with 2 items only
      if (fieldValue.length == 2) {
        const searchValue = fieldValue[0].toLowerCase();
        const def = filterDefinitions.find(def => def.id.toLowerCase() === searchValue);
        if (def) {
          // set compare
          if (v.includes(FilterCompare.moreThanOrEqual)) {
            if (def.component != 'number') {
              setMessage(
                t(
                  'More than operator is not allowed with `{{searchValue}}`. Use equals or contains operators instead.',
                  { searchValue }
                )
              );
              setIndicator(ValidatedOptions.error);
              return { ...result, hasError: true };
            }
            setCompare(FilterCompare.moreThanOrEqual);
            result.comparator = FilterCompare.moreThanOrEqual;
          } else if (v.includes(FilterCompare.notEqual)) {
            setCompare(FilterCompare.notEqual);
            result.comparator = FilterCompare.notEqual;
          } else if (v.includes(FilterCompare.equal)) {
            setCompare(FilterCompare.equal);
            result.comparator = FilterCompare.equal;
          } else {
            if (def.component === 'number') {
              setMessage(
                t(
                  'Contains operator is not allowed with `{{searchValue}}`. Use equals or more than operators instead.',
                  { searchValue }
                )
              );
              setIndicator(ValidatedOptions.error);
              return { ...result, hasError: true };
            } else if (v.includes(FilterCompare.notMatch)) {
              setCompare(FilterCompare.notMatch);
              result.comparator = FilterCompare.notMatch;
            } else {
              setCompare(FilterCompare.match);
              result.comparator = FilterCompare.match;
            }
          }
          // set direction
          if (def.category === 'source') {
            setDirection('source');
          } else if (def.category === 'destination') {
            setDirection('destination');
          } else {
            setDirection(undefined);
          }
          //set filter
          setFilter(def);
          result.def = def;
        } else if (submitOnRefresh) {
          setMessage(t("Can't find filter `{{searchValue}}`", { searchValue }));
          setIndicator(ValidatedOptions.error);
          return { ...result, hasError: true };
        }
        setValue(fieldValue[1]);
        result.value = fieldValue[1];
      } else if (fieldValue.length === 1) {
        // check if the value match a field
        const searchValue = v.toLowerCase();
        const def = filterDefinitions.find(def => def.id.toLowerCase() === searchValue);
        if (def) {
          // set direction
          if (def.category === 'source') {
            setDirection('source');
          } else if (def.category === 'destination') {
            setDirection('destination');
          } else {
            setDirection(undefined);
          }
          // set filter and reset the rest
          setFilter(def);
          setCompare(FilterCompare.match);
          setValue('');
          result.def = def;
        } else {
          // set simple value on current filter
          setValue(v);
          result.value = v;
        }
      } else {
        setMessage(t('Invalid format. The input should be <filter><comparator><value> such as `name=netobserv`.'));
        setIndicator(ValidatedOptions.error);
        return { ...result, hasError: true };
      }

      if (submitOnRefresh) {
        setSubmitPending(true);
      }

      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [compare, filterDefinitions, searchInputValue, setMessage]
  );

  const getEncodedValue = React.useCallback(
    (v: string = value) => {
      return matcher(filter.id, [v], compare);
    },
    [compare, filter, value]
  );

  const onToggle = React.useCallback(() => {
    setSuggestions([]);
    if (!isPopperOpen) {
      updateForm();
      setPopperOpen(true);
    }
  }, [isPopperOpen, updateForm]);

  const onSearchChange = React.useCallback(
    (v: string) => {
      const defToSuggestion = (fd: FilterDefinition) => {
        return {
          display:
            fd.category === 'source'
              ? `${t('Source')} ${fd.name}`
              : fd.category === 'destination'
              ? `${t('Destination')} ${fd.name}`
              : fd.name,
          value: fd.id,
          validate: false
        };
      };

      const optionToSuggestion = (o: FilterOption) => {
        return { display: o.name !== o.value ? o.name : undefined, value: o.value, validate: true };
      };

      setSearchInputValue(v);
      const updated = updateForm(v);
      if (!v.length || updated.hasError) {
        setSuggestions([]);
        return;
      } else if (updated.def) {
        if (updated.comparator) {
          // suggest values if autocomplete and field set
          if (filter.component === 'autocomplete') {
            filter
              .autocomplete(updated.value || '')
              .then(v => {
                setSuggestions(v.map(optionToSuggestion));
              })
              .catch(err => {
                const errorMessage = getHTTPErrorDetails(err);
                setMessage(errorMessage);
                setSuggestions([]);
              });
          } else {
            // cleanup suggestions if values can't be guessed
            setSuggestions([]);
          }
        } else {
          // suggest comparators if field set but not value
          let suggestions = Object.values(FilterCompare).map(fc => {
            return { display: getCompareText(fc, t), value: fc, validate: false };
          }) as Suggestion[];
          if (filter.component === 'number') {
            suggestions = suggestions.filter(
              s => s.value !== FilterCompare.match && s.value !== FilterCompare.notMatch
            );
          } else {
            suggestions = suggestions.filter(s => s.value != FilterCompare.moreThanOrEqual);
          }
          // also suggest other definitions containing the id
          setSuggestions(
            suggestions.concat(
              filterDefinitions
                .filter(fd => fd.id !== updated.def!.id && fd.id.includes(updated.def!.id))
                .map(defToSuggestion)
            )
          );
        }
      } else if (updated.value?.length) {
        // suggest fields if def is not matched yet
        const suggestions = filterDefinitions
          .filter(fd => fd.id.includes(updated.value!))
          .map(defToSuggestion) as Suggestion[];
        if (filter.component === 'autocomplete') {
          filter
            .autocomplete(updated.value)
            .then(v => {
              setSuggestions(suggestions.concat(v.map(optionToSuggestion)));
            })
            .catch(err => {
              const errorMessage = getHTTPErrorDetails(err);
              setMessage(errorMessage);
              setSuggestions(suggestions);
            });
        } else {
          setSuggestions(suggestions);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filter, filterDefinitions, setMessage, setSearchInputValue, updateForm]
  );

  const searchInput = React.useCallback(
    () => (
      <SearchInput
        onClear={reset}
        onKeyDown={e => {
          if (suggestions.length) {
            // focus on suggestions on tab / arrow down keys
            if (e.key === 'Tab' || e.key === 'ArrowDown') {
              e.preventDefault();
              document.getElementById('suggestion-0')?.focus();
            } else if (e.key === 'Escape') {
              // clear suggestions on esc key
              setSuggestions([]);
            }
          } else if (e.key === 'ArrowDown') {
            // get suggestions back
            onSearchChange(searchInputValue);
          }
        }}
        onChange={(e, v) => onSearchChange(v)}
        onSearch={(e, v) => {
          setSuggestions([]);
          if (_.isEmpty(v)) {
            setPopperOpen(true);
          } else {
            setSearchInputValue(v);
            updateForm(v, true);
          }
        }}
        onToggleAdvancedSearch={onToggle}
        value={isPopperOpen ? getEncodedValue() : searchInputValue}
        isAdvancedSearchOpen={isPopperOpen}
        placeholder={filter?.hint}
        ref={searchInputRef}
        id="filter-search-input"
      />
    ),
    [
      filter?.hint,
      getEncodedValue,
      isPopperOpen,
      onSearchChange,
      onToggle,
      reset,
      searchInputValue,
      setSearchInputValue,
      suggestions.length,
      updateForm
    ]
  );

  const popper = React.useCallback(() => {
    return (
      <div id="filter-popper" ref={popperRef} role="dialog">
        {suggestions.length ? (
          <Menu
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.preventDefault();
                // clear suggestions on esc key
                setSuggestions([]);
                searchInputRef.current?.focus();
              }
            }}
          >
            <MenuContent>
              <MenuList>
                {suggestions.map((suggestion, index) => (
                  <MenuItem
                    id={`suggestion-${index}`}
                    itemId={suggestion}
                    key={`suggestion-${index}`}
                    description={suggestion.display}
                    onKeyDown={e => {
                      if (index === 0 && e.key === 'ArrowUp') {
                        e.preventDefault();
                        searchInputRef.current?.focus();
                      }
                    }}
                    onClick={() => {
                      const updated = updateForm(searchInputValue);
                      if (!updated.def) {
                        if (!suggestion.validate) {
                          onSearchChange(suggestion.value);
                        } else {
                          updateForm(suggestion.value, true);
                        }
                      } else if (!updated.comparator) {
                        // check if it's a valid comparator
                        if ((Object.values(FilterCompare) as string[]).includes(suggestion.value)) {
                          onSearchChange(`${updated.def.id}${suggestion.value}`);
                        } else {
                          // else consider this as a field since ids can overlap (name / namespace)
                          onSearchChange(suggestion.value);
                        }
                      } else {
                        updateForm(`${updated.def.id}${updated.comparator}${suggestion.value}`, true);
                      }
                    }}
                  >
                    {suggestion.value}
                  </MenuItem>
                ))}
              </MenuList>
            </MenuContent>
          </Menu>
        ) : (
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
                      match={filters?.match}
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
                    <Button id="reset-form-filter" variant="link" type="reset" onClick={reset}>
                      {t('Reset')}
                    </Button>
                    <Button
                      id="add-form-filter"
                      variant="primary"
                      type="submit"
                      onClick={e => {
                        e.preventDefault();
                        if (filter.component === 'autocomplete' && _.isEmpty(prevSuggestions)) {
                          filter
                            .autocomplete(value)
                            .then(opts => {
                              addFilterFromSuggestions(opts.map(opts => ({ display: opts.name, value: opts.value })));
                            })
                            .catch(err => {
                              const errorMessage = getHTTPErrorDetails(err);
                              setMessage(errorMessage);
                            });
                        } else {
                          addFilterFromSuggestions();
                        }
                      }}
                    >
                      {t('Add filter')}
                    </Button>
                  </ActionGroup>
                </Form>
              </PanelMainBody>
            </PanelMain>
          </Panel>
        )}
      </div>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    popperRef,
    suggestions,
    filterDefinitions,
    direction,
    setDirection,
    filter,
    setFilter,
    compare,
    setCompare,
    addFilter,
    setMessage,
    indicator,
    setIndicator,
    value,
    setValue,
    reset,
    updateForm,
    searchInputValue,
    onSearchChange
  ]);

  React.useEffect(() => {
    if (submitPending) {
      setSubmitPending(false);
      addFilterFromSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitPending, setSubmitPending, addFilter, value]);

  return (
    <div id="filter-search-input-container" ref={filterSearchInputContainerRef}>
      <Popper
        trigger={searchInput()}
        triggerRef={searchInputRef}
        popper={popper()}
        popperRef={popperRef}
        isVisible={isPopperOpen || suggestions.length > 0}
        enableFlip={false}
        appendTo={filterSearchInputContainerRef.current || undefined}
      />
    </div>
  );
};

export default FilterSearchInput;
