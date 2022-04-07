import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LayoutName } from '../../model/topology';

export const LayoutDropdown: React.FC<{
  selected: LayoutName;
  setLayout: (l: LayoutName) => void;
  id?: string;
}> = ({ selected, setLayout, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [layoutDropdownOpen, setLayoutDropdownOpen] = React.useState(false);

  const getLayoutDisplay = (layoutName: LayoutName) => {
    switch (layoutName) {
      case LayoutName.Cola:
        return t('Cola');
      case LayoutName.ColaNoForce:
        return t('ColaNoForce');
      case LayoutName.Concentric:
        return t('Concentric');
      case LayoutName.Dagre:
        return t('Dagre');
      case LayoutName.Force:
        return t('Force');
      case LayoutName.Grid:
        return t('Grid');
      default:
        return t('Invalid');
    }
  };

  return (
    <Dropdown
      id={id}
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle id={`${id}-dropdown`} onToggle={() => setLayoutDropdownOpen(!layoutDropdownOpen)}>
          {getLayoutDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={layoutDropdownOpen}
      dropdownItems={Object.values(LayoutName).map(v => (
        <DropdownItem
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
