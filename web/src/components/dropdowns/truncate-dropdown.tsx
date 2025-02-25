import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
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
  appendTo?: () => HTMLElement;
}

export const TruncateDropdown: React.FC<TruncateDropdownProps> = ({ selected, setTruncateLength, id, appendTo }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

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
      isOpen={isOpen}
      popperProps={{
        appendTo
      }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isExpanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          onBlur={() => setTimeout(() => setOpen(false), 500)}
        >
          {getTruncateDisplay(selected)}
        </MenuToggle>
      )}
    >
      {[
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
            setOpen(false);
            setTruncateLength(v);
          }}
        >
          {getTruncateDisplay(v)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default TruncateDropdown;
