import { MenuToggle, Select, SelectList, SelectOption } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyMetricPeer } from '../../../api/loki';
import { Filter, FilterDefinition } from '../../../model/filters';
import { NodeType } from '../../../model/flow-query';
import { FilterDir, isDirElementFiltered, toggleDirElementFilter } from '../../../model/topology';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import './summary-filter-button.css';

export interface SummaryFilterButtonProps {
  id: string;
  filterType: NodeType;
  fields: Partial<TopologyMetricPeer>;
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
  filterDefinitions: FilterDefinition[];
}

const srcFilter: FilterDir = 'src';
const dstFilter: FilterDir = 'dst';

export const SummaryFilterButton: React.FC<SummaryFilterButtonProps> = ({
  id,
  filterType,
  fields,
  activeFilters,
  setFilters,
  filterDefinitions
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState(false);
  const selected = [srcFilter, dstFilter].filter(dir =>
    isDirElementFiltered(filterType, fields, dir, activeFilters, filterDefinitions)
  );

  const onSelect = (dir: FilterDir, e?: React.BaseSyntheticEvent) => {
    toggleDirElementFilter(
      filterType,
      fields,
      dir,
      selected.includes(dir),
      activeFilters,
      setFilters,
      filterDefinitions
    );
    if (e && e.preventDefault) {
      e.preventDefault();
    }
  };

  const menuItem = (id: FilterDir, label: string) => (
    <SelectOption id={id} key={id} value={id} hasCheckbox isSelected={selected.includes(id)}>
      {label}
    </SelectOption>
  );

  return (
    <Select
      isOpen={isOpen}
      ref={ref}
      toggle={toggleRef => (
        <MenuToggle
          ref={toggleRef}
          className="summary-filters-toggle"
          onClick={() => setOpen(!isOpen)}
          isExpanded={isOpen}
          variant="plain"
        >
          <FilterIcon />
        </MenuToggle>
      )}
      popperProps={{
        position: 'right'
      }}
      id={id}
      selected={selected}
      onSelect={(event, value) => value && onSelect(value as FilterDir, event)}
    >
      <SelectList className="summary-filters-list">
        {menuItem('src', t('Source'))}
        {menuItem('dst', t('Destination'))}
      </SelectList>
    </Select>
  );
};
