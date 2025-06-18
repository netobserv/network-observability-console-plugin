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
  TimesCircleIcon,
  TimesIcon
} from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Filter,
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

  const getAndOrText = React.useCallback(
    (index: number) => {
      if (index == 0) {
        return undefined;
      }

      return (
        <Text className="and-or-text" component="p">
          {filters.match === 'any' ? t('OR') : t('AND')}
        </Text>
      );
    },
    [filters.match, t]
  );

  const getFilterDisplay = React.useCallback(
    (chipFilter: Filter, cfIndex: number) => {
      let fullName = chipFilter.def.name;
      if (chipFilter.not) {
        fullName = t('Not') + ' ' + fullName;
      }
      if (chipFilter.moreThan) {
        fullName = fullName + ' ' + t('more than');
      }
      const someEnabled = hasEnabledFilterValues(chipFilter);
      return (
        <div className="flex-block">
          {getAndOrText(cfIndex)}
          <div key={cfIndex} className={`custom-chip-group ${someEnabled ? '' : 'disabled-group'}`}>
            <Tooltip content={`${someEnabled ? t('Disable') : t('Enable')} '${fullName}' ${t('group filter')}`}>
              <Text
                className="pf-v5-c-chip-group__label"
                component={TextVariants.p}
                onClick={() => {
                  //switch all values if no remaining
                  chipFilter.values.forEach(fv => {
                    fv.disabled = someEnabled;
                  });
                  setFilters(_.cloneDeep(filters));
                }}
              >
                {fullName}
              </Text>
            </Tooltip>
            {chipFilter.values.map((chipFilterValue, fvIndex) => {
              if (isForced || chipFilterValue.disabled) {
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
                          chipFilterValue.disabled = !chipFilterValue.disabled;
                          setFilters(_.cloneDeep(filters));
                        }}
                      >
                        {chipFilterValue.display ? chipFilterValue.display : chipFilterValue.v}
                      </Text>
                    </Tooltip>
                  </div>
                );
              }

              const dropdownId = `${chipFilter.def.id}-${fvIndex}`;
              return (
                <Dropdown
                  key={fvIndex}
                  isOpen={dropdownId === openedDropdown}
                  onOpenChange={(isOpen: boolean) => setOpenedDropdown(isOpen ? dropdownId : undefined)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      className={`custom-chip ${chipFilterValue.disabled ? 'disabled-value' : ''}`}
                      isExpanded={dropdownId === openedDropdown}
                      onClick={() => setOpenedDropdown(openedDropdown === dropdownId ? undefined : dropdownId)}
                    >
                      {chipFilterValue.display ? chipFilterValue.display : chipFilterValue.v}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem
                      key="disable"
                      onClick={() => {
                        chipFilterValue.disabled = !chipFilterValue.disabled;
                        setFilters(_.cloneDeep(filters));
                        setOpenedDropdown(undefined);
                      }}
                    >
                      {chipFilterValue.disabled && <CheckIcon />}
                      {!chipFilterValue.disabled && <BanIcon />}
                      &nbsp;{chipFilterValue.disabled ? t('Enable') : t('Disable')}
                    </DropdownItem>
                    {filters.match !== 'peers' &&
                      (chipFilter.def.id.startsWith('src_') || chipFilter.def.id.startsWith('dst_')) && (
                        <DropdownItem
                          key="bnf"
                          onClick={() => {
                            const bnf = bnfFilterValue(
                              filterDefinitions,
                              filters!.list,
                              chipFilter.def.id,
                              chipFilterValue
                            );
                            setFilters({ ...filters!, list: bnf });
                            setOpenedDropdown(undefined);
                          }}
                        >
                          <ArrowsAltVIcon style={{ transform: 'rotate(90deg)' }} />
                          &nbsp;{t('Any')}
                        </DropdownItem>
                      )}
                    {(chipFilter.def.category === 'targeteable' || chipFilter.def.id.startsWith('dst_')) && (
                      <DropdownItem key="src" onClick={() => swapValue(chipFilter, chipFilterValue, 'src')}>
                        <ArrowLeftIcon />
                        &nbsp;{filters.match === 'peers' ? t('As peer A') : t('As source')}
                      </DropdownItem>
                    )}
                    {(chipFilter.def.category === 'targeteable' || chipFilter.def.id.startsWith('src_')) && (
                      <DropdownItem key="dst" onClick={() => swapValue(chipFilter, chipFilterValue, 'dst')}>
                        <ArrowRightIcon />
                        &nbsp;{filters.match === 'peers' ? t('As peer B') : t('As destination')}
                      </DropdownItem>
                    )}
                    <DropdownItem
                      key="remove"
                      onClick={() => {
                        chipFilter.values = chipFilter.values.filter(val => val.v !== chipFilterValue.v);
                        if (_.isEmpty(chipFilter.values)) {
                          setFiltersList(removeFromFilters(filters.list, chipFilter));
                        } else {
                          setFilters(_.cloneDeep(filters));
                        }
                        setOpenedDropdown(undefined);
                      }}
                    >
                      <TimesIcon />
                      &nbsp;{t('Remove')}
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              );
            })}
            {!isForced && (
              <Button variant="plain" onClick={() => setFiltersList(removeFromFilters(filters.list, chipFilter))}>
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
      {(filters.list.length > 2 || hasSrcOrDstFilters(filters.list)) && (
        <ToolbarItem className="flex-start match-container">
          <Flex direction={{ default: hasSrcOrDstFilters(filters.list) ? 'column' : 'row' }}>
            <FlexItem>
              <Text className="match-text">{t('Match')}</Text>
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
              <>
                {getAndOrText(index)}
                <div key={gp.id} className={`custom-chip-box ${gp.id !== 'common' ? 'custom-chip-peer' : ''}`}>
                  {hasSrcOrDstFilters(filters.list) && <Text>{getGroupName(gp.id)}&nbsp;</Text>}
                  <div className="flex-block">{gp.filters.map(getFilterDisplay)}</div>
                </div>
              </>
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
