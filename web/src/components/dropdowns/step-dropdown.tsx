import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getStepOptions, TimeRange } from '../../utils/datetime';
import {
  formatDuration,
  getDateMsInSeconds,
  getDateSInMiliseconds,
  isStepDurationOutsideRange,
  parseDuration
} from '../../utils/duration';

export type StepDropdownProps = {
  range: number | TimeRange;
  step: number;
  setStep: (v: number) => void;
  id?: string;
};

export const StepDropdown: React.FC<StepDropdownProps> = ({ id, range, step, setStep }) => {
  const [isOpen, setIsOpen] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__netobserv-plugin');

  const isDisabled = React.useCallback(
    (v: string) => {
      return isStepDurationOutsideRange(range, v);
    },
    [range]
  );

  const onChange = React.useCallback(
    (v: string) => {
      setStep(getDateMsInSeconds(parseDuration(v)));
    },
    [setStep]
  );

  const stepOptions = getStepOptions(t);
  const selectedKey = formatDuration(getDateSInMiliseconds(step));

  return (
    <Dropdown
      data-test={id}
      id={id}
      dropdownItems={_.map(stepOptions, (name, key) => (
        <DropdownItem
          data-test={key}
          id={key}
          disabled={isDisabled(key)}
          component="button"
          key={key}
          onClick={() => !isDisabled(key) && onChange(key)}
        >
          {name}
        </DropdownItem>
      ))}
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      toggle={
        <DropdownToggle data-test={`${id}-dropdown`} id={`${id}-dropdown`} onToggle={() => setIsOpen(!isOpen)}>
          {stepOptions[selectedKey as keyof typeof stepOptions]}
        </DropdownToggle>
      }
    />
  );
};

export default StepDropdown;
