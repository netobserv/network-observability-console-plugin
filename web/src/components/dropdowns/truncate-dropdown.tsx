import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export enum TruncateLength {
  OFF = 0,
  XS = 10,
  S = 20,
  M = 25,
  L = 30,
  XL = 40
}

export interface TruncateDropdownProps {
  selected: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  id?: string;
}

export const TruncateDropdown: React.FC<TruncateDropdownProps> = ({ selected, setTruncateLength, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [truncateDropdownOpen, setTruncateDropdownOpen] = React.useState(false);

  const getTruncateDisplay = (v: TruncateLength) => {
    switch (v) {
      case TruncateLength.XL:
        return t('XL');
      case TruncateLength.L:
        return t('L');
      case TruncateLength.M:
        return t('M');
      case TruncateLength.S:
        return t('S');
      case TruncateLength.XS:
        return t('XS');
      default:
        return t('None');
    }
  };

  return (
    <Dropdown
      data-test={id}
      id={id}
      toggle={
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          onToggle={() => setTruncateDropdownOpen(!truncateDropdownOpen)}
        >
          {getTruncateDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={truncateDropdownOpen}
      dropdownItems={[
        TruncateLength.OFF,
        TruncateLength.XS,
        TruncateLength.S,
        TruncateLength.M,
        TruncateLength.L,
        TruncateLength.XL
      ].map((v: TruncateLength) => (
        <DropdownItem
          data-test={String(v)}
          id={String(v)}
          key={v}
          onClick={() => {
            setTruncateDropdownOpen(false);
            setTruncateLength(v);
          }}
        >
          {getTruncateDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default TruncateDropdown;
