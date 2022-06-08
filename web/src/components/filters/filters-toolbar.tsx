import * as React from 'react';
import * as _ from 'lodash';
import {
  Button,
  Chip,
  ChipGroup,
  InputGroup,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  Toolbar,
  ToolbarContent,
  ToolbarFilter,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
  ValidatedOptions
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { Filter, FilterComponent, FilterDefinition, FilterValue } from '../../model/filters';
import { QueryOptionsDropdown, QueryOptionsDropdownProps } from '../dropdowns/query-options-dropdown';
import { FilterHints } from './filter-hints';
import FiltersDropdown from './filters-dropdown';
import { getFilterFullName, Indicator } from './filters-helper';
import TextFilter from './text-filter';
import AutocompleteFilter from './autocomplete-filter';
import { autoCompleteCache } from '../../utils/autocomplete-cache';
import { getPathWithParams, netflowTrafficPath } from '../../utils/url';
import { findFilter } from '../../utils/filter-definitions';

import './filters-toolbar.css';

export interface FiltersToolbarProps {
  id: string;
  filters?: Filter[];
  forcedFilters?: Filter[];
  actions?: React.ReactNode;
  skipTipsDelay?: boolean;
  setFilters: (v: Filter[]) => void;
  clearFilters: () => void;
  queryOptionsProps: QueryOptionsDropdownProps;
  menuContent?: JSX.Element[];
  menuControl?: JSX.Element;
}

export const FiltersToolbar: React.FC<FiltersToolbarProps> = ({
  id,
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
  const [indicator, setIndicator] = React.useState<Indicator>(ValidatedOptions.default);
  const [message, setMessage] = React.useState<string | undefined>();
  const [selectedFilter, setSelectedFilter] = React.useState<FilterDefinition>(findFilter(t, 'namespace')!);

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

  const addFilter = React.useCallback(
    (filterValue: FilterValue) => {
      const newFilters = _.cloneDeep(filters) || [];
      const found = newFilters.find(f => f.def.id === selectedFilter.id);
      if (found) {
        if (found.values.map(value => value.v).includes(filterValue.v)) {
          setMessageWithDelay(t('Filter already exists'));
          setIndicator(ValidatedOptions.error);
          return false;
        } else {
          found.values.push(filterValue);
        }
      } else {
        newFilters.push({ def: selectedFilter, values: [filterValue] });
      }
      setFilters(newFilters);
      return true;
    },
    [selectedFilter, filters, setFilters, setMessageWithDelay, t]
  );

  const getFilterControl = React.useCallback(() => {
    const commonProps = {
      filterDefinition: selectedFilter,
      addFilter: addFilter,
      setMessageWithDelay: setMessageWithDelay,
      indicator: indicator,
      setIndicator: setIndicator
    };
    switch (selectedFilter.component) {
      case FilterComponent.Text:
        return <TextFilter {...commonProps} />;
      case FilterComponent.Autocomplete:
        return <AutocompleteFilter {...commonProps} />;
    }
  }, [selectedFilter, addFilter, indicator, setIndicator, setMessageWithDelay]);

  const hasFilterValues = React.useCallback(() => {
    return filters?.some(f => f.values.length !== 0);
  }, [filters]);

  return (
    <Toolbar
      data-test={id}
      id={id}
      clearAllFilters={() => {
        clearFilters();
        autoCompleteCache.clear();
      }}
      clearFiltersButtonText={hasFilterValues() ? t('Clear all filters') : ''}
    >
      <ToolbarContent data-test={`${id}-search-filters`} id={`${id}-search-filters`} toolbarId={id}>
        <ToolbarItem className="flex-start">
          <QueryOptionsDropdown {...props.queryOptionsProps} />
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
                  <FiltersDropdown selectedFilter={selectedFilter} setSelectedFilter={setSelectedFilter} />
                  {getFilterControl()}
                </InputGroup>
                <FilterHints def={selectedFilter} />
              </div>
            </Tooltip>
          </ToolbarItem>
        )}
        {!_.isEmpty(props.menuContent) && (
          <ToolbarItem className="flex-start">
            <OverflowMenu breakpoint="2xl">
              <OverflowMenuContent isPersistent>
                <OverflowMenuGroup groupType="button" isPersistent className="flex-start">
                  {props.menuContent}
                </OverflowMenuGroup>
              </OverflowMenuContent>
              {props.menuControl && (
                <OverflowMenuControl className="flex-start">{props.menuControl}</OverflowMenuControl>
              )}
            </OverflowMenu>
          </ToolbarItem>
        )}
        {actions && (
          <ToolbarItem className="flex-start" alignment={{ default: 'alignRight' }}>
            {actions}
          </ToolbarItem>
        )}
        {_.isEmpty(forcedFilters) ? (
          filters &&
          filters.map((filter, index) => (
            <ToolbarFilter
              key={index}
              deleteChipGroup={() => setFilters(filters.filter(f => f.def.id !== filter.def.id))}
              chips={filter.values.map(value => value.display || value.v)}
              deleteChip={(f, value: string) => {
                filter.values = filter.values.filter(val => (val.display ? val.display !== value : val.v !== value));
                if (_.isEmpty(filter.values)) {
                  setFilters(filters.filter(f => f.def.id !== filter.def.id));
                } else {
                  // CHECK / FIXME cloneDeep won't work?
                  setFilters(_.cloneDeep(filters));
                }
              }}
              categoryName={getFilterFullName(filter.def, t)}
            >
              {
                // set empty children to have a single filter with multiple categories
                <div></div>
              }
            </ToolbarFilter>
          ))
        ) : (
          <ToolbarGroup data-test="forced-filters" id="forced-filters" variant="filter-group">
            <ToolbarItem className="flex-start">
              {forcedFilters &&
                forcedFilters.map((forcedFilter, ffIndex) => (
                  <ChipGroup key={ffIndex} isClosable={false} categoryName={getFilterFullName(forcedFilter.def, t)}>
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
                  <Button onClick={() => push(getPathWithParams(netflowTrafficPath))}>{t('Edit filters')}</Button>
                </OverflowMenuGroup>
              </OverflowMenu>
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </ToolbarContent>
    </Toolbar>
  );
};

export default FiltersToolbar;
