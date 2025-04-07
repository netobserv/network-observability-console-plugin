import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';

export interface ScopeDropdownProps {
  selected: FlowScope;
  setScopeType: (v: FlowScope) => void;
  id?: string;
  scopes: ScopeConfigDef[];
  appendTo?: () => HTMLElement;
}

export const ScopeDropdown: React.FC<ScopeDropdownProps> = ({ selected, setScopeType, id, scopes, appendTo }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  return (
    <Dropdown
      data-test={id}
      id={id}
      popperProps={{
        position: 'right',
        appendTo
      }}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isExpanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          onBlur={() => setTimeout(() => setOpen(false), 500)}
        >
          {scopes.find(sc => sc.id === selected)?.name || t('n/a')}
        </MenuToggle>
      )}
    >
      {scopes.map(sc => (
        <DropdownItem
          data-test={sc.id}
          id={sc.id}
          key={sc.id}
          onClick={() => {
            setOpen(false);
            setScopeType(sc.id);
          }}
        >
          {sc.name}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default ScopeDropdown;
