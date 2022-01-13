import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { parseDuration, formatDuration, getDateMsInSeconds, getDateSInMiliseconds } from '../utils/duration';
import * as _ from 'lodash';

export type TimeRangeDropdownProps = {
  range?: number;
  setRange: (v: number) => void;
  openCustomModal: () => void;
  id?: string;
};

const CUSTOM_TIME_RANGE_KEY = 'CUSTOM_TIME_RANGE_KEY';

export const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({ id, range, setRange, openCustomModal }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onChange = React.useCallback(
    (v: string) => {
      if (v === CUSTOM_TIME_RANGE_KEY) {
        openCustomModal();
      } else {
        setRange(getDateMsInSeconds(parseDuration(v)));
      }
    },
    [setRange, openCustomModal]
  );

  const timeRangeOptions = {
    [CUSTOM_TIME_RANGE_KEY]: t('Custom time range'),
    '5m': t('Last {{count}} minute', { count: 5 }),
    '15m': t('Last {{count}} minute', { count: 15 }),
    '30m': t('Last {{count}} minute', { count: 30 }),
    '1h': t('Last {{count}} hour', { count: 1 }),
    '2h': t('Last {{count}} hour', { count: 2 }),
    '6h': t('Last {{count}} hour', { count: 6 }),
    '12h': t('Last {{count}} hour', { count: 12 }),
    '1d': t('Last {{count}} day', { count: 1 }),
    '2d': t('Last {{count}} day', { count: 2 }),
    '1w': t('Last {{count}} week', { count: 1 }),
    '2w': t('Last {{count}} week', { count: 2 })
  };

  const selectedKey = range === undefined ? CUSTOM_TIME_RANGE_KEY : formatDuration(getDateSInMiliseconds(range));

  return (
    <Dropdown
      id={id}
      dropdownItems={_.map(timeRangeOptions, (name, key) => (
        <DropdownItem id={key} component="button" key={key} onClick={() => onChange(key)}>
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      toggle={
        <DropdownToggle id={`${id}-dropdown`} onToggle={() => setIsOpen(!isOpen)}>
          {timeRangeOptions[selectedKey as keyof typeof timeRangeOptions]}
        </DropdownToggle>
      }
    />
  );
};

export default TimeRangeDropdown;
