import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox, OptionsMenu, OptionsMenuItem, OptionsMenuPosition, OptionsMenuToggle } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { Filter } from '../../model/filters';
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
}

const srcFilter: FilterDir = 'src';
const dstFilter: FilterDir = 'dst';

export const SummaryFilterButton: React.FC<SummaryFilterButtonProps> = ({
  id,
  filterType,
  fields,
  activeFilters,
  setFilters
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);

  const selected = [srcFilter, dstFilter].filter(dir =>
    isDirElementFiltered(filterType, fields, dir, activeFilters, t)
  );

  const onSelect = (dir: FilterDir, e: React.BaseSyntheticEvent) => {
    toggleDirElementFilter(filterType, fields, dir, selected.includes(dir), activeFilters, setFilters, t);
    e.preventDefault();
  };

  const menuItem = (id: FilterDir, label: string) => (
    <OptionsMenuItem id={id} key={id} onSelect={e => onSelect(id, e!)}>
      <Checkbox
        id={id + '-checkbox'}
        label={label}
        isChecked={selected.includes(id)}
        onChange={(_, e) => onSelect(id, e)}
      />
    </OptionsMenuItem>
  );

  return (
    <OptionsMenu
      id={id}
      className={'summary-filter-menu'}
      data-test={id}
      toggle={<OptionsMenuToggle toggleTemplate={<FilterIcon />} onToggle={setIsOpen} hideCaret />}
      menuItems={[menuItem('src', t('Source')), menuItem('dst', t('Destination'))]}
      isOpen={isOpen}
      position={OptionsMenuPosition.right}
      isPlain
    />
  );
};
