import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, MenuToggle, SelectList, SelectOption } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { Filter, FilterDefinition } from '../../model/filters';
import { FilterDir, isDirElementFiltered, toggleDirElementFilter } from '../../model/topology';
import { TopologyMetricPeer } from '../../api/loki';
import { NodeType } from '../../model/flow-query';
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
  const [isOpen, setIsOpen] = React.useState(false);

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
    e?.preventDefault();
  };

  const menuItem = (id: FilterDir, label: string) => (
    <SelectOption id={id} key={id} value={id} hasCheckbox isSelected={selected.includes(id)}>
      {label}
    </SelectOption>
  );

  return (
    <Select
      isOpen={isOpen}
      toggle={toggleRef => (
        <MenuToggle ref={toggleRef} onClick={() => setIsOpen(!isOpen)} isExpanded={isOpen} variant="plain">
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
      <SelectList>
        {menuItem('src', t('Source'))}
        {menuItem('dst', t('Destination'))}
      </SelectList>
    </Select>
  );
};
