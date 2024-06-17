import { Select, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import './table-display-dropdown.css';
import { TableDisplayOptions } from './table-display-options';

export type Size = 's' | 'm' | 'l';

export interface TableDisplayDropdownProps {
  size: Size;
  setSize: (v: Size) => void;
}

export const TableDisplayDropdown: React.FC<TableDisplayDropdownProps> = ({ size, setSize }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="table-display-dropdown"
        placeholderText={<Text component={TextVariants.p}>{t('Display options')}</Text>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={<TableDisplayOptions size={size} setSize={setSize} />}
      />
    </div>
  );
};

export default TableDisplayDropdown;
