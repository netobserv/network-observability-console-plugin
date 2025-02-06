import { Radio, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export type Size = 's' | 'm' | 'l';

export interface TableDisplayOptionsProps {
  size: Size;
  setSize: (v: Size) => void;
}

export const TableDisplayOptions: React.FC<TableDisplayOptionsProps> = ({ size, setSize }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const sizeOptions = {
    s: t('Compact'),
    m: t('Normal'),
    l: t('Large')
  };

  return (
    <>
      <div className="pf-v5-c-menu__group">
        <Tooltip content={t('Force table rows to specific sizing.')}>
          <div className="pf-v5-c-menu__group-title">
            <Text component={TextVariants.p}>
              {t('Row size')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        {_.map(sizeOptions, (name, key) => {
          return (
            <div key={`size-${key}`}>
              <label className="display-dropdown-padding pf-v5-c-menu__menu-item">
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

export default TableDisplayOptions;
