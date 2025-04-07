import { MenuToggle, MenuToggleElement, Select } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useOutsideClickEvent } from '../../utils/outside-hook';
import './table-display-dropdown.css';
import { TableDisplayOptions } from './table-display-options';

export type Size = 's' | 'm' | 'l';

export interface TableDisplayDropdownProps {
  size: Size;
  setSize: (v: Size) => void;
}

export const TableDisplayDropdown: React.FC<TableDisplayDropdownProps> = ({ size, setSize }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <Select
      id="table-display-dropdown"
      placeholder={t('Display options')}
      ref={ref}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
          {t('Display options')}
        </MenuToggle>
      )}
    >
      <TableDisplayOptions size={size} setSize={setSize} />
    </Select>
  );
};

export default TableDisplayDropdown;
