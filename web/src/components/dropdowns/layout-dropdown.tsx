import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutName } from '../../model/topology';
import { Feature, isAllowed } from '../../utils/features-gate';

export interface LayoutDropdownProps {
  selected: LayoutName;
  setLayout: (l: LayoutName) => void;
  id?: string;
}

export const LayoutDropdown: React.FC<LayoutDropdownProps> = ({ selected, setLayout, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [layoutDropdownOpen, setLayoutDropdownOpen] = React.useState(false);

  const getLayoutDisplay = (layoutName: LayoutName) => {
    switch (layoutName) {
      case LayoutName.threeD:
        return t('3D');
      case LayoutName.breadthFirst:
        return t('BreadthFirst');
      case LayoutName.cola:
        return t('Cola');
      case LayoutName.colaNoForce:
        return t('ColaNoForce');
      case LayoutName.concentric:
        return t('Concentric');
      case LayoutName.dagre:
        return t('Dagre');
      case LayoutName.force:
        return t('Force');
      case LayoutName.grid:
        return t('Grid');
      case LayoutName.colaGroups:
        return t('ColaGroups');
      default:
        return t('Invalid');
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
          onToggle={() => setLayoutDropdownOpen(!layoutDropdownOpen)}
        >
          {getLayoutDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={layoutDropdownOpen}
      dropdownItems={Object.values(LayoutName)
        .filter(v => v != LayoutName.threeD || isAllowed(Feature.ThreeD))
        .map(v => (
          <DropdownItem
            data-test={v}
            id={v}
            key={v}
            onClick={() => {
              setLayoutDropdownOpen(false);
              setLayout(v);
            }}
          >
            {getLayoutDisplay(v)}
          </DropdownItem>
        ))}
    />
  );
};

export default LayoutDropdown;
