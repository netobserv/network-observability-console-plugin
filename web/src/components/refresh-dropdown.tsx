import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { parseDuration, formatDuration } from '../utils/duration';
import * as _ from 'lodash';

type Props = {
  interval: number;
  setInterval: (v: number) => void;
  id?: string;
};

const OFF_KEY = 'OFF_KEY';

export const RefreshDropdown: React.FC<Props> = ({ id, interval, setInterval }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onChange = React.useCallback(
    (v: string) => setInterval(v === OFF_KEY ? null : parseDuration(v)),
    [setInterval]
  );

  const refreshOptions = {
    OFF_KEY: t('Refresh off'),
    '15s': t('{{count}} second', { count: 15 }),
    '30s': t('{{count}} second', { count: 30 }),
    '1m': t('{{count}} minute', { count: 1 }),
    '5m': t('{{count}} minute', { count: 5 }),
    '15m': t('{{count}} minute', { count: 15 }),
    '30m': t('{{count}} minute', { count: 30 }),
    '1h': t('{{count}} hour', { count: 1 }),
    '2h': t('{{count}} hour', { count: 2 }),
    '1d': t('{{count}} day', { count: 1 })
  };

  const selectedKey = interval === null ? OFF_KEY : formatDuration(interval);

  return (
    <Dropdown
      id={id}
      dropdownItems={_.map(refreshOptions, (name, key) => (
        <DropdownItem id={key} component="button" key={key} onClick={() => onChange(key)}>
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      toggle={
        <DropdownToggle id={`${id}-dropdown`} onToggle={() => setIsOpen(!isOpen)}>
          {refreshOptions[selectedKey]}
        </DropdownToggle>
      }
    />
  );
};

export default RefreshDropdown;
