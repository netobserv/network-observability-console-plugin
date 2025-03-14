import {
  Content,
  ContentVariants,
  Dropdown,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Tooltip
} from '@patternfly/react-core';
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

export interface TimeRangeDropdownProps {
  range: number | TimeRange;
  setRange: (v: number) => void;
  openCustomModal: () => void;
  id?: string;
}

export const customTimeRangeKey = 'CUSTOM_TIME_RANGE_KEY';

export const TimeRangeDropdown: React.FC<TimeRangeDropdownProps> = ({ id, range, setRange, openCustomModal }) => {
  const [isOpen, setOpen] = React.useState<boolean>(false);
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
          <div className="netobserv-tooltip-text">
            <Content component={ContentVariants.p}>{`${t('From')} ${fromText}`}</Content>
            <Content component={ContentVariants.p}>{`${t('To')} ${toText}`}</Content>
          </div>
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
    <Tooltip
      trigger={selectedKey === customTimeRangeKey ? 'mouseenter focus' : ''}
      position="top"
      content={textContent()}
    >
      <Dropdown
        data-test={id}
        id={id}
        isOpen={isOpen}
        onSelect={() => setOpen(false)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            data-test={`${id}-dropdown`}
            id={`${id}-dropdown`}
            onClick={() => setOpen(!isOpen)}
            onBlur={() => setTimeout(() => setOpen(false), 500)}
          >
            {selectedKey === customTimeRangeKey
              ? textContent(false)
              : timeRangeOptions[selectedKey as keyof typeof timeRangeOptions]}
          </MenuToggle>
        )}
      >
        {_.map(timeRangeOptions, (name, key) => (
          <DropdownItem data-test={key} id={key} component="button" key={key} onClick={() => onChange(key)}>
            {name}
          </DropdownItem>
        ))}
      </Dropdown>
    </Tooltip>
  );
};

export default TimeRangeDropdown;
