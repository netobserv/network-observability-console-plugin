import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { formatDuration, parseDuration } from '../../utils/duration';

export interface RefreshDropdownProps {
  disabled?: boolean;
  interval?: number;
  setInterval: (v?: number) => void;
  id?: string;
}

const offKey = 'OFF_KEY';

export const RefreshDropdown: React.FC<RefreshDropdownProps> = ({ disabled, id, interval, setInterval }) => {
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__netobserv-plugin');

  const onChange = React.useCallback(
    (v: string) => setInterval(v === offKey ? undefined : parseDuration(v)),
    [setInterval]
  );

  const refreshOptions = {
    OFF_KEY: t('Refresh off'),
    '15s': t('15 seconds'),
    '30s': t('30 seconds'),
    '1m': t('1 minute'),
    '5m': t('5 minutes'),
    '15m': t('15 minutes'),
    '30m': t('30 minutes'),
    '1h': t('1 hour'),
    '2h': t('2 hours'),
    '1d': t('1 day')
  };

  const selectedKey = interval === undefined ? offKey : formatDuration(interval);

  //unselect interval when dropdown is disabled
  React.useEffect(() => {
    if (disabled && interval) {
      setInterval(undefined);
    }
  }, [disabled, interval, setInterval]);

  return (
    <div id={`${id}-container`}>
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
            isDisabled={disabled}
            onClick={() => setOpen(!isOpen)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            isExpanded={isOpen}
          >
            {refreshOptions[selectedKey as keyof typeof refreshOptions]}
          </MenuToggle>
        )}
      >
        {_.map(refreshOptions, (name, key) => (
          <DropdownItem data-test={key} id={key} component="button" key={key} onClick={() => onChange(key)}>
            {name}
          </DropdownItem>
        ))}
      </Dropdown>
    </div>
  );
};

export default RefreshDropdown;
