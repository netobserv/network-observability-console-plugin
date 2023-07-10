import { Dropdown, DropdownItem, DropdownToggle, DropdownToggleAction } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export enum FilterCompare {
  EQUAL = 1,
  NOT_EQUAL
}

export interface CompareFilterProps {
  value: FilterCompare;
  setValue: (newState: FilterCompare) => void;
}

export const CompareFilter: React.FC<CompareFilterProps> = ({ value, setValue }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);

  const dropdownItems = [
    <DropdownItem key="equal" id="equal" component="button" onClick={() => onSelect(FilterCompare.EQUAL)}>
      {t('Equals')}
    </DropdownItem>,
    <DropdownItem key="not-equal" id="not-equal" component="button" onClick={() => onSelect(FilterCompare.NOT_EQUAL)}>
      {t('Not equals')}
    </DropdownItem>
  ];

  const onToggle = (v: boolean) => {
    setIsOpen(v);
  };

  const onSelect = (v: FilterCompare) => {
    setValue(v);
    setIsOpen(false);
  };

  const onSwitch = React.useCallback(() => {
    //TODO: implement new comparaisons and move to next item automatically
    const next = value === FilterCompare.EQUAL ? FilterCompare.NOT_EQUAL : FilterCompare.EQUAL;
    setValue(next);
  }, [value, setValue]);

  return (
    <>
      <Dropdown
        toggle={
          <DropdownToggle
            id="filter-compare-toggle-button"
            splitButtonItems={[
              <DropdownToggleAction key="action" id="filter-compare-switch-button" onClick={onSwitch}>
                {value === FilterCompare.EQUAL ? '=' : '!='}
              </DropdownToggleAction>
            ]}
            toggleVariant="default"
            splitButtonVariant="action"
            onToggle={onToggle}
          />
        }
        isOpen={isOpen}
        dropdownItems={dropdownItems}
      />
    </>
  );
};

export default CompareFilter;
