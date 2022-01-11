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
  SearchInput,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
  Tooltip
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { getPort, getService } from 'port-numbers';
import protocols from 'protocol-numbers';
import * as React from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Column, ColumnsId, Filter, FilterType, FilterValue } from '../utils/columns';
import { getQueryArgument, removeQueryArguments, setQueryArguments } from '../utils/router';
import './filters-toolbar.css';
import { validateIPFilter } from '../utils/ip';

interface Option {
  name: string;
  value: string;
}

export const SPLIT_FILTER_CHAR = ',';

export const FiltersToolbar: React.FC<{
  columns: Column[];
  filters: Filter[];
  setFilters: (v: Filter[]) => void;
  clearFilters: () => void;
  id?: string;
}> = ({ id, children, columns, filters, setFilters, clearFilters }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const searchInputRef = React.useRef(null);
  const autocompleteRef = React.useRef(null);
  const [protocolOptions, setProtocolOptions] = React.useState<Option[]>([]);
  const [invalidMessage, setInvalidMessage] = React.useState<string | undefined>(undefined);
  const [hint, setHint] = React.useState('');
  const [autocompleteOptions, setAutocompleteOptions] = React.useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const [isFiltersOpen, setIsOpen] = React.useState<boolean>(false);

  const availableFilters = columns.filter(c => c.filterType !== FilterType.NONE);
  const [selectedFilterColumn, setSelectedFilterColumn] = React.useState<Column>(availableFilters[0]);
  const [selectedFilterValue, setSelectedFilterValue] = React.useState<string>('');

  const onAutoCompleteChange = (newValue: string) => {
    if (
      newValue !== '' &&
      searchInputRef &&
      searchInputRef.current &&
      searchInputRef.current.contains(document.activeElement)
    ) {
      setIsAutocompleteOpen(true);

      let options: Option[];
      switch (selectedFilterColumn.filterType) {
        case FilterType.PORT:
          const isNumber = !isNaN(Number(newValue));
          const foundService = isNumber ? getService(Number(newValue)) : null;
          const foundPort = !isNumber ? getPort(newValue) : null;
          if (foundService) {
            options = [{ name: foundService.name, value: newValue }];
          } else if (foundPort) {
            options = [{ name: newValue, value: foundPort.port.toString() }];
          } else {
            options = [];
          }
          break;
        case FilterType.PROTOCOL:
          options = protocolOptions;
          break;
        default:
          options = [];
          break;
      }
      if (options.length > 10) {
        //check if name or value starts with input
        options = options.filter(
          option => option.name.toLowerCase().startsWith(newValue.toLowerCase()) || option.value.startsWith(newValue)
        );
        if (options.length > 10) {
          options = options.slice(0, 10);
        } else {
          //add name or value includes if not enough results
          options = [
            ...options,
            ...options.filter(option => option.name.toLowerCase().includes(newValue.toLowerCase()))
          ].slice(0, 10);
        }
      }

      const menuItems = options.map(option => (
        <MenuItem itemId={option.value} key={option.name}>
          {option.name}
        </MenuItem>
      ));

      // The hint is set whenever there is only one autocomplete option left.
      setHint(menuItems.length === 1 ? menuItems[0].props.itemId : '');
      // The menu is hidden if there are no options
      setIsAutocompleteOpen(menuItems.length > 0);
      setAutocompleteOptions(menuItems);
    } else {
      setIsAutocompleteOpen(false);
    }
    setSelectedFilterValue(newValue);
  };

  const onAutoCompleteSelect = (e: React.MouseEvent<Element, MouseEvent>, itemId: string) => {
    e.stopPropagation();
    setSelectedFilterValue(itemId);
    setIsAutocompleteOpen(false);
    searchInputRef.current.focus();
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
  }, [selectedFilterColumn?.filterType]);

  const validateFilterValue = React.useCallback(() => {
    if (selectedFilterColumn) {
      switch (selectedFilterColumn?.filterType) {
        case FilterType.PORT:
          //allow any port number or valid name / value
          if (!isNaN(Number(selectedFilterValue)) || getPort(selectedFilterValue)) {
            return '';
          } else {
            return t('Unknown port');
          }
        case FilterType.ADDRESS:
          return validateIPFilter(selectedFilterValue)
            ? ''
            : t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen');
        case FilterType.PROTOCOL:
          //allow any protocol number or valid name / value
          if (
            !isNaN(Number(selectedFilterValue)) ||
            protocolOptions.find(p => p.name === selectedFilterValue || p.value === selectedFilterValue)
          ) {
            return '';
          } else {
            return t('Unknown protocol');
          }
        default:
          return _.isEmpty(selectedFilterValue) ? t('Value is empty') : '';
      }
    } else {
      return t('Column must be selected');
    }
  }, [protocolOptions, selectedFilterColumn, selectedFilterValue, t]);

  const getSelectedValueAndDisplay = React.useCallback(
    (colId?: string, value?: string): FilterValue | null => {
      let column = undefined;
      if (colId) {
        column = columns.find(c => c.id === colId);
      } else {
        column = selectedFilterColumn;
      }
      if (!value) {
        value = selectedFilterValue;
      }
      switch (column?.filterType) {
        case FilterType.PORT:
          const isNumber = !isNaN(Number(value));
          const foundService = isNumber ? getService(Number(value)) : null;
          const foundPort = !isNumber ? getPort(value) : null;
          if (foundService) {
            return {
              v: value,
              display: foundService.name
            };
          } else if (foundPort) {
            return {
              v: foundPort.port.toString(),
              display: value
            };
          } else {
            console.error('port ' + value + ' not found');
          }
        case FilterType.PROTOCOL:
          const found = protocolOptions.find(p => p.name === value || p.value === value);
          if (found) {
            return {
              v: found.value,
              display: found.name
            };
          } else {
            console.error('protocolOptions' + value + ' not found');
            return null;
          }
        default:
          return { v: value };
      }
    },
    [columns, protocolOptions, selectedFilterColumn, selectedFilterValue]
  );

  const setFiltersAndArgs = React.useCallback(
    (filters: Filter[]) => {
      setFilters(filters);

      const queryArguments = {};
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

  const manageFilters = React.useCallback(() => {
    const error = validateFilterValue();
    if (!_.isEmpty(error)) {
      setInvalidMessage(error);
      return;
    }

    const result: Filter[] = _.cloneDeep(filters);
    const found = result.find(f => f.colId === selectedFilterColumn.id);
    const newValue: FilterValue = getSelectedValueAndDisplay();
    if (newValue) {
      if (found) {
        //only one filter can be set on timestamp to use loki start & end query params
        if (selectedFilterColumn.id === ColumnsId.timestamp) {
          found.values = [newValue];
        } else if (found.values.map(value => value.v).includes(newValue.v)) {
          setInvalidMessage(t('Filter already exists'));
          return;
        } else {
          found.values.push(newValue);
        }
      } else {
        result.push({ colId: selectedFilterColumn.id, values: [newValue] });
      }
      setFiltersAndArgs(result);
      resetFilterValue();
    } else {
      console.error('manageFilters invalid newValue');
    }
  }, [
    validateFilterValue,
    filters,
    getSelectedValueAndDisplay,
    setFiltersAndArgs,
    resetFilterValue,
    selectedFilterColumn.id,
    t
  ]);

  /*TODO: check if we can do autocomplete for pod / namespace fields
   * as implemented for protocols
   */
  const getFilterControl = (col: Column) => {
    switch (col.filterType) {
      case FilterType.PORT:
      case FilterType.PROTOCOL:
        return (
          <Popper
            trigger={
              <SearchInput
                value={selectedFilterValue}
                onChange={onAutoCompleteChange}
                onClear={() => resetFilterValue()}
                ref={searchInputRef}
                hint={hint}
                id="autocomplete-search"
              />
            }
            popper={
              <Menu ref={autocompleteRef} onSelect={onAutoCompleteSelect}>
                <MenuContent>
                  <MenuList>{autocompleteOptions}</MenuList>
                </MenuContent>
              </Menu>
            }
            isVisible={isAutocompleteOpen}
            enableFlip={false}
            appendTo={() => document.querySelector('#autocomplete-search')}
          />
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
          />
        );
    }
  };

  React.useEffect(() => {
    resetFilterValue();
  }, [selectedFilterColumn, resetFilterValue]);

  // Run once on mount to set protocol options
  React.useEffect(() => {
    const pOptions = [];
    _.forOwn(protocols, function (value, key) {
      if (!_.isEmpty(protocols[key].name)) {
        pOptions.push(protocols[key]);
      }
    });
    setProtocolOptions(_.orderBy(pOptions, 'name'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //apply filters from query params after protocolOptions set
  React.useEffect(() => {
    if (_.isEmpty(protocolOptions)) {
      return;
    }

    const queryParamFilters: Filter[] = [];
    columns.forEach(col => {
      const colFilterValues = getQueryArgument(col.id)?.split(SPLIT_FILTER_CHAR) ?? [];
      if (!_.isEmpty(colFilterValues)) {
        const filterValues: FilterValue[] = [];
        colFilterValues.forEach(paramValue => {
          const value = getSelectedValueAndDisplay(col.id, paramValue);
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
  }, [protocolOptions]);

  return (
    <Toolbar id={id} clearAllFilters={() => clearFilters()} clearFiltersButtonText={t('Clear all filters')}>
      <ToolbarContent>
        <Fragment>
          <ToolbarItem className="co-filter-search">
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
                    filter.values = filter.values.filter(val =>
                      val.display ? val.display !== value : val.v !== value
                    );
                    if (_.isEmpty(filter.values)) {
                      removeQueryArguments([filter.colId]);
                      setFilters(filters.filter(f => f.colId !== filter.colId));
                    } else {
                      setFiltersAndArgs(_.cloneDeep(filters));
                    }
                  }}
                  categoryName={columns.find(c => c.id === filter.colId)?.name}
                >
                  {
                    // set empty children to have a single filter with multiple categories
                    <div></div>
                  }
                </ToolbarFilter>
              ))}
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
                      onClick={() => {
                        setSelectedFilterColumn(col);
                      }}
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
        </Fragment>
      </ToolbarContent>
    </Toolbar>
  );
};

export default FiltersToolbar;
