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
  showDuplicates: boolean;
  setShowDuplicates: (showDuplicates: boolean) => void;
}

export const TableDisplayDropdown: React.FC<TableDisplayDropdownProps> = ({
  size,
  setSize,
  showDuplicates,
  setShowDuplicates
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container" ref={ref}>
      <Select
        id="table-display-dropdown"
        placeholder={t('Display options')}
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
            {t('Display options')}
          </MenuToggle>
        )}
      >
        <TableDisplayOptions
          size={size}
          setSize={setSize}
          showDuplicates={showDuplicates}
          setShowDuplicates={setShowDuplicates}
        />
      </Select>
    </div>
  );
};

export default TableDisplayDropdown;
