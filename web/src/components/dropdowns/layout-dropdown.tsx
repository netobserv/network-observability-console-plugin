import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutName } from '../../model/topology';
import { Feature, isAllowed } from '../../utils/features-gate';

export interface LayoutDropdownProps {
  selected: LayoutName;
  setLayout: (l: LayoutName) => void;
  id?: string;
  appendTo?: () => HTMLElement;
}

export const LayoutDropdown: React.FC<LayoutDropdownProps> = ({ selected, setLayout, id, appendTo }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const getLayoutDisplay = (layoutName: LayoutName) => {
    switch (layoutName) {
      case LayoutName.threeD:
        return t('3D');
      case LayoutName.breadthFirst:
        return t('BreadthFirst');
      case LayoutName.cola:
        return t('Cola');
      case LayoutName.colaGroups:
        return t('ColaGroups');
      case LayoutName.colaNoForce:
        return t('ColaNoForce');
      case LayoutName.concentric:
        return t('Concentric');
      case LayoutName.dagre:
        return t('Dagre');
      case LayoutName.dagreGroup:
        return t('DagreGroup');
      case LayoutName.force:
        return t('Force');
      case LayoutName.grid:
        return t('Grid');
      default:
        return t('Invalid');
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
          {getLayoutDisplay(selected)}
        </MenuToggle>
      )}
    >
      {Object.values(LayoutName)
        .filter(v => v != LayoutName.threeD || isAllowed(Feature.ThreeD))
        .map(v => (
          <DropdownItem
            data-test={v}
            id={v}
            key={v}
            onClick={() => {
              setOpen(false);
              setLayout(v);
            }}
          >
            {getLayoutDisplay(v)}
          </DropdownItem>
        ))}
    </Dropdown>
  );
};

export default LayoutDropdown;
