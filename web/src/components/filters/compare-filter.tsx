import { Dropdown, DropdownItem, DropdownToggle, DropdownToggleAction } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { usePrevious } from '../../utils/previous-hook';
import { FilterComponent } from '../../model/filters';

export enum FilterCompare {
  EQUAL = 1,
  NOT_EQUAL,
  MORE_THAN_OR_EQUAL
}
export interface CompareFilterProps {
  value: FilterCompare;
  setValue: (newState: FilterCompare) => void;
  component?: FilterComponent;
}

export const CompareFilter: React.FC<CompareFilterProps> = ({ value, setValue, component }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setIsOpen] = React.useState(false);
  const prevComponent = usePrevious(component);

  const dropdownItems = [
    <DropdownItem key="equal" id="equal" component="button" onClick={() => onSelect(FilterCompare.EQUAL)}>
      {t('Equals')}
    </DropdownItem>,
    <DropdownItem key="not-equal" id="not-equal" component="button" onClick={() => onSelect(FilterCompare.NOT_EQUAL)}>
      {t('Not equals')}
    </DropdownItem>
  ];

  if (component === 'number') {
    dropdownItems.push(
      <DropdownItem
        key="more-than"
        id="more-than"
        component="button"
        onClick={() => onSelect(FilterCompare.MORE_THAN_OR_EQUAL)}
      >
        {t('More than')}
      </DropdownItem>
    );
  }

  const onToggle = (v: boolean) => {
    setIsOpen(v);
  };

  const onSelect = (v: FilterCompare) => {
    setValue(v);
    setIsOpen(false);
  };

  const onSwitch = React.useCallback(() => {
    const filterCompareValues = [FilterCompare.EQUAL, FilterCompare.NOT_EQUAL];
    if (component === 'number') {
      filterCompareValues.push(FilterCompare.MORE_THAN_OR_EQUAL);
    }

    const nextIndex = filterCompareValues.indexOf(value) + 1;
    if (nextIndex < filterCompareValues.length) {
      setValue(filterCompareValues[nextIndex]);
    } else {
      setValue(filterCompareValues[0]);
    }
  }, [component, value, setValue]);

  const getSymbol = React.useCallback(() => {
    switch (value) {
      case FilterCompare.NOT_EQUAL:
        return '!=';
      case FilterCompare.MORE_THAN_OR_EQUAL:
        return '>=';
      case FilterCompare.EQUAL:
      default:
        return '=';
    }
  }, [value]);

  React.useEffect(() => {
    // reset to equal when component change
    if (prevComponent !== undefined && prevComponent !== component) {
      setValue(FilterCompare.EQUAL);
    }
  }, [component, prevComponent, setValue]);

  return (
    <>
      <Dropdown
        toggle={
          <DropdownToggle
            id="filter-compare-toggle-button"
            splitButtonItems={[
              <DropdownToggleAction key="action" id="filter-compare-switch-button" onClick={onSwitch}>
                {getSymbol()}
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
