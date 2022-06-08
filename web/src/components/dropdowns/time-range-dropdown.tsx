import { Dropdown, DropdownItem, DropdownToggle, Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getFormattedDate, getTimeRangeOptions, TimeRange } from '../../utils/datetime';
import {
  formatDuration,
  getDateFromSecondsString,
  getDateMsInSeconds,
  getDateSInMiliseconds,
  parseDuration
} from '../../utils/duration';

export type TimeRangeDropdownProps = {
  range: number | TimeRange;
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
  const selectedKey = typeof range !== 'number' ? CUSTOM_TIME_RANGE_KEY : formatDuration(getDateSInMiliseconds(range));

  const textContent = () => {
    if (selectedKey === CUSTOM_TIME_RANGE_KEY) {
      const timeRange = range as TimeRange;
      const from = getDateFromSecondsString(timeRange.from?.toString());
      const to = getDateFromSecondsString(timeRange.to?.toString());
      return (
        <>
          {`${t('From')} ${getFormattedDate(from)}`}
          <br />
          {`${t('To')} ${getFormattedDate(to)}`}
        </>
      );
    } else {
      return;
    }
  };

  return (
    <Dropdown
      data-test={id}
      id={id}
      dropdownItems={_.map(timeRangeOptions, (name, key) => (
        <DropdownItem data-test={key} id={key} component="button" key={key} onClick={() => onChange(key)}>
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      toggle={
        <Tooltip
          trigger={selectedKey === CUSTOM_TIME_RANGE_KEY ? 'mouseenter focus' : ''}
          position="top"
          content={textContent()}
        >
          <DropdownToggle data-test={`${id}-dropdown`} id={`${id}-dropdown`} onToggle={() => setIsOpen(!isOpen)}>
            {timeRangeOptions[selectedKey as keyof typeof timeRangeOptions]}
          </DropdownToggle>
        </Tooltip>
      }
    />
  );
};

export default TimeRangeDropdown;
