import {
  Button,
  InputGroup,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  Text,
  TextVariants,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
  Tooltip,
  ValidatedOptions
} from '@patternfly/react-core';
import { TimesIcon, TimesCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import {
  Filter,
  FilterComponent,
  FilterDefinition,
  FilterValue,
  findFromFilters,
  hasEnabledFilterValues,
  removeFromFilters
} from '../../model/filters';
import { QuickFilter } from '../../model/quick-filters';
import { autoCompleteCache } from '../../utils/autocomplete-cache';
import { findFilter } from '../../utils/filter-definitions';
import { getPathWithParams, netflowTrafficPath } from '../../utils/url';
import { QueryOptionsDropdown, QueryOptionsDropdownProps } from '../dropdowns/query-options-dropdown';
import { QuickFilters } from './quick-filters';
import AutocompleteFilter from './autocomplete-filter';
import { FilterActionLinks } from './filter-action-links';
import { FilterHints } from './filter-hints';
import FiltersDropdown from './filters-dropdown';
import { getFilterFullName, Indicator } from './filters-helper';
import TextFilter from './text-filter';
import { LOCAL_STORAGE_SHOW_FILTERS_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import './filters-toolbar.css';

export interface FiltersToolbarProps {
  id: string;
  filters?: Filter[];
  forcedFilters?: Filter[] | null;
  skipTipsDelay?: boolean;
  setFilters: (v: Filter[]) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  queryOptionsProps: QueryOptionsDropdownProps;
  menuContent?: JSX.Element[];
  menuControl?: JSX.Element;
  quickFilters: QuickFilter[];
  allowConnectionFilter?: boolean;
}

export const FiltersToolbar: React.FC<FiltersToolbarProps> = ({
  id,
  filters,
  forcedFilters,
  skipTipsDelay,
  setFilters,
  clearFilters,
  resetFilters,
  quickFilters,
  allowConnectionFilter,
  ...props
}) => {
  const { push } = useHistory();
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [indicator, setIndicator] = React.useState<Indicator>(ValidatedOptions.default);
  const [message, setMessage] = React.useState<string | undefined>();
  const [selectedFilter, setSelectedFilter] = React.useState<FilterDefinition>(findFilter(t, 'namespace')!);
  const [showFilters, setShowFilters] = useLocalStorage<boolean>(LOCAL_STORAGE_SHOW_FILTERS_KEY, true);

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
      const found = findFromFilters(newFilters, { def: selectedFilter });
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

  const defaultFilters = quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
  const getFiltersChips = React.useCallback(() => {
    const isForced = !_.isEmpty(forcedFilters);
    const chipFilters = isForced ? forcedFilters : filters;

    if (_.isEmpty(chipFilters) && _.isEmpty(defaultFilters)) {
      return null;
    }

    const isDefaultFilters = _.isEqual(chipFilters, defaultFilters);

    return (
      <ToolbarGroup
        className="flex-start"
        data-test={`${isForced ? 'forced-' : ''}filters`}
        id={`${isForced ? 'forced-' : ''}filters`}
        variant="filter-group"
      >
        <ToolbarItem className="flex-start">
          {chipFilters &&
            chipFilters.map((chipFilter, cfIndex) => {
              let fullName = getFilterFullName(chipFilter.def, t);
              if (chipFilter.not) {
                fullName = t('Not') + ' ' + fullName;
              }
              const someEnabled = hasEnabledFilterValues(chipFilter);
              return (
                <div key={cfIndex} className={`custom-chip-group ${someEnabled ? '' : 'disabled-group'}`}>
                  <Tooltip content={`${someEnabled ? t('Disable') : t('Enable')} '${fullName}' ${t('group filter')}`}>
                    <Text
                      className="pf-c-chip-group__label"
                      component={TextVariants.p}
                      onClick={() => {
                        //switch all values if no remaining
                        chipFilter.values.forEach(fv => {
                          fv.disabled = someEnabled;
                        });
                        setFilters(_.cloneDeep(filters!));
                      }}
                    >
                      {fullName}
                    </Text>
                  </Tooltip>
                  {chipFilter.values.map((chipFilterValue, fvIndex) => {
                    return (
                      <div key={fvIndex} className={`custom-chip ${chipFilterValue.disabled ? 'disabled-value' : ''}`}>
                        <Tooltip
                          content={`${chipFilterValue.disabled ? t('Enable') : t('Disable')} ${fullName} '${
                            chipFilterValue.display || chipFilterValue.v
                          }' ${t('filter')}`}
                        >
                          <Text
                            component={TextVariants.p}
                            onClick={() => {
                              //switch value
                              chipFilterValue.disabled = !chipFilterValue.disabled;
                              setFilters(_.cloneDeep(filters!));
                            }}
                          >
                            {chipFilterValue.display ? chipFilterValue.display : chipFilterValue.v}
                          </Text>
                        </Tooltip>
                        {!isForced && (
                          <Button
                            variant="plain"
                            onClick={() => {
                              chipFilter.values = chipFilter.values.filter(val => val.v !== chipFilterValue.v);
                              if (_.isEmpty(chipFilter.values)) {
                                setFilters(removeFromFilters(filters!, chipFilter));
                              } else {
                                setFilters(_.cloneDeep(filters!));
                              }
                            }}
                          >
                            <TimesIcon />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                  {!isForced && (
                    <Button variant="plain" onClick={() => setFilters(removeFromFilters(filters!, chipFilter))}>
                      <TimesCircleIcon />
                    </Button>
                  )}
                </div>
              );
            })}
        </ToolbarItem>
        {isForced ? (
          <Button
            id="edit-filters-button"
            data-test="edit-filters-button"
            onClick={() => push(getPathWithParams(netflowTrafficPath))}
          >
            {t('Edit filters')}
          </Button>
        ) : (
          <>
            <FilterActionLinks
              showClear={!_.isEmpty(chipFilters)}
              showReset={defaultFilters.length > 0 && !isDefaultFilters}
              clearFilters={() => {
                clearFilters();
                autoCompleteCache.clear();
              }}
              resetFilters={() => {
                resetFilters();
                autoCompleteCache.clear();
              }}
            />
          </>
        )}
      </ToolbarGroup>
    );
  }, [clearFilters, filters, forcedFilters, defaultFilters, push, setFilters, resetFilters, t]);

  const countActiveFilters = (forcedFilters || filters || []).reduce((prev, cur) => prev + cur.values.length, 0);
  let showHideText: string | undefined;
  if (countActiveFilters > 0) {
    showHideText = showFilters ? t('Hide filters') : t('Show {{count}} filters', { count: countActiveFilters });
  } else if (defaultFilters.length > 0) {
    showHideText = showFilters ? t('Hide filters') : t('Show filters');
  }

  return (
    <Toolbar data-test={id} id={id}>
      <ToolbarContent data-test={`${id}-search-filters`} id={`${id}-search-filters`} toolbarId={id}>
        <ToolbarItem className="flex-start">
          <QueryOptionsDropdown {...props.queryOptionsProps} />
        </ToolbarItem>
        {_.isEmpty(forcedFilters) && quickFilters.length > 0 && (
          <ToolbarItem className="flex-start">
            <QuickFilters quickFilters={quickFilters} activeFilters={filters || []} setFilters={setFilters} />
          </ToolbarItem>
        )}
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
                  <FiltersDropdown
                    selectedFilter={selectedFilter}
                    setSelectedFilter={setSelectedFilter}
                    allowConnectionFilter={allowConnectionFilter}
                  />
                  {getFilterControl()}
                </InputGroup>
                <FilterHints def={selectedFilter} />
              </div>
            </Tooltip>
          </ToolbarItem>
        )}
        {showHideText && (
          <ToolbarItem className="flex-start">
            <Button
              data-test="show-filters-button"
              id="show-filters-button"
              variant="link"
              className="overflow-button"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showHideText}
            </Button>
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
        {showFilters && getFiltersChips()}
      </ToolbarContent>
    </Toolbar>
  );
};

export default FiltersToolbar;
