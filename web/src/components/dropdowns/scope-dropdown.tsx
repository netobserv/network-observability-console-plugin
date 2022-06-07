import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyScopes } from '../../model/topology';

export const ScopeDropdown: React.FC<{
  selected: TopologyScopes;
  setScopeType: (v: TopologyScopes) => void;
  id?: string;
}> = ({ selected, setScopeType, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [scopeDropdownOpen, setScopeDropdownOpen] = React.useState(false);

  const getScopeDisplay = (scopeType: TopologyScopes) => {
    switch (scopeType) {
      case TopologyScopes.HOST:
        return t('Node');
      case TopologyScopes.NAMESPACE:
        return t('Namespace');
      case TopologyScopes.OWNER:
        return t('Owner');
      default:
        return t('Resource');
    }
  };

  return (
    <Dropdown
      data-test={id}
      id={id}
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          onToggle={() => setScopeDropdownOpen(!scopeDropdownOpen)}
        >
          {getScopeDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={scopeDropdownOpen}
      dropdownItems={Object.values(TopologyScopes).map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setScopeDropdownOpen(false);
            setScopeType(v);
          }}
        >
          {getScopeDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default ScopeDropdown;
