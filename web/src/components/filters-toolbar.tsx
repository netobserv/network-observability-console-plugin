import {
  Button,
  Chip,
  ChipGroup,
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
  Popover,
  Popper,
  Text,
  TextInput,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarItem,
  Tooltip,
  ValidatedOptions
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { getPort } from 'port-numbers';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Column, ColumnsId, getColumnGroups, getFullColumnName } from '../utils/columns';
import {
  createFilterValue,
  Filter,
  FilterOption,
  FilterType,
  FilterValue,
  findProtocolOption,
  getFilterOptions
} from '../utils/filters';
import './filters-toolbar.css';
import { validateIPFilter } from '../utils/ip';
import { QueryOptions } from '../model/query-options';
import { QueryOptionsDropdown } from './query-options-dropdown';
import { getPathWithParams, NETFLOW_TRAFFIC_PATH } from '../utils/router';
import { useHistory } from 'react-router-dom';
import { validateLabel } from '../utils/label';

export interface FiltersToolbarProps {
  id: string;
  columns: Column[];
  filters?: Filter[];
  forcedFilters?: Filter[];
  actions?: React.ReactNode;
  skipTipsDelay?: boolean;
  setFilters: (v: Filter[]) => void;
  clearFilters: () => void;
  queryOptions: QueryOptions;
  setQueryOptions: (opts: QueryOptions) => void;
}

export type Indicator = 'default' | 'success' | 'warning' | 'error' | undefined;

export const FiltersToolbar: React.FC<FiltersToolbarProps> = ({
  id,
  columns,
  filters,
  forcedFilters,
  actions,
  skipTipsDelay,
  setFilters,
  clearFilters,
  ...props
}) => {
  const { push } = useHistory();
  const { t } = useTranslation('plugin__network-observability-plugin');
  const autocompleteContainerRef = React.useRef<HTMLDivElement | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const [indicator, setIndicator] = React.useState<Indicator>(ValidatedOptions.default);
  const [message, setMessage] = React.useState<string | undefined>();
  const [autocompleteOptions, setAutocompleteOptions] = React.useState<FilterOption[]>([]);
  const [isPopperVisible, setPopperVisible] = React.useState(false);
  const [isSearchFiltersOpen, setSearchFiltersOpen] = React.useState<boolean>(false);

  const availableFilters = columns.filter(c => c.filterType !== FilterType.NONE);
  const filtersGroups = getColumnGroups(availableFilters);
  const [selectedFilterColumn, setSelectedFilterColumn] = React.useState<Column>(availableFilters[0]);
  const [selectedFilterValue, setSelectedFilterValue] = React.useState<string>('');

  // reset and delay message state to trigger tooltip properly
  const setMessageWithDelay = React.useCallback(
    (m: string | undefined) => {
      if (skipTipsDelay) {
        setMessage(m);
      } else {
        setMessage(undefined);
        setTimeout(() => {
          setMessage(m);
        }, 100);
      }
    },
    [skipTipsDelay]
  );

  const onAutoCompleteChange = (newValue: string) => {
    const options = getFilterOptions(selectedFilterColumn.filterType, newValue, 10);
    setAutocompleteOptions(options);
    // The menu is hidden if there are no options
    setPopperVisible(options.length > 0);
    setFilterValue(newValue);
  };

  const onAutoCompleteSelect = (e: React.MouseEvent<Element, MouseEvent>, itemId: string) => {
    e.stopPropagation();
    const option = autocompleteOptions.find(opt => opt.value === itemId);
    addFilter(selectedFilterColumn.id, { v: itemId, display: option?.name });
    resetAutocompleteOptions();
  };

  const resetAutocompleteOptions = () => {
    setPopperVisible(false);
    setAutocompleteOptions([]);
  };

  const validateFilterValue = React.useCallback(
    (value: string) => {
      if (!selectedFilterColumn) {
        return { err: t('Column must be selected') };
      } else if (_.isEmpty(value)) {
        return { err: t('Value is empty') };
      }

      switch (selectedFilterColumn?.filterType) {
        case FilterType.PORT:
          //allow any port number or valid name / value
          if (!isNaN(Number(value)) || getPort(value)) {
            return { val: value };
          } else {
            return { err: t('Unknown port') };
          }
        case FilterType.ADDRESS:
          return validateIPFilter(value)
            ? { val: value }
            : { err: t('Not a valid IPv4 or IPv6, nor a CIDR, nor an IP range separated by hyphen') };
        case FilterType.PROTOCOL:
          //allow any protocol number or valid name / value
          if (!isNaN(Number(value))) {
            return { val: value };
          } else {
            const proto = findProtocolOption(value);
            if (proto) {
              return { val: proto.name };
            }
            return { err: t('Unknown protocol') };
          }
        case FilterType.K8S_NAMES:
          return validateLabel(value) ? { val: value } : { err: t('Not a valid kubernetes label') };
        default:
          return { val: value };
      }
    },
    [selectedFilterColumn, t]
  );

  const setFilterValue = React.useCallback(
    (v: string) => {
      //update validation icon on field on value change
      if (!_.isEmpty(v)) {
        const validation = validateFilterValue(v);
        setIndicator(!_.isEmpty(validation.err) ? ValidatedOptions.warning : ValidatedOptions.success);
      } else {
        setIndicator(ValidatedOptions.default);
      }
      setSelectedFilterValue(v);
    },
    [validateFilterValue]
  );

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
    setMessageWithDelay(undefined);
    setIndicator(ValidatedOptions.default);
  }, [selectedFilterColumn?.filterType, setFilterValue, setMessageWithDelay]);

  const addFilter = React.useCallback(
    (colId: ColumnsId, filter: FilterValue) => {
      const column = columns.find(c => c.id === colId);
      if (column) {
        const result = _.cloneDeep(filters) || [];
        const found = result.find(f => f.colId === colId);
        if (found) {
          //only one filter can be set on timestamp to use loki start & end query params
          if (colId === ColumnsId.timestamp) {
            found.values = [filter];
          } else if (found.values.map(value => value.v).includes(filter.v)) {
            setMessageWithDelay(t('Filter already exists'));
            setIndicator(ValidatedOptions.error);
            return;
          } else {
            found.values.push(filter);
          }
        } else {
          result.push({ colId: colId, values: [filter] });
        }
        setFilters(result);
        resetFilterValue();
      }
    },
    [columns, filters, setFilters, resetFilterValue, setMessageWithDelay, t]
  );

  const manageFilters = React.useCallback(() => {
    // Only one choice is present, consider this is what is desired
    if (autocompleteOptions.length === 1) {
      addFilter(selectedFilterColumn.id, { v: autocompleteOptions[0].value, display: autocompleteOptions[0].name });
      return;
    }

    const validation = validateFilterValue(selectedFilterValue);
    //show tooltip and icon when user try to validate filter
    if (!_.isEmpty(validation.err)) {
      setMessageWithDelay(validation.err);
      setIndicator(ValidatedOptions.error);
      return;
    }

    const newValue = createFilterValue(selectedFilterColumn.filterType, validation.val!);
    if (newValue) {
      addFilter(selectedFilterColumn.id, newValue);
    } else {
      console.error('manageFilters invalid newValue');
    }
  }, [
    autocompleteOptions,
    validateFilterValue,
    selectedFilterValue,
    selectedFilterColumn.filterType,
    selectedFilterColumn.id,
    addFilter,
    setMessageWithDelay
  ]);

  /*TODO: check if we can do autocomplete for pod / namespace fields
   * as implemented for protocols
   */
  const getFilterControl = (col: Column) => {
    switch (col.filterType) {
      case FilterType.PORT:
      case FilterType.PROTOCOL:
        return (
          <div ref={autocompleteContainerRef}>
            <Popper
              trigger={
                <TextInput
                  type="search"
                  aria-label="search"
                  validated={indicator}
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
            validated={indicator}
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

  const getHint = () => {
    let hint = '';
    let examples = '';
    switch (selectedFilterColumn.filterType) {
      case FilterType.PORT:
        hint = t('Specify a single port number or name.');
        examples = `${t('Specify a single port following one of these rules:')}
        - ${t('A port number like 80, 21')}
        - ${t('A IANA name like HTTP, FTP')}`;
        break;
      case FilterType.ADDRESS:
        hint = t('Specify a single address or range.');
        examples = `${t('Specify addresses following one of these rules:')}
        - ${t('A single IPv4 or IPv6 address like 192.0.2.0, ::1')}
        - ${t('A range within the IP address like 192.168.0.1-192.189.10.12, 2001:db8::1-2001:db8::8')}
        - ${t('A CIDR specification like 192.51.100.0/24, 2001:db8::/32')}`;
        break;
      case FilterType.PROTOCOL:
        hint = t('Specify a single protocol number or name.');
        examples = `${t('Specify a single protocol following one of these rules:')}
          - ${t('A protocol number like 6, 17')}
          - ${t('A IANA name like TCP, UDP')}`;
        break;
      case FilterType.K8S_NAMES:
        hint = t('Specify a single kubernetes name.');
        examples = `${t('Specify a single kubernetes name following these rules:')}
        - ${t('Containing any alphanumeric, hyphen, underscrore or dot character')}
        - ${t('Partial text like cluster, cluster-image, image-registry')}
        - ${t('Exact match using quotes like "cluster-image-registry"')}
        - ${t('Starting text like cluster, "cluster-*"')}
        - ${t('Ending text like "*-registry"')}
        - ${t('Pattern like "cluster-*-registry", "c*-*-r*y", -i*e-')}`;
        break;
      default:
        hint = '';
        examples = '';
        break;
    }
    return (
      <div id="tips">
        <Text component={TextVariants.p}>{hint}</Text>
        {!_.isEmpty(examples) ? (
          <Popover
            aria-label="Hint popover"
            headerContent={selectedFilterColumn.name}
            bodyContent={<div className="text-left-pre">{examples}</div>}
            hasAutoWidth={true}
            position={'bottom'}
          >
            <Button id="more" variant="link">
              {t('Learn more')}
            </Button>
          </Popover>
        ) : undefined}
      </div>
    );
  };

  React.useEffect(() => {
    resetFilterValue();
    searchInputRef?.current?.focus();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterColumn]);

  return (
    <Toolbar
      id={id}
      clearAllFilters={clearFilters}
      clearFiltersButtonText={hasFilterValue() ? t('Clear all filters') : ''}
    >
      <ToolbarContent id={`${id}-search-filters`} toolbarId={id}>
        <ToolbarItem className="flex-start">
          <QueryOptionsDropdown options={props.queryOptions} setOptions={props.setQueryOptions} />
        </ToolbarItem>
        <ToolbarItem className="flex-start">
          {_.isEmpty(forcedFilters) ? (
            <Tooltip
              //css hide tooltip here to avoid render issue
              className={`filters-tooltip${_.isEmpty(message) ? '-empty' : ''}`}
              isVisible={!_.isEmpty(message)}
              content={message}
              trigger={_.isEmpty(message) ? 'manual' : 'click'}
              enableFlip={false}
              position={'top'}
            >
              <div>
                <InputGroup>
                  <Dropdown
                    id="column-filter-dropdown"
                    dropdownItems={filtersGroups.map((g, i) => (
                      <div key={`group-${i}`}>
                        {g.title && <h1 className="pf-c-dropdown__group-title">{g.title}</h1>}
                        {g.columns.map((col, index) => (
                          <DropdownItem
                            id={col.id}
                            className={`column-filter-item ${g.title ? 'grouped' : ''}`}
                            component="button"
                            onClick={() => setSelectedFilterColumn(col)}
                            key={index}
                          >
                            {col.name}
                          </DropdownItem>
                        ))}
                      </div>
                    ))}
                    isOpen={isSearchFiltersOpen}
                    onSelect={() => setSearchFiltersOpen(false)}
                    toggle={
                      <DropdownToggle
                        id="column-filter-toggle"
                        onToggle={() => setSearchFiltersOpen(!isSearchFiltersOpen)}
                      >
                        {getFullColumnName(selectedFilterColumn)}
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
                {getHint()}
              </div>
            </Tooltip>
          ) : (
            forcedFilters &&
            forcedFilters.map((forcedFilter, ffIndex) => (
              <ChipGroup
                key={ffIndex}
                isClosable={false}
                categoryName={getFullColumnName(columns.find(c => c.id === forcedFilter.colId))}
              >
                {forcedFilter.values.map((forcedValue, fvIndex) => (
                  <Chip key={fvIndex} isReadOnly={true}>
                    {forcedValue.display ? forcedValue.display : forcedValue.v}
                  </Chip>
                ))}
              </ChipGroup>
            ))
          )}
        </ToolbarItem>
        {!_.isEmpty(forcedFilters) && (
          <ToolbarItem className="flex-start">
            <OverflowMenu breakpoint="md">
              <OverflowMenuGroup groupType="button" isPersistent>
                <Button onClick={() => push(getPathWithParams(NETFLOW_TRAFFIC_PATH))}>{t('Edit filters')}</Button>
              </OverflowMenuGroup>
            </OverflowMenu>
          </ToolbarItem>
        )}
        <ToolbarItem className="flex-start">
          <OverflowMenu breakpoint="md">
            <OverflowMenuGroup groupType="button" isPersistent>
              {props.children}
            </OverflowMenuGroup>
          </OverflowMenu>
        </ToolbarItem>
        {actions && (
          <ToolbarItem className="flex-start" alignment={{ default: 'alignRight' }}>
            <OverflowMenu breakpoint="md">
              <OverflowMenuGroup groupType="button" isPersistent>
                {actions}
              </OverflowMenuGroup>
            </OverflowMenu>
          </ToolbarItem>
        )}
        {_.isEmpty(forcedFilters) &&
          filters &&
          filters.map((filter, index) => (
            <ToolbarFilter
              key={index}
              deleteChipGroup={() => {
                setFilters(filters.filter(f => f.colId !== filter.colId));
              }}
              chips={filter.values.map(value => (value.display ? value.display : value.v))}
              deleteChip={(f, value: string) => {
                filter.values = filter.values.filter(val => (val.display ? val.display !== value : val.v !== value));
                if (_.isEmpty(filter.values)) {
                  setFilters(filters.filter(f => f.colId !== filter.colId));
                } else {
                  setFilters(_.cloneDeep(filters));
                }
              }}
              categoryName={getFullColumnName(columns.find(c => c.id === filter.colId))}
            >
              {
                // set empty children to have a single filter with multiple categories
                <div></div>
              }
            </ToolbarFilter>
          ))}
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
