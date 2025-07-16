import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  Text,
  TextContent,
  TextVariants,
  ToolbarGroup,
  ToolbarItem,
  Tooltip
} from '@patternfly/react-core';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowsAltVIcon,
  BanIcon,
  CheckIcon,
  InfoAltIcon,
  PencilAltIcon,
  TimesCircleIcon,
  TimesIcon
} from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Filter,
  FilterCompare,
  FilterDefinition,
  Filters,
  filtersEqual,
  FilterValue,
  hasEnabledFilterValues,
  removeFromFilters
} from '../../../model/filters';
import { Match } from '../../../model/flow-query';
import { QuickFilter } from '../../../model/quick-filters';
import { autoCompleteCache } from '../../../utils/autocomplete-cache';
import {
  bnfFilterValue,
  hasSrcAndDstFilters,
  hasSrcOrDstFilters,
  setTargeteableFilters,
  swapFilters,
  swapFilterValue
} from '../../../utils/filters-helper';
import { getPathWithParams, netflowTrafficPath } from '../../../utils/url';
import { MatchDropdown } from '../../dropdowns/match-dropdown';
import { navigate } from '../../dynamic-loader/dynamic-loader';
import { LinksOverflow } from '../links-overflow';
import './filters-chips.css';

export interface FiltersChipsProps {
  isForced: boolean;
  filters: Filters;
  setFilters: (v: Filters) => void;
  editValue: (f: Filter, v: string) => void;
  clearFilters: () => void;
  resetFilters: () => void;
  quickFilters: QuickFilter[];
  filterDefinitions: FilterDefinition[];
}

export interface FiltersGroup {
  id: 'src' | 'dst' | 'common';
  filters: Filter[];
}

export const FiltersChips: React.FC<FiltersChipsProps> = ({
  isForced,
  filters,
  setFilters,
  editValue,
  clearFilters,
  resetFilters,
  quickFilters,
  filterDefinitions
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [openedDropdown, setOpenedDropdown] = React.useState<string>();

  const getGroupName = React.useCallback(
    (id: 'src' | 'dst' | 'common') => {
      if (id === 'common') {
        return '';
      }
      if (filters.match === 'peers') {
        if (hasSrcAndDstFilters(filters.list)) {
          return id === 'src' ? t('Peer A') : t('Peer B');
        }
        return t('Peer');
      }
      return id === 'src' ? t('Source') : t('Destination');
    },
    [filters.list, filters.match, t]
  );

  const getGroups = React.useCallback(() => {
    const srcGroup: FiltersGroup = { id: 'src', filters: [] };
    const dstGroup: FiltersGroup = { id: 'dst', filters: [] };
    const commonGroup: FiltersGroup = { id: 'common', filters: [] };
    filters.list.forEach(f => {
      if (f.def.id.startsWith('src_')) {
        srcGroup.filters.push(f);
      } else if (f.def.id.startsWith('dst_')) {
        dstGroup.filters.push(f);
      } else {
        commonGroup.filters.push(f);
      }
    });
    return [srcGroup, dstGroup, commonGroup];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.list, filters.match]);

  const getDefaultFilters = React.useCallback(() => {
    return quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);
  }, [quickFilters]);

  const setFiltersList = React.useCallback(
    (list: Filter[]) => {
      setFilters({ ...filters, list: list });
    },
    [setFilters, filters]
  );

  const swapAllSrcDst = React.useCallback(() => {
    const swapped = swapFilters(filterDefinitions, filters!.list);
    setFilters({ ...filters!, list: swapped });
  }, [filterDefinitions, filters, setFilters]);

  const swapValue = React.useCallback(
    (filter: Filter, value: FilterValue, target: 'src' | 'dst') => {
      const list = swapFilterValue(filterDefinitions, filters!.list, filter.def.id, value, target);
      setFilters({ ...filters!, list });
      setOpenedDropdown(undefined);
    },
    [filterDefinitions, filters, setFilters]
  );

  const removeValue = React.useCallback(
    (filter: Filter, value: FilterValue) => {
      filter.values = filter.values.filter(val => val.v !== value.v);
      if (_.isEmpty(filter.values)) {
        setFiltersList(removeFromFilters(filters.list, filter));
      } else {
        setFilters(_.cloneDeep(filters));
      }
      setOpenedDropdown(undefined);
    },
    [filters, setFilters, setFiltersList]
  );

  const getAndOrText = React.useCallback(
    (match: Match | 'values', index: number) => {
      if (index == 0) {
        return undefined;
      }

      return (
        <Tooltip
          content={
            match === 'values'
              ? t('When a filter has multiple values, the logical OR operator is used between each of these.')
              : match === 'any'
              ? t('When using match any, the logical OR operator is used between filters.')
              : t('When using match {{match}}, the logical AND operator is used between filters.', { match })
          }
        >
          <Text className="and-or-text" component="p">
            {match === 'any' || match === 'values' ? t('OR') : t('AND')}
          </Text>
        </Tooltip>
      );
    },
    [t]
  );

  const getFullName = React.useCallback(
    (filter: Filter) => {
      switch (filter.compare) {
        case FilterCompare.notEqual:
          return `${t('Not')} ${filter.def.name} ${t('equals')}`;
        case FilterCompare.equal:
          return `${filter.def.name} ${t('equals')}`;
        case FilterCompare.moreThanOrEqual:
          return `${filter.def.name} ${t('more than')}`;
        case FilterCompare.notMatch:
          return `${t('Not')} ${filter.def.name} ${t('contains')}`;
        case FilterCompare.match:
          return `${filter.def.name} ${t('contains')}`;
      }
    },
    [t]
  );

  const getFilterDisplay = React.useCallback(
    (filter: Filter, cfIndex: number) => {
      const someEnabled = hasEnabledFilterValues(filter);
      return (
        <div key={cfIndex} className="flex-block">
          {getAndOrText(filters.match, cfIndex)}
          <div className={`custom-chip-group ${someEnabled ? '' : 'disabled-group'}`}>
            <Tooltip
              content={`${someEnabled ? t('Disable') : t('Enable')} '${getFullName(filter)}' ${t('group filter')}`}
            >
              <Text
                className="pf-v5-c-chip-group__label"
                component={TextVariants.p}
                onClick={() => {
                  //switch all values if no remaining
                  filter.values.forEach(fv => {
                    fv.disabled = someEnabled;
                  });
                  setFilters(_.cloneDeep(filters));
                }}
              >
                {getFullName(filter)}
              </Text>
            </Tooltip>
            {filter.values.map((filterValue, fvIndex) => {
              if (isForced || filterValue.disabled) {
                return (
                  <div key={fvIndex} className="flex-block">
                    {getAndOrText('values', fvIndex)}
                    <div className={`custom-chip ${filterValue.disabled ? 'disabled-value' : ''}`}>
                      <Tooltip
                        content={`${filterValue.disabled ? t('Enable') : t('Disable')} ${getFullName(filter)} '${
                          filterValue.display || filterValue.v
                        }' ${t('filter')}`}
                      >
                        <Text
                          component={TextVariants.p}
                          onClick={() => {
                            filterValue.disabled = !filterValue.disabled;
                            setFilters(_.cloneDeep(filters));
                          }}
                        >
                          {filterValue.display ? filterValue.display : filterValue.v}
                        </Text>
                      </Tooltip>
                    </div>
                  </div>
                );
              }

              const dropdownId = `${filter.def.id}-${fvIndex}`;
              return (
                <div key={fvIndex} className="flex-block">
                  {getAndOrText('values', fvIndex)}
                  <Dropdown
                    isOpen={dropdownId === openedDropdown}
                    onOpenChange={(isOpen: boolean) => setOpenedDropdown(isOpen ? dropdownId : undefined)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        className={`custom-chip ${filterValue.disabled ? 'disabled-value' : ''}`}
                        isExpanded={dropdownId === openedDropdown}
                        onClick={() => setOpenedDropdown(openedDropdown === dropdownId ? undefined : dropdownId)}
                      >
                        {filterValue.display ? filterValue.display : filterValue.v}
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      <DropdownItem
                        key="edit"
                        onClick={() => {
                          removeValue(filter, filterValue);
                          editValue(filter, filterValue.v);
                        }}
                      >
                        <PencilAltIcon />
                        &nbsp;{t('Edit')}
                      </DropdownItem>
                      {filters.match !== 'peers' &&
                        (filter.def.id.startsWith('src_') || filter.def.id.startsWith('dst_')) && (
                          <DropdownItem
                            key="bnf"
                            onClick={() => {
                              const bnf = bnfFilterValue(filterDefinitions, filters!.list, filter.def.id, filterValue);
                              setFilters({ ...filters!, list: bnf });
                              setOpenedDropdown(undefined);
                            }}
                          >
                            <ArrowsAltVIcon style={{ transform: 'rotate(90deg)' }} />
                            &nbsp;{t('Any')}
                          </DropdownItem>
                        )}
                      {(filter.def.category === 'targeteable' || filter.def.id.startsWith('dst_')) && (
                        <DropdownItem key="src" onClick={() => swapValue(filter, filterValue, 'src')}>
                          <ArrowLeftIcon />
                          &nbsp;{filters.match === 'peers' ? t('As peer A') : t('As source')}
                        </DropdownItem>
                      )}
                      {(filter.def.category === 'targeteable' || filter.def.id.startsWith('src_')) && (
                        <DropdownItem key="dst" onClick={() => swapValue(filter, filterValue, 'dst')}>
                          <ArrowRightIcon />
                          &nbsp;{filters.match === 'peers' ? t('As peer B') : t('As destination')}
                        </DropdownItem>
                      )}
                      <DropdownItem
                        key="disable"
                        onClick={() => {
                          filterValue.disabled = !filterValue.disabled;
                          setFilters(_.cloneDeep(filters));
                          setOpenedDropdown(undefined);
                        }}
                      >
                        {filterValue.disabled && <CheckIcon />}
                        {!filterValue.disabled && <BanIcon />}
                        &nbsp;{filterValue.disabled ? t('Enable') : t('Disable')}
                      </DropdownItem>
                      <DropdownItem
                        key="remove"
                        onClick={() => {
                          removeValue(filter, filterValue);
                        }}
                      >
                        <TimesIcon />
                        &nbsp;{t('Remove')}
                      </DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </div>
              );
            })}
            {!isForced && (
              <Button variant="plain" onClick={() => setFiltersList(removeFromFilters(filters.list, filter))}>
                <TimesCircleIcon />
              </Button>
            )}
          </div>
        </div>
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterDefinitions, filters, isForced, openedDropdown, setFilters, setFiltersList, swapValue]
  );

  const setMatch = React.useCallback(
    (v: Match) => {
      const existingFilters = filters;
      // convert all targeteable filters to a single peer
      if (v !== 'any') {
        existingFilters.list = setTargeteableFilters(filterDefinitions, existingFilters.list, 'src');
      }
      setFilters({ ...existingFilters, match: v });
    },
    [filters, setFilters, filterDefinitions]
  );

  if (_.isEmpty(filters.list) && _.isEmpty(getDefaultFilters())) {
    return null;
  }
  const isDefaultFilters = filtersEqual(filters.list, getDefaultFilters());

  return (
    <ToolbarGroup
      className="toolbar-group flex-start"
      data-test={`${isForced ? 'forced-' : ''}filters`}
      id={`${isForced ? 'forced-' : ''}filters`}
      variant="filter-group"
    >
      {!isForced && (filters.list.length >= 2 || hasSrcOrDstFilters(filters.list)) && (
        <ToolbarItem className="flex-start match-container">
          <Flex direction={{ default: hasSrcOrDstFilters(filters.list) ? 'column' : 'row' }}>
            <FlexItem>
              <Tooltip
                position="left"
                content={
                  <TextContent className="netobserv-tooltip-text">
                    <Text component={TextVariants.p}>{t('Match filters according to your needs.')}</Text>
                    <Text component={TextVariants.p} className="netobserv-align-start">
                      - {t('Any will match at least one filter')}
                    </Text>
                    <Text component={TextVariants.p} className="netobserv-align-start">
                      - {t('All will match all the filters')}
                    </Text>
                    <Text component={TextVariants.p} className="netobserv-align-start">
                      - {t('Peers will match all the filters and include the return traffic')}
                    </Text>
                  </TextContent>
                }
              >
                <Text className="match-text">
                  {t('Match')} <InfoAltIcon />
                </Text>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <MatchDropdown selected={filters.match} setMatch={setMatch} />
            </FlexItem>
          </Flex>
        </ToolbarItem>
      )}
      <ToolbarItem className="flex-start flex">
        {getGroups()
          .filter(gp => gp.filters.length)
          .map((gp, index) => {
            return (
              <div key={gp.id} className="flex-block">
                {getAndOrText(filters.match, index)}
                <div className={`custom-chip-box ${gp.id !== 'common' ? 'custom-chip-peer' : ''}`}>
                  {hasSrcOrDstFilters(filters.list) && <Text>{getGroupName(gp.id)}&nbsp;</Text>}
                  <div className="flex-block">{gp.filters.map(getFilterDisplay)}</div>
                </div>
              </div>
            );
          })}
      </ToolbarItem>
      {isForced ? (
        <Button
          id="edit-filters-button"
          data-test="edit-filters-button"
          onClick={() => navigate(getPathWithParams(netflowTrafficPath))}
        >
          {t('Edit filters')}
        </Button>
      ) : (
        <>
          <LinksOverflow
            id={'chips-more-options'}
            items={[
              {
                id: 'reset-filters',
                label: t('Reset defaults'),
                onClick: () => {
                  resetFilters();
                  autoCompleteCache.clear();
                },
                enabled: getDefaultFilters().length > 0 && !isDefaultFilters
              },
              {
                id: 'clear-all-filters',
                label: t('Clear all'),
                onClick: () => {
                  clearFilters();
                  autoCompleteCache.clear();
                },
                enabled: !_.isEmpty(filters.list)
              },
              {
                id: 'swap-filters',
                label: t('Swap'),
                tooltip: t('Swap from and to filters'),
                onClick: swapAllSrcDst,
                enabled: hasSrcOrDstFilters(filters.list!) && filters.match !== 'peers'
              }
            ]}
          />
        </>
      )}
    </ToolbarGroup>
  );
};
