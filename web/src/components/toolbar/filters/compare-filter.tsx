import { Badge, Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
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

  const getText = React.useCallback(
    (v: FilterCompare) => {
      switch (v) {
        case FilterCompare.notEqual:
          return t('Not equals');
        case FilterCompare.moreThanOrEqual:
          return t('More than');
        case FilterCompare.equal:
        default:
          return t('Equals');
      }
    },
    [t]
  );

  const getSymbol = React.useCallback((v: FilterCompare) => {
    switch (v) {
      case FilterCompare.notEqual:
        return '!=';
      case FilterCompare.moreThanOrEqual:
        return '>=';
      case FilterCompare.equal:
      default:
        return '=';
    }
  }, []);

  const onSelect = React.useCallback(
    (v: FilterCompare) => {
      setValue(v);
      setOpen(false);
    },
    [setValue]
  );

  const getItems = React.useCallback(() => {
    const dropdownItems = [
      <DropdownItem
        key="equal"
        id="equal"
        component="button"
        description={getText(FilterCompare.equal)}
        onClick={() => onSelect(FilterCompare.equal)}
      >
        {getSymbol(FilterCompare.equal)}
      </DropdownItem>,
      <DropdownItem
        key="not-equal"
        id="not-equal"
        component="button"
        description={getText(FilterCompare.notEqual)}
        onClick={() => onSelect(FilterCompare.notEqual)}
      >
        {getSymbol(FilterCompare.notEqual)}
      </DropdownItem>
    ];

    if (component === 'number') {
      dropdownItems.push(
        <DropdownItem
          key="more-than"
          id="more-than"
          component="button"
          description={getText(FilterCompare.moreThanOrEqual)}
          onClick={() => onSelect(FilterCompare.moreThanOrEqual)}
        >
          {getSymbol(FilterCompare.moreThanOrEqual)}
        </DropdownItem>
      );
    }
    return dropdownItems;
  }, [component, getSymbol, getText, onSelect]);

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
            badge={<Badge>{getSymbol(value)}</Badge>}
            onClick={() => setOpen(!isOpen)}
            isExpanded={isOpen}
            onBlur={() => setTimeout(() => setOpen(false), 500)}
          >
            {getText(value)}
          </MenuToggle>
        )}
      >
        {getItems()}
      </Dropdown>
    </>
  );
};

export default CompareFilter;
