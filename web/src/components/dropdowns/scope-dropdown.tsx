import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';

export interface ScopeDropdownProps {
  selected: FlowScope;
  setScopeType: (v: FlowScope) => void;
  id?: string;
  scopes: ScopeConfigDef[];
}

export const ScopeDropdown: React.FC<ScopeDropdownProps> = ({ selected, setScopeType, id, scopes }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [scopeDropdownOpen, setScopeDropdownOpen] = React.useState(false);

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
          {scopes.find(sc => sc.id === selected)?.name || t('n/a')}
        </DropdownToggle>
      }
      isOpen={scopeDropdownOpen}
      dropdownItems={scopes.map(sc => (
        <DropdownItem
          data-test={sc.id}
          id={sc.id}
          key={sc.id}
          onClick={() => {
            setScopeDropdownOpen(false);
            setScopeType(sc.id);
          }}
        >
          {sc.name}
        </DropdownItem>
      ))}
    />
  );
};

export default ScopeDropdown;
