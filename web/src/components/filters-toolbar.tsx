import {
  Button,
  DatePicker,
  Dropdown,
  DropdownItem,
  DropdownToggle,
  Flex,
  FlexItem,
  InputGroup,
  NumberInput,
  OverflowMenu,
  OverflowMenuGroup,
  OverflowMenuItem,
  TextInput,
  TimePicker,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
  Tooltip,
  isValidDate,
  yyyyMMddFormat,
  Popper,
  SearchInput,
  Menu,
  MenuContent,
  MenuList,
  MenuItem
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Column, ColumnsId, Filter, FilterType, FilterValue } from '../utils/columns';
import { getQueryArgument, removeQueryArguments, setQueryArguments } from '../utils/router';
import protocols from 'protocol-numbers';
import { getDateFromSecondsString, getDateStringInSeconds } from '../utils/duration';
import './filters-toolbar.css';
import { getPort, getService } from 'port-numbers';

export const SPLIT_FILTER_CHAR = ',';
export const RANGE_SPLIT_CHAR = '<';

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
  const [protocolOptions, setProtocolOptions] = React.useState<any[]>([]);
  const [invalidMessage, setInvalidMessage] = React.useState<string | undefined>(undefined);
  const [hint, setHint] = React.useState('');
  const [autocompleteOptions, setAutocompleteOptions] = React.useState([]);
  const [isAutocompleteOpen, setIsAutocompleteOpen] = React.useState(false);
  const [isFiltersOpen, setIsOpen] = React.useState<boolean>(false);
  const [selectedFilterColumn, setSelectedFilterColumn] = React.useState<Column>(columns[0]);
  const [selectedFilterValue, setSelectedFilterValue] = React.useState<string>('');

  const getFilterValueDate = React.useCallback(
    (isFrom: boolean) => {
      const filterValueSplit = selectedFilterValue.includes(RANGE_SPLIT_CHAR)
        ? selectedFilterValue.split(RANGE_SPLIT_CHAR)
        : ['', ''];
      return new Date(filterValueSplit[isFrom ? 0 : 1]);
    },
    [selectedFilterValue]
  );

  const getDisplayFilterValueDate = React.useCallback(
    (isFrom: boolean) => {
      const date = getFilterValueDate(isFrom);
      return isValidDate(date) ? yyyyMMddFormat(date) : '';
    },
    [getFilterValueDate]
  );

  const setFilterValueDate = React.useCallback(
    (date: Date, isFrom: boolean) => {
      const filterValueSplit = selectedFilterValue.includes(RANGE_SPLIT_CHAR)
        ? selectedFilterValue.split(RANGE_SPLIT_CHAR)
        : ['', ''];
      filterValueSplit[isFrom ? 0 : 1] = date.toISOString();
      setSelectedFilterValue(filterValueSplit.join(RANGE_SPLIT_CHAR));
    },
    [selectedFilterValue]
  );

  const onAutoCompleteChange = (newValue: string) => {
    if (
      newValue !== '' &&
      searchInputRef &&
      searchInputRef.current &&
      searchInputRef.current.contains(document.activeElement)
    ) {
      setIsAutocompleteOpen(true);

      let options;
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
        options = options.filter(option =>
          option.name.toLowerCase().startsWith(newValue.toLowerCase() || option.value.startsWith(newValue))
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
      options = options.map(option => (
        <MenuItem itemId={option.value} key={option.name}>
          {option.name}
        </MenuItem>
      ));

      // The hint is set whenever there is only one autocomplete option left.
      setHint(options.length === 1 ? options[0].props.itemId : '');
      // The menu is hidden if there are no options
      setIsAutocompleteOpen(options.length > 0);
      setAutocompleteOptions(options);
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

  const onDateChange = React.useCallback(
    (inputDate: string, newDate: Date, isFrom: boolean) => {
      const date = getFilterValueDate(isFrom);
      if (isValidDate(date) && isValidDate(newDate) && inputDate === yyyyMMddFormat(newDate)) {
        newDate.setHours(date.getHours());
        newDate.setMinutes(date.getMinutes());
      }
      if (isValidDate(newDate) && inputDate === yyyyMMddFormat(newDate)) {
        setFilterValueDate(new Date(newDate), isFrom);
      }
    },
    [getFilterValueDate, setFilterValueDate]
  );

  const onTimeChange = React.useCallback(
    (hour: number, minute: number, isFrom: boolean) => {
      const date = getFilterValueDate(isFrom);
      if (isValidDate(date)) {
        const updatedDate = new Date(date);
        updatedDate.setHours(hour);
        updatedDate.setMinutes(minute);
        setFilterValueDate(updatedDate, isFrom);
      }
    },
    [getFilterValueDate, setFilterValueDate]
  );

  const getRangeStart = React.useCallback(
    (isFrom: boolean) => {
      const start = getFilterValueDate(true);
      if (!isFrom && isValidDate(start)) {
        return start;
      } else {
        return null;
      }
    },
    [getFilterValueDate]
  );

  const dateValidator = React.useCallback(
    (isFrom: boolean, date: Date): string => {
      const d = getFilterValueDate(!isFrom);
      if (isFrom && date > new Date()) {
        return t('From date cannot be in the future');
      }
      return !isValidDate(d) || (!isFrom && date >= d) || (isFrom && date <= d)
        ? ''
        : t('To date must be after From date');
    },
    [getFilterValueDate, t]
  );

  const resetFilterValue = React.useCallback(() => {
    switch (selectedFilterColumn?.filterType) {
      case FilterType.DATETIME:
        //keep selection since only one filter allowed for date time
        return;
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
        case FilterType.DATETIME:
          //allow start and / or end date with start before end if both specified
          const start = getFilterValueDate(true);
          const end = getFilterValueDate(false);
          if (start > new Date()) {
            return t('From date cannot be in the future');
          } else if (isValidDate(start) && isValidDate(end) && yyyyMMddFormat(end) < yyyyMMddFormat(start)) {
            return t('To date must be after From date');
          } else {
            return '';
          }
        case FilterType.PORT:
          //allow any port number or valid name / value
          if (!isNaN(Number(selectedFilterValue)) || getPort(selectedFilterValue)) {
            return '';
          } else {
            return t('Unknown port');
          }
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
  }, [getFilterValueDate, protocolOptions, selectedFilterColumn, selectedFilterValue, t]);

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
        case FilterType.DATETIME:
          if (value.includes(RANGE_SPLIT_CHAR)) {
            const colFilterValues = value.split(RANGE_SPLIT_CHAR);
            const start = isNaN(Number(colFilterValues[0]))
              ? new Date(colFilterValues[0])
              : getDateFromSecondsString(colFilterValues[0]);
            const end = isNaN(Number(colFilterValues[1]))
              ? new Date(colFilterValues[1])
              : getDateFromSecondsString(colFilterValues[1]);
            return {
              v: [
                isValidDate(start) ? getDateStringInSeconds(start) : '',
                isValidDate(end) ? getDateStringInSeconds(end) : ''
              ].join(RANGE_SPLIT_CHAR),
              display: [isValidDate(start) ? start.toUTCString() : '', isValidDate(end) ? end.toUTCString() : ''].join(
                RANGE_SPLIT_CHAR
              )
            };
          } else {
            console.error('datetime' + value + ' is invalid');
            return null;
          }
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

  const getDatePicker = React.useCallback(
    (isFrom: boolean) => {
      return (
        <InputGroup>
          <DatePicker
            validators={[date => dateValidator(isFrom, date)]}
            rangeStart={getRangeStart(isFrom)}
            value={getDisplayFilterValueDate(isFrom)}
            onChange={(value, date) => onDateChange(value, date, isFrom)}
          />
          <TimePicker
            style={{ width: '150px' }}
            onChange={(time, hour, minute) => onTimeChange(hour, minute, isFrom)}
            isDisabled={!isValidDate(getFilterValueDate(isFrom))}
          />
        </InputGroup>
      );
    },
    [dateValidator, getDisplayFilterValueDate, getFilterValueDate, getRangeStart, onDateChange, onTimeChange]
  );

  /*TODO: check if we can do autocomplete for pod / namespace fields
   * as implemented for protocols
   */
  const getFilterControl = (col: Column) => {
    switch (col.filterType) {
      case FilterType.DATETIME:
        return (
          <Flex direction={{ default: 'column', lg: 'row' }}>
            <FlexItem>{t('From')}</FlexItem>
            <FlexItem>{getDatePicker(true)}</FlexItem>
            <FlexItem>{t('To')}</FlexItem>
            <FlexItem>{getDatePicker(false)}</FlexItem>
          </Flex>
        );
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
            onChange={(event: any) => setFilterValue(event.target.value)}
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
                  dropdownItems={columns
                    .filter(c => c.filterType !== FilterType.NONE)
                    .map((col, index) => (
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
