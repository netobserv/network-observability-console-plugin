import { Dropdown, DropdownItem, MenuToggle, MenuToggleAction, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterComponent } from '../../../model/filters';
import { usePrevious } from '../../../utils/previous-hook';

export enum FilterCompare {
  equal = 1,
  notEqual,
  moreThanOrEqual
}
export interface CompareFilterProps {
  value: FilterCompare;
  setValue: (newState: FilterCompare) => void;
  component?: FilterComponent;
}

export const CompareFilter: React.FC<CompareFilterProps> = ({ value, setValue, component }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);
  const prevComponent = usePrevious(component);

  const dropdownItems = [
    <DropdownItem key="equal" id="equal" component="button" onClick={() => onSelect(FilterCompare.equal)}>
      {t('Equals')}
    </DropdownItem>,
    <DropdownItem key="not-equal" id="not-equal" component="button" onClick={() => onSelect(FilterCompare.notEqual)}>
      {t('Not equals')}
    </DropdownItem>
  ];

  if (component === 'number') {
    dropdownItems.push(
      <DropdownItem
        key="more-than"
        id="more-than"
        component="button"
        onClick={() => onSelect(FilterCompare.moreThanOrEqual)}
      >
        {t('More than')}
      </DropdownItem>
    );
  }

  const onSelect = (v: FilterCompare) => {
    setValue(v);
    setOpen(false);
  };

  const onSwitch = React.useCallback(() => {
    const filterCompareValues = [FilterCompare.equal, FilterCompare.notEqual];
    if (component === 'number') {
      filterCompareValues.push(FilterCompare.moreThanOrEqual);
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
      case FilterCompare.notEqual:
        return '!=';
      case FilterCompare.moreThanOrEqual:
        return '>=';
      case FilterCompare.equal:
      default:
        return '=';
    }
  }, [value]);

  React.useEffect(() => {
    // reset to equal when component change
    if (prevComponent !== undefined && prevComponent !== component) {
      setValue(FilterCompare.equal);
    }
  }, [component, prevComponent, setValue]);

  return (
    <>
      <Dropdown
        id="filter-compare"
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            id="filter-compare-toggle-button"
            splitButtonOptions={{
              variant: 'action',
              items: [
                <MenuToggleAction key="action" id="filter-compare-switch-button" onClick={onSwitch}>
                  {getSymbol()}
                </MenuToggleAction>
              ]
            }}
            onClick={() => setOpen(!isOpen)}
            isExpanded={isOpen}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
          />
        )}
      >
        {dropdownItems}
      </Dropdown>
    </>
  );
};

export default CompareFilter;
