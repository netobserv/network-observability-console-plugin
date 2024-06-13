import { Dropdown, DropdownItem, DropdownToggle, Tooltip } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { dateFormatter, getFormattedDate, getTimeRangeOptions, timeFormatter, TimeRange } from '../../utils/datetime';
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

export const customTimeRangeKey = 'CUSTOM_TIME_RANGE_KEY';

export const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({ id, range, setRange, openCustomModal }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__netobserv-plugin');

  const onChange = React.useCallback(
    (v: string) => {
      if (v === customTimeRangeKey) {
        openCustomModal();
      } else {
        setRange(getDateMsInSeconds(parseDuration(v)));
      }
    },
    [setRange, openCustomModal]
  );

  const timeRangeOptions = getTimeRangeOptions(t);
  const selectedKey = typeof range !== 'number' ? customTimeRangeKey : formatDuration(getDateSInMiliseconds(range));

  const textContent = (prettyPrint = true) => {
    if (selectedKey === customTimeRangeKey) {
      const timeRange = range as TimeRange;
      const from = getDateFromSecondsString(timeRange.from?.toString());
      const fromText = getFormattedDate(from);

      const to = getDateFromSecondsString(timeRange.to?.toString());
      let toText = getFormattedDate(to);
      if (prettyPrint) {
        return (
          <>
            {`${t('From')} ${fromText}`}
            <br />
            {`${t('To')} ${toText}`}
          </>
        );
      } else {
        //remove common part of date if possible
        if (getFormattedDate(from, dateFormatter) === getFormattedDate(to, dateFormatter)) {
          toText = getFormattedDate(to, timeFormatter);
        }
        return `${fromText} - ${toText}`;
      }
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
          trigger={selectedKey === customTimeRangeKey ? 'mouseenter focus' : ''}
          position="top"
          content={textContent()}
        >
          <DropdownToggle data-test={`${id}-dropdown`} id={`${id}-dropdown`} onToggle={() => setIsOpen(!isOpen)}>
            {selectedKey === customTimeRangeKey
              ? textContent(false)
              : timeRangeOptions[selectedKey as keyof typeof timeRangeOptions]}
          </DropdownToggle>
        </Tooltip>
      }
    />
  );
};

export default TimeRangeDropdown;
