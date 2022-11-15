import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OptionsMenu, OptionsMenuItem, OptionsMenuPosition, OptionsMenuToggle } from '@patternfly/react-core';
import { FilterIcon } from '@patternfly/react-icons';
import { Filter } from '../../model/filters';
import { FilterDir, isElementFiltered, toggleElementFilter } from '../../model/topology';
import { TopologyMetricPeer } from '../../api/loki';
import { NodeType } from '../../model/flow-query';

export interface SummaryFilterButtonProps {
  id: string;
  filterType: NodeType;
  fields: Partial<TopologyMetricPeer>;
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
}

const srcFilter: FilterDir = 'src';
const dstFilter: FilterDir = 'dst';
const anyFilter: FilterDir = 'any';

export const SummaryFilterButton: React.FC<SummaryFilterButtonProps> = ({
  id,
  filterType,
  fields,
  activeFilters,
  setFilters
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);

  const selected = [srcFilter, dstFilter, anyFilter].filter(dir =>
    isElementFiltered(filterType, fields, dir, activeFilters, t)
  );

  const onSelect = (dir: FilterDir) => {
    toggleElementFilter(filterType, fields, dir, selected.includes(dir), activeFilters, setFilters, t);
  };

  const menuItem = (id: FilterDir, label: string) => (
    <OptionsMenuItem id={id} key={id} isSelected={selected.includes(id)} onSelect={() => onSelect(id)}>
      {label}
    </OptionsMenuItem>
  );

  return (
    <OptionsMenu
      id={id}
      data-test={id}
      toggle={<OptionsMenuToggle toggleTemplate={<FilterIcon />} onToggle={setIsOpen} hideCaret />}
      menuItems={[menuItem('src', t('Source')), menuItem('dst', t('Destination')), menuItem('any', t('Common'))]}
      isOpen={isOpen}
      position={OptionsMenuPosition.right}
      isPlain
    />
  );
};
