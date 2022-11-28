import * as React from 'react';
import _ from 'lodash';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { QuickFilter } from '../../model/quick-filters';
import { doesIncludeFilter, Filter, findFromFilters, removeFromFilters } from '../../model/filters';
import { useTranslation } from 'react-i18next';

export interface QuickFiltersProps {
  quickFilters: QuickFilter[];
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({ quickFilters, activeFilters, setFilters }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedList, setSelectedList] = React.useState([] as string[]);

  React.useEffect(() => {
    // Init seletected filters: a quick filter is selected when every filter it contains is included in active filters
    const selected = quickFilters
      .filter(qf => {
        return qf.filters.every(qff => doesIncludeFilter(activeFilters, qff, qff.values));
      })
      .map(qf => qf.name);
    setSelectedList(selected);
  }, [quickFilters, activeFilters]);

  const onSelect = (__: unknown, selectedName: string) => {
    const selected = quickFilters.find(qf => qf.name === selectedName);
    if (!selected) {
      return;
    }
    const isDelete = selectedList.includes(selectedName);
    let newFilters = _.cloneDeep(activeFilters);
    selected.filters.forEach(qf => {
      const found = findFromFilters(newFilters, qf);
      if (found) {
        if (isDelete) {
          // Remove all quick-filter values from the active filter values
          const qfValues = qf.values.map(v => v.v);
          found.values = found.values.filter(v => !qfValues.includes(v.v));
          if (found.values.length === 0) {
            newFilters = removeFromFilters(newFilters, qf);
          }
        } else {
          // Add all quick-filter values into the active filter if they're not already there
          qf.values.forEach(val => {
            if (!found.values.map(v => v.v).includes(val.v)) {
              found.values.push(val);
            }
          });
        }
      } else {
        newFilters.push(_.cloneDeep(qf));
      }
    });
    setFilters(newFilters);
  };

  return (
    <Select
      data-test="quick-filters-dropdown"
      id="quick-filters-dropdown"
      variant={SelectVariant.checkbox}
      onToggle={setIsOpen}
      onSelect={onSelect}
      placeholderText={
        <>
          <FilterIcon /> {t('Quick filters')}
        </>
      }
      selections={selectedList}
      isOpen={isOpen}
    >
      {quickFilters.map(qf => {
        return (
          <SelectOption key={qf.name} value={qf.name}>
            {qf.name}
          </SelectOption>
        );
      })}
    </Select>
  );
};
