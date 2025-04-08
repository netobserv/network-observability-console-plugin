import { Checkbox, Radio, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export type Size = 's' | 'm' | 'l';

export interface TableDisplayOptionsProps {
  size: Size;
  setSize: (v: Size) => void;
  showDuplicates: boolean;
  setShowDuplicates: (showDuplicates: boolean) => void;
}

export const TableDisplayOptions: React.FC<TableDisplayOptionsProps> = ({
  size,
  setSize,
  showDuplicates,
  setShowDuplicates
}) => {
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
            <Text component={TextVariants.p}>
              {t('Row size')} <InfoAltIcon />
            </Text>
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
      <div className="pf-c-select__menu-group">
        <Tooltip
          content={t(
            // eslint-disable-next-line max-len
            'A flow might be reported from both source and destination nodes, making it appear several times. By default, duplicates are merged, but you can show them in order to get more granular data.'
          )}
        >
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Duplicated flows')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <label className="pf-c-select__menu-item">
          <Checkbox
            isChecked={showDuplicates}
            name={'show-duplicates'}
            onChange={() => setShowDuplicates(!showDuplicates)}
            label={t('Show duplicates')}
            data-test={'show-duplicates'}
            id={'show-duplicates'}
          />
        </label>
      </div>
    </>
  );
};

export default TableDisplayOptions;
