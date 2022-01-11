import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  InputGroup,
  Menu,
  MenuContent,
  MenuItem,
  MenuList,
  NumberInput,
  OverflowMenu,
  OverflowMenuGroup,
  OverflowMenuItem,
  Popper,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
  Tooltip
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { getPort } from 'port-numbers';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Column, ColumnsId } from '../utils/columns';
import {
  createFilterValue,
  Filter,
  FilterOption,
  FilterType,
  FilterValue,
  findDirectionOption,
  findProtocolOption,
  getFilterOptions
} from '../utils/filters';
import { getQueryArgument, QueryParams, removeQueryArguments, setQueryArguments } from '../utils/router';
import './filters-toolbar.css';
import { validateIPFilter } from '../utils/ip';

export const SPLIT_FILTER_CHAR = ',';

export interface FiltersToolbarProps {
  id: string;
  columns: Column[];
  filters?: Filter[];
  setFilters: (v: Filter[]) => void;
  clearFilters: () => void;
}

export const FiltersToolbar: React.FC<FiltersToolbarProps> = ({
  id,
  children,
  columns,
  filters,
  setFilters,
  clearFilters
}) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const autocompleteContainerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [invalidMessage, setInvalidMessage] = React.useState<string | undefined>();
  const [autocompleteOptions, setAutocompleteOptions] = React.useState<FilterOption[]>([]);
  const [isPopperVisible, setPopperVisible] = React.useState(false);
  const [isFiltersOpen, setIsOpen] = React.useState<boolean>(false);

  const availableFilters = columns.filter(c => c.filterType !== FilterType.NONE);
  const [selectedFilterColumn, setSelectedFilterColumn] = React.useState<Column>(availableFilters[0]);
  const [selectedFilterValue, setSelectedFilterValue] = React.useState<string>('');

  const onAutoCompleteChange = (newValue: string) => {
    const options = getFilterOptions(selectedFilterColumn.filterType, newValue, 10);
    setAutocompleteOptions(options);
    // The menu is hidden if there are no options
    setPopperVisible(options.length > 0);
    setSelectedFilterValue(newValue);
  };

  const onAutoCompleteSelect = (e: React.MouseEvent<Element, MouseEvent>, itemId: string) => {
    e.stopPropagation();
    const option = autocompleteOptions.find(opt => opt.value === itemId);
    addFilter({ v: itemId, display: option?.name });
    resetAutocompleteOptions();
  };

  const resetFilterValue = React.useCallback(() => {
    switch (selectedFilterColumn?.filterType) {
      case FilterType.NUMBER:
        setFilterValue('0');
        break;
      default:
        setFilterValue('');
        break;
    }
    resetAutocompleteOptions();
  }, [selectedFilterColumn?.filterType]);

  const resetAutocompleteOptions = () => {
    setPopperVisible(false);
    setAutocompleteOptions([]);
  };

  const validateFilterValue = React.useCallback(() => {
    if (!selectedFilterColumn) {
      return { err: t('Column must be selected') };
    } else if (_.isEmpty(selectedFilterValue)) {
      return { err: t('Value is empty') };
    }

    switch (selectedFilterColumn?.filterType) {
      case FilterType.PORT:
        //allow any port number or valid name / value
        if (!isNaN(Number(selectedFilterValue)) || getPort(selectedFilterValue)) {
          return { val: selectedFilterValue };
        } else {
          return { err: t('Unknown port') };
        }
      case FilterType.ADDRESS:
        return validateIPFilter(selectedFilterValue)
          ? { val: selectedFilterValue }
          : { err: t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen') };
      case FilterType.PROTOCOL:
        //allow any protocol number or valid name / value
        if (!isNaN(Number(selectedFilterValue))) {
          return { val: selectedFilterValue };
        } else {
          const proto = findProtocolOption(selectedFilterValue);
          if (proto) {
            return { val: proto.name };
          }
          return { err: t('Unknown protocol') };
        }
      case FilterType.DIRECTION:
        const dir = findDirectionOption(selectedFilterValue);
        if (dir) {
          return { val: dir.name };
        } else {
          return { err: t('Invalid direction') };
        }
      default:
        return { val: selectedFilterValue };
    }
  }, [selectedFilterColumn, selectedFilterValue, t]);

  const setFiltersAndArgs = React.useCallback(
    (filters: Filter[]) => {
      setFilters(filters);

      const queryArguments: QueryParams = {};
      _.each(filters, (f: Filter) => {
        queryArguments[f.colId] = f.values.map(value => value.v);
      });
      setQueryArguments(queryArguments);
    },
    [setFilters]
  );

  const setFilterValue = (v: string) => {
    setInvalidMessage(undefined);
    setSelectedFilterValue(v);
  };

  const addFilter = React.useCallback(
    (filter: FilterValue) => {
      const result = _.cloneDeep(filters) || [];
      const found = result.find(f => f.colId === selectedFilterColumn.id);
      if (found) {
        //only one filter can be set on timestamp to use loki start & end query params
        if (selectedFilterColumn.id === ColumnsId.timestamp) {
          found.values = [filter];
        } else if (found.values.map(value => value.v).includes(filter.v)) {
          setInvalidMessage(t('Filter already exists'));
          return;
        } else {
          found.values.push(filter);
        }
      } else {
        result.push({ colId: selectedFilterColumn.id, values: [filter] });
      }
      setFiltersAndArgs(result);
      resetFilterValue();
    },
    [t, filters, selectedFilterColumn.id, setFiltersAndArgs, resetFilterValue]
  );

  const manageFilters = React.useCallback(() => {
    // Only one choice is present, consider this is what is desired
    if (autocompleteOptions.length === 1) {
      addFilter({ v: autocompleteOptions[0].value, display: autocompleteOptions[0].name });
      return;
    }

    const validation = validateFilterValue();
    if (!_.isEmpty(validation.err)) {
      setInvalidMessage(validation.err);
      return;
    }

    const newValue = createFilterValue(selectedFilterColumn.filterType, validation.val!);
    if (newValue) {
      addFilter(newValue);
    } else {
      console.error('manageFilters invalid newValue');
    }
  }, [autocompleteOptions, validateFilterValue, selectedFilterColumn, addFilter]);

  /*TODO: check if we can do autocomplete for pod / namespace fields
   * as implemented for protocols
   */
  const getFilterControl = (col: Column) => {
    switch (col.filterType) {
      case FilterType.PORT:
      case FilterType.PROTOCOL:
      case FilterType.DIRECTION:
        return (
          <div ref={autocompleteContainerRef}>
            <Popper
              trigger={
                <TextInput
                  type="search"
                  aria-label="search"
                  value={selectedFilterValue}
                  onKeyPress={e => e.key === 'Enter' && manageFilters()}
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
        );
      case FilterType.NUMBER:
        return (
          <NumberInput
            value={isNaN(Number(selectedFilterValue)) ? 0 : Number(selectedFilterValue)}
            min={0}
            max={Number.MAX_SAFE_INTEGER}
            onMinus={() => setFilterValue((Number(selectedFilterValue) - 1).toString())}
            onChange={event => setFilterValue((event.target as HTMLTextAreaElement).value)}
            onPlus={() => setFilterValue((Number(selectedFilterValue) + 1).toString())}
            onKeyPress={e => e.key === 'Enter' && manageFilters()}
            inputName="input"
            inputAriaLabel="number input"
            minusBtnAriaLabel="minus"
            plusBtnAriaLabel="plus"
            widthChars={10}
          />
        );
      default:
        return (
          <TextInput
            type="search"
            aria-label="search"
            onChange={setFilterValue}
            onKeyPress={e => e.key === 'Enter' && manageFilters()}
            value={selectedFilterValue}
            ref={searchInputRef}
            id="search"
          />
        );
    }
  };

  const hasFilterValue = React.useCallback(() => {
    return filters?.some(f => f?.values?.length);
  }, [filters]);

  React.useEffect(() => {
    resetFilterValue();
    searchInputRef?.current?.focus();
  }, [selectedFilterColumn, resetFilterValue]);

  //apply filters from query params
  React.useEffect(() => {
    const queryParamFilters: Filter[] = [];
    columns.forEach(col => {
      const colFilterValues = getQueryArgument(col.id)?.split(SPLIT_FILTER_CHAR) ?? [];
      if (!_.isEmpty(colFilterValues)) {
        const filterValues: FilterValue[] = [];
        colFilterValues.forEach(paramValue => {
          const value = createFilterValue(col.filterType, paramValue);
          if (value) {
            filterValues.push(value);
          }
        });
        if (!_.isEmpty(filterValues)) {
          queryParamFilters.push({
            colId: col.id,
            values: filterValues
          });
        } else {
          removeQueryArguments([col.id]);
        }
      }
    });
    //reset url args here to clean invalid values
    setFiltersAndArgs(queryParamFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Toolbar
      id={id}
      clearAllFilters={clearFilters}
      clearFiltersButtonText={hasFilterValue() ? t('Clear all filters') : ''}
    >
      <ToolbarContent id={`${id}-content`} toolbarId={id}>
        {filters &&
          filters.map((filter, index) => (
            <ToolbarFilter
              key={index}
              deleteChipGroup={() => {
                removeQueryArguments([filter.colId]);
                setFilters(filters.filter(f => f.colId !== filter.colId));
              }}
              chips={filter.values.map(value => (value.display ? value.display : value.v))}
              deleteChip={(f, value: string) => {
                filter.values = filter.values.filter(val => (val.display ? val.display !== value : val.v !== value));
                if (_.isEmpty(filter.values)) {
                  removeQueryArguments([filter.colId]);
                  setFilters(filters.filter(f => f.colId !== filter.colId));
                } else {
                  setFiltersAndArgs(_.cloneDeep(filters));
                }
              }}
              categoryName={columns.find(c => c.id === filter.colId)?.name || ''}
            >
              {
                // set empty children to have a single filter with multiple categories
                <div></div>
              }
            </ToolbarFilter>
          ))}
        <ToolbarItem>
          <Tooltip
            //css hide tooltip here to avoid render issue
            className={'filters-tooltip' + (_.isEmpty(invalidMessage) ? '-empty' : '')}
            isVisible={true}
            content={invalidMessage}
            trigger={''}
            enableFlip={false}
          >
            <InputGroup>
              <Dropdown
                id="column-filter-dropdown"
                dropdownItems={availableFilters.map((col, index) => (
                  <DropdownItem
                    id={col.name}
                    className="column-filter-item"
                    component="button"
                    onClick={() => setSelectedFilterColumn(col)}
                    key={index}
                  >
                    {col.name}
                  </DropdownItem>
                ))}
                isOpen={isFiltersOpen}
                onSelect={() => setIsOpen(false)}
                toggle={
                  <DropdownToggle id="column-filter-toggle" onToggle={() => setIsOpen(!isFiltersOpen)}>
                    {selectedFilterColumn.name}
                  </DropdownToggle>
                }
              />
              {getFilterControl(selectedFilterColumn)}
              <Button
                id="search-button"
                variant="control"
                aria-label="search button for filter"
                onClick={() => manageFilters()}
              >
                <SearchIcon />
              </Button>
            </InputGroup>
          </Tooltip>
        </ToolbarItem>
        <ToolbarItem>
          <OverflowMenu breakpoint="md">
            <OverflowMenuGroup groupType="button" isPersistent>
              <OverflowMenuItem>{children}</OverflowMenuItem>
            </OverflowMenuGroup>
          </OverflowMenu>
        </ToolbarItem>
        {/* TODO : NETOBSERV-104
          <ToolbarItem variant="pagination">
            <Pagination
              itemCount={flows.length}
              widgetId="pagination-options-menu-bottom"
              page={1}
              variant={PaginationVariant.top}
              isCompact
            />
          </ToolbarItem>*/}
      </ToolbarContent>
    </Toolbar>
  );
};

export default FiltersToolbar;
