import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
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
  Popper,
  TextInput,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
  ValidatedOptions
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { getPort } from 'port-numbers';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Column, ColumnGroup, ColumnsId, getColumnGroups, getFullColumnName } from '../utils/columns';
import {
  clearNamespaces,
  clearPods as clearObjects,
  createFilterValue,
  Filter,
  FilterOption,
  FilterType,
  FilterValue,
  findProtocolOption,
  getFilterOptions,
  hasNamespace,
  hasPods as hasObjects,
  setNamespaces,
  setObjects
} from '../utils/filters';
import './filters-toolbar.css';
import { validateIPFilter } from '../utils/ip';
import { QueryOptions } from '../model/query-options';
import { QueryOptionsDropdown } from './dropdowns/query-options-dropdown';
import { getPathWithParams, NETFLOW_TRAFFIC_PATH } from '../utils/router';
import { useHistory } from 'react-router-dom';
import { validateK8SName } from '../utils/label';
import { getNamespaces, getResources } from '../api/routes';
import { getHTTPErrorDetails } from '../utils/errors';
import { FilterHints } from './filter-hints';

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
  const [filtersGroups, setFiltersGroups] = React.useState<ColumnGroup[]>();
  const [selectedFilterColumn, setSelectedFilterColumn] = React.useState<Column>(columns[0]);
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

  const manageAutoCompleteOptions = (options: FilterOption[]) => {
    setAutocompleteOptions(options);
    // The menu is hidden if there are no options
    setPopperVisible(options.length > 0);
  };

  const manageKindsAutoComplete = React.useCallback((kindNamespacePod: string, suggest = true) => {
    const split = kindNamespacePod.split('.');
    const kind = split[0];
    const namespace = split[1];
    if (namespace && hasNamespace(namespace)) {
      const key = `${kind}.${namespace}`;
      if (!hasObjects(key)) {
        getResources(namespace, kind).then(pods => {
          setObjects(key, pods);
          if (suggest) {
            manageAutoCompleteOptions(getFilterOptions(FilterType.K8S_OBJECT, kindNamespacePod));
          }
        });
      } else if (suggest) {
        manageAutoCompleteOptions(getFilterOptions(FilterType.K8S_OBJECT, kindNamespacePod));
      }
    } else {
      manageAutoCompleteOptions(getFilterOptions(FilterType.NAMESPACE, namespace ? namespace : ''));
    }
  }, []);

  const onAutoCompleteChange = (newValue: string) => {
    if (selectedFilterColumn.filterType === FilterType.KIND_NAMESPACE_NAME && newValue.includes('.')) {
      manageKindsAutoComplete(newValue);
    } else {
      const options = getFilterOptions(selectedFilterColumn.filterType, newValue);
      manageAutoCompleteOptions(options);
    }
    setFilterValue(newValue);
  };

  const validateFilterValue = React.useCallback(
    (value: string) => {
      if (!selectedFilterColumn) {
        return { err: t('Column must be selected') };
      } else if (_.isEmpty(value)) {
        if (selectedFilterColumn.filterType === FilterType.NAMESPACE) {
          return { err: t('Value is empty. For an empty exact match, type ""') };
        }
        return { err: t('Value is empty') };
      }

      switch (selectedFilterColumn.filterType) {
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
        case FilterType.NAMESPACE:
        case FilterType.K8S_NAMES:
          return value === '""' || validateK8SName(value) ? { val: value } : { err: t('Not a valid Kubernetes name') };
        case FilterType.KIND:
        case FilterType.KIND_NAMESPACE_NAME:
          return { err: t('You must select an existing kubernetes object from autocomplete') };
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

  const manageAutoCompleteOption = React.useCallback(
    (option: FilterOption) => {
      if (selectedFilterColumn.filterType === FilterType.KIND_NAMESPACE_NAME) {
        if (selectedFilterValue.includes('.')) {
          const split = selectedFilterValue.split('.');
          if (split.length === 3) {
            const kindNamespacePod = `${split[0]}.${split[1]}.${option.name}`;
            addFilter(selectedFilterColumn.id, { v: kindNamespacePod, display: kindNamespacePod });
          } else {
            const kindNamespaceDot = `${split[0]}.${option.name}.`;
            setSelectedFilterValue(kindNamespaceDot);
            manageKindsAutoComplete(kindNamespaceDot);
          }
        } else {
          const namespaceDot = option.name + '.';
          setSelectedFilterValue(namespaceDot);
          manageKindsAutoComplete(namespaceDot);
        }
        searchInputRef?.current?.focus();
        return;
      } else {
        addFilter(selectedFilterColumn.id, { v: option.value, display: option.name });
      }
      resetAutocompleteOptions();
    },
    [addFilter, manageKindsAutoComplete, selectedFilterColumn.filterType, selectedFilterColumn.id, selectedFilterValue]
  );

  const onAutoCompleteSelect = React.useCallback(
    (e: React.MouseEvent<Element, MouseEvent> | undefined, itemId: string) => {
      e?.stopPropagation();
      const option = autocompleteOptions.find(opt => opt.value === itemId);
      if (!option) {
        return;
      }
      manageAutoCompleteOption(option);
    },
    [autocompleteOptions, manageAutoCompleteOption]
  );

  const resetAutocompleteOptions = () => {
    setPopperVisible(false);
    setAutocompleteOptions([]);
  };

  const manageFilters = React.useCallback(() => {
    // Only one choice is present, consider this is what is desired
    if (autocompleteOptions.length === 1) {
      manageAutoCompleteOption(autocompleteOptions[0]);
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
    manageAutoCompleteOption,
    setMessageWithDelay,
    addFilter
  ]);

  /*TODO: check if we can do autocomplete for pod / namespace fields
   * as implemented for protocols
   */
  const getFilterControl = (col: Column) => {
    switch (col.filterType) {
      case FilterType.KIND:
      case FilterType.NAMESPACE:
      case FilterType.K8S_OBJECT:
      case FilterType.KIND_NAMESPACE_NAME:
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

  const getFiltersDropdownItems = () => {
    return [
      <Accordion key="accordion">
        {filtersGroups &&
          filtersGroups.map((g, i) => (
            <AccordionItem key={`group-${i}`}>
              <AccordionToggle
                onClick={() => {
                  const expanded = !g.expanded;
                  filtersGroups.map(fg => (fg.expanded = false));
                  g.expanded = expanded;
                  setFiltersGroups([...filtersGroups]);
                }}
                isExpanded={g.expanded}
                id={`group-${i}-toggle`}
              >
                {g.title && <h1 className="pf-c-dropdown__group-title">{g.title}</h1>}
              </AccordionToggle>
              <AccordionContent isHidden={g.title != undefined && !g.expanded}>
                {g.columns.map((col, index) => (
                  <DropdownItem
                    id={col.id}
                    className={`column-filter-item ${g.title ? 'grouped' : ''}`}
                    component="button"
                    onClick={() => {
                      setSearchFiltersOpen(false);
                      setSelectedFilterColumn(col);
                    }}
                    key={index}
                  >
                    {col.name}
                  </DropdownItem>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
      </Accordion>
    ];
  };

  const manageCache = () => {
    switch (selectedFilterColumn.filterType) {
      case FilterType.KIND_NAMESPACE_NAME:
      case FilterType.NAMESPACE:
        // refresh available namespaces and clear pods
        getNamespaces()
          .then(ns => {
            setNamespaces(ns);
          })
          .catch(err => {
            const errorMessage = getHTTPErrorDetails(err);
            setMessageWithDelay(errorMessage);
          });
        clearObjects();
        break;
      /*case FilterType.POD:
        //clear all objects
        clearObjects();

        // get namespaces from filters
        let values: FilterValue[] | undefined = undefined;
        if (selectedFilterColumn.id === ColumnsId.srcpod) {
          values = filters?.find(f => f.colId === ColumnsId.srcnamespace)?.values;
        } else if (selectedFilterColumn.id === ColumnsId.dstpod) {
          values = filters?.find(f => f.colId === ColumnsId.dstnamespace)?.values;
        } else {
          values = filters?.find(f => f.colId === ColumnsId.namespace)?.values;
        }

        //set pods for each namespace found
        values?.forEach(v => {
          manageKindsAutoComplete(`Pod.${v.v}.`, false);
        });
        break;*/
      default:
        //clear all
        clearNamespaces();
        clearObjects();
        break;
    }
  };

  React.useEffect(() => {
    resetFilterValue();
    searchInputRef?.current?.focus();
    manageCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilterColumn]);

  React.useEffect(() => {
    //skip columns without filter types
    const typedFilters = columns.filter(c => c.filterType !== FilterType.NONE);
    //groups columns by Common fields / Source / Destination
    const groups = getColumnGroups(typedFilters, t('Common'), true);
    setFiltersGroups(groups);
    //pick name column of common group
    const nameCol = groups.flatMap(g => g.columns).find(c => c.id === ColumnsId.name);
    setSelectedFilterColumn(nameCol ? nameCol : typedFilters[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  return (
    <Toolbar
      id={id}
      clearAllFilters={() => {
        clearFilters();
        manageCache();
      }}
      clearFiltersButtonText={hasFilterValue() ? t('Clear all filters') : ''}
    >
      <ToolbarContent id={`${id}-search-filters`} toolbarId={id}>
        <ToolbarItem className="flex-start">
          <QueryOptionsDropdown options={props.queryOptions} setOptions={props.setQueryOptions} />
        </ToolbarItem>
        {_.isEmpty(forcedFilters) && (
          <ToolbarItem className="flex-start">
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
                    dropdownItems={getFiltersDropdownItems()}
                    isOpen={isSearchFiltersOpen}
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
                <FilterHints type={selectedFilterColumn.filterType} name={selectedFilterColumn.name} />
              </div>
            </Tooltip>
          </ToolbarItem>
        )}
        {props.children && <ToolbarItem className="flex-start">{props.children}</ToolbarItem>}
        {actions && (
          <ToolbarItem className="flex-start" alignment={{ default: 'alignRight' }}>
            <OverflowMenu breakpoint="md">
              <OverflowMenuGroup groupType="button" isPersistent>
                {actions}
              </OverflowMenuGroup>
            </OverflowMenu>
          </ToolbarItem>
        )}
        {_.isEmpty(forcedFilters) ? (
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
          ))
        ) : (
          <ToolbarGroup id="forced-filters" variant="filter-group">
            <ToolbarItem className="flex-start">
              {forcedFilters &&
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
                ))}
            </ToolbarItem>
            <ToolbarItem className="flex-start">
              <OverflowMenu breakpoint="md">
                <OverflowMenuGroup groupType="button" isPersistent>
                  <Button onClick={() => push(getPathWithParams(NETFLOW_TRAFFIC_PATH))}>{t('Edit filters')}</Button>
                </OverflowMenuGroup>
              </OverflowMenu>
            </ToolbarItem>
          </ToolbarGroup>
        )}
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
