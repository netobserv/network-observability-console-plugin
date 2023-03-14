import { Radio, Select, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import './table-display-dropdown.css';

export type Size = 's' | 'm' | 'l';

export const TableDisplayOptions: React.FC<{
  size: Size;
  setSize: (v: Size) => void;
}> = ({ size, setSize }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const sizeOptions = {
    s: t('Compact'),
    m: t('Normal'),
    l: t('Large')
  };

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Force table rows to specific sizing.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Row size')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        {_.map(sizeOptions, (name, key) => {
          return (
            <div key={`size-${key}`}>
              <label className="pf-c-select__menu-item">
                <Radio
                  isChecked={key === size}
                  name={`size-${key}`}
                  onChange={() => setSize(key as Size)}
                  label={name}
                  data-test={`size-${key}`}
                  id={`size-${key}`}
                  value={key}
                />
              </label>
            </div>
          );
        })}
      </div>
    </>
  );
};

export const TableDisplayDropdown: React.FC<{
  size: Size;
  setSize: (v: Size) => void;
}> = ({ size, setSize }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="table-display-dropdown"
        placeholderText={<span>{t('Display options')}</span>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={<TableDisplayOptions size={size} setSize={setSize} />}
      />
    </div>
  );
};

export default TableDisplayDropdown;
