import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle, DropdownItem, Text } from '@patternfly/react-core';
import { ThIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';

export type Size = 's' | 'm' | 'l';

type Props = {
  setSize: (v: Size) => void;
  id?: string;
};

export const DisplayDropdown: React.FC<Props> = ({ id, setSize }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__netobserv-plugin');

  const sizeOptions = {
    s: t('Compact'),
    m: t('Normal'),
    l: t('Large')
  };

  return (
    <Dropdown
      data-test={id}
      id={id}
      isPlain
      dropdownItems={_.map(sizeOptions, (name, key) => (
        <DropdownItem data-test={key} id={key} component="button" key={key} onClick={() => setSize(key as Size)}>
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      toggle={
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          className="overflow-button"
          icon={<ThIcon />}
          toggleIndicator={null}
          onToggle={() => setIsOpen(!isOpen)}
        >
          <Text>{t('Display')}</Text>
        </DropdownToggle>
      }
    />
  );
};

export default DisplayDropdown;
