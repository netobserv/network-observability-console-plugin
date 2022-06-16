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
import { Filter, FilterComponent, FilterDefinition, FilterValue, hasEnabledFilterValues } from '../../model/filters';
import { autoCompleteCache } from '../../utils/autocomplete-cache';
import { findFilter } from '../../utils/filter-definitions';
import { getPathWithParams, netflowTrafficPath } from '../../utils/url';
import { QueryOptionsDropdown, QueryOptionsDropdownProps } from '../dropdowns/query-options-dropdown';
import AutocompleteFilter from './autocomplete-filter';
import { FilterHints } from './filter-hints';
import FiltersDropdown from './filters-dropdown';
import { getFilterFullName, Indicator } from './filters-helper';
import './filters-toolbar.css';
import TextFilter from './text-filter';

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

  const getFiltersChips = React.useCallback(() => {
    const isForced = !_.isEmpty(forcedFilters);
    const chipFilters = isForced ? forcedFilters : filters;

    if (_.isEmpty(chipFilters)) {
      return null;
    }

    return (
      <ToolbarGroup
        className="flex-start"
        data-test={`${isForced ? 'forced-' : ''}filters`}
        id={`${isForced ? 'forced-' : ''}filters`}
        variant="filter-group"
      >
        <ToolbarItem className="flex-start">
          {chipFilters &&
            chipFilters.map((chipFilter, cfIndex) => (
              <div
                key={cfIndex}
                className={`custom-chip-group ${!hasEnabledFilterValues(chipFilter) ? 'disabled-group' : ''}`}
              >
                <Tooltip
                  content={`${!hasEnabledFilterValues(chipFilter) ? t('Enable') : t('Disable')} '${getFilterFullName(
                    chipFilter.def,
                    t
                  )}' ${t('group filter')}`}
                >
                  <Text
                    className="pf-c-chip-group__label"
                    component={TextVariants.p}
                    onClick={() => {
                      //switch all values if no remaining
                      const isEnabled = hasEnabledFilterValues(chipFilter);
                      chipFilter.values.forEach(fv => {
                        fv.disabled = isEnabled;
                      });
                      setFilters(_.cloneDeep(filters!));
                    }}
                  >
                    {getFilterFullName(chipFilter.def, t)}
                  </Text>
                </Tooltip>
                {chipFilter.values.map((chipFilterValue, fvIndex) => (
                  <div key={fvIndex} className={`custom-chip ${chipFilterValue.disabled ? 'disabled-value' : ''}`}>
                    <Tooltip
                      content={`${chipFilterValue.disabled ? t('Enable') : t('Disable')} ${getFilterFullName(
                        chipFilter.def,
                        t
                      )} '${chipFilterValue.display || chipFilterValue.v}' ${t('filter')}`}
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
                            setFilters(filters!.filter(f => f.def.id !== chipFilter.def.id));
                          } else {
                            setFilters(_.cloneDeep(filters!));
                          }
                        }}
                      >
                        <TimesIcon />
                      </Button>
                    )}
                  </div>
                ))}
                {!isForced && (
                  <Button
                    variant="plain"
                    onClick={() => setFilters(filters!.filter(f => f.def.id !== chipFilter.def.id))}
                  >
                    <TimesCircleIcon />
                  </Button>
                )}
              </div>
            ))}
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
          <Button
            id="clear-all-filters-button"
            data-test="clear-all-filters-button"
            variant="link"
            onClick={() => {
              clearFilters();
              autoCompleteCache.clear();
            }}
          >
            {t('Clear all filters')}
          </Button>
        )}
      </ToolbarGroup>
    );
  }, [clearFilters, filters, forcedFilters, push, setFilters, t]);

  return (
    <Toolbar data-test={id} id={id}>
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
        {getFiltersChips()}
      </ToolbarContent>
    </Toolbar>
  );
};

export default FiltersToolbar;
