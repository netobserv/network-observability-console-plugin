import { Button, Content, ContentVariants, ToolbarGroup, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { LongArrowAltDownIcon, LongArrowAltUpIcon, TimesCircleIcon, TimesIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Filter,
  FilterDefinition,
  Filters,
  filtersEqual,
  hasEnabledFilterValues,
  removeFromFilters
} from '../../../model/filters';
import { QuickFilter } from '../../../model/quick-filters';
import { autoCompleteCache } from '../../../utils/autocomplete-cache';
import { getFilterFullName, hasSrcDstFilters, swapFilters } from '../../../utils/filters-helper';
import { getPathWithParams, netflowTrafficPath } from '../../../utils/url';
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

  const setFiltersList = React.useCallback(
    (list: Filter[]) => {
      setFilters({ ...filters, list: list });
    },
    [setFilters, filters]
  );

  const defaultFilters = quickFilters.filter(qf => qf.default).flatMap(qf => qf.filters);

  const swapSrcDst = React.useCallback(() => {
    const swapped = swapFilters(filterDefinitions, filters!.list);
    setFilters({ ...filters!, list: swapped });
  }, [filterDefinitions, filters, setFilters]);

  const toggleBackAndForth = React.useCallback(() => {
    setFilters({ ...filters!, backAndForth: !filters!.backAndForth });
  }, [setFilters, filters]);

  const chipFilters = filters.list;
  if (_.isEmpty(chipFilters) && _.isEmpty(defaultFilters)) {
    return null;
  }
  const isDefaultFilters = filtersEqual(chipFilters, defaultFilters);
  const isSrcDst = hasSrcDstFilters(chipFilters!);

  return (
    <ToolbarGroup
      className="toolbar-group flex-start"
      data-test={`${isForced ? 'forced-' : ''}filters`}
      id={`${isForced ? 'forced-' : ''}filters`}
      variant="filter-group"
    >
      <ToolbarItem className="flex-start flex">
        {chipFilters &&
          chipFilters.map((chipFilter, cfIndex) => {
            let fullName = getFilterFullName(chipFilter.def, t);
            if (chipFilter.not) {
              fullName = t('Not') + ' ' + fullName;
            }
            if (chipFilter.moreThan) {
              fullName = fullName + ' ' + t('more than');
            }
            const someEnabled = hasEnabledFilterValues(chipFilter);
            return (
              <div key={cfIndex} className={`custom-chip-group ${someEnabled ? '' : 'disabled-group'}`}>
                <Tooltip content={`${someEnabled ? t('Disable') : t('Enable')} '${fullName}' ${t('group filter')}`}>
                  <Content
                    className="pf-v6-c-chip-group__label"
                    component={ContentVariants.p}
                    onClick={() => {
                      //switch all values if no remaining
                      chipFilter.values.forEach(fv => {
                        fv.disabled = someEnabled;
                      });
                      setFilters(_.cloneDeep(filters));
                    }}
                  >
                    {fullName}
                  </Content>
                </Tooltip>
                {chipFilter.values.map((chipFilterValue, fvIndex) => {
                  return (
                    <div key={fvIndex} className={`custom-chip ${chipFilterValue.disabled ? 'disabled-value' : ''}`}>
                      <Tooltip
                        content={`${chipFilterValue.disabled ? t('Enable') : t('Disable')} ${fullName} '${
                          chipFilterValue.display || chipFilterValue.v
                        }' ${t('filter')}`}
                      >
                        <Content
                          component={ContentVariants.p}
                          onClick={() => {
                            //switch value
                            chipFilterValue.disabled = !chipFilterValue.disabled;
                            setFilters(_.cloneDeep(filters));
                          }}
                        >
                          {chipFilterValue.display ? chipFilterValue.display : chipFilterValue.v}
                        </Content>
                      </Tooltip>
                      {!isForced && (
                        <Button
                          icon={<TimesIcon />}
                          variant="plain"
                          onClick={() => {
                            chipFilter.values = chipFilter.values.filter(val => val.v !== chipFilterValue.v);
                            if (_.isEmpty(chipFilter.values)) {
                              setFiltersList(removeFromFilters(filters.list, chipFilter));
                            } else {
                              setFilters(_.cloneDeep(filters));
                            }
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                {!isForced && (
                  <Button
                    icon={<TimesCircleIcon />}
                    variant="plain"
                    onClick={() => setFiltersList(removeFromFilters(filters.list, chipFilter))}
                  />
                )}
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
                enabled: defaultFilters.length > 0 && !isDefaultFilters
              },
              {
                id: 'clear-all-filters',
                label: t('Clear all'),
                onClick: () => {
                  clearFilters();
                  autoCompleteCache.clear();
                },
                enabled: !_.isEmpty(chipFilters)
              },
              {
                id: 'swap-filters',
                label: t('Swap'),
                tooltip: t('Swap source and destination filters'),
                onClick: swapSrcDst,
                enabled: isSrcDst
              },
              {
                id: 'back-and-forth',
                label: filters?.backAndForth ? t('Back and forth') : t('One way'),
                onClick: toggleBackAndForth,
                icon: filters?.backAndForth ? (
                  <>
                    <LongArrowAltUpIcon />
                    <LongArrowAltDownIcon />
                  </>
                ) : (
                  <LongArrowAltUpIcon />
                ),
                tooltip: (
                  <div className="netobserv-tooltip-text">
                    <Content component={ContentVariants.p}>
                      {t('Switch between one way / back and forth filtering')}
                    </Content>
                    <Content component={ContentVariants.p} className="netobserv-align-start">
                      - {t('One way shows traffic strictly as defined per your filters')}
                    </Content>
                    <Content component={ContentVariants.p} className="netobserv-align-start">
                      - {t('Back and forth shows traffic according to your filters, plus the related return traffic')}
                    </Content>
                  </div>
                ),
                enabled: isSrcDst
              }
            ]}
          />
        </>
      )}
    </ToolbarGroup>
  );
};
