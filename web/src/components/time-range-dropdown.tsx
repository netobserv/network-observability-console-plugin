import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Dropdown, DropdownToggle, DropdownItem } from '@patternfly/react-core';
import { parseDuration, formatDuration, getDateMsInSeconds, getDateSInMiliseconds } from '../utils/duration';
import { getTimeRangeOptions } from '../utils/datetime';
import * as _ from 'lodash';

export type TimeRangeDropdownProps = {
  range?: number;
  setRange: (v: number) => void;
  openCustomModal: () => void;
  id?: string;
};

export const CUSTOM_TIME_RANGE_KEY = 'CUSTOM_TIME_RANGE_KEY';

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

  const timeRangeOptions = getTimeRangeOptions(t);
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
