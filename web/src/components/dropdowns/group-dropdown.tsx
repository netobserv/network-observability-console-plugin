import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScopeOptions } from '../../model/metrics';
import { getGroupName, getGroupsForScope, ScopeConfigDef } from '../../model/scope';
import { TopologyGroupTypes } from '../../model/topology';

export interface GroupDropdownProps {
  disabled?: boolean;
  scope: MetricScopeOptions;
  selected: TopologyGroupTypes;
  setGroupType: (v: TopologyGroupTypes) => void;
  id?: string;
  scopes: ScopeConfigDef[];
}

export const GroupDropdown: React.FC<GroupDropdownProps> = ({
  disabled,
  scope,
  selected,
  setGroupType,
  id,
  scopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  return (
    <Dropdown
      data-test={id}
      id={id}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isDisabled={disabled}
          isExpanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
        >
          {getGroupName(selected, scopes, t)}
        </MenuToggle>
      )}
    >
      {getGroupsForScope(scope, scopes).map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setOpen(false);
            setGroupType(v);
          }}
        >
          {getGroupName(v, scopes, t)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default GroupDropdown;
