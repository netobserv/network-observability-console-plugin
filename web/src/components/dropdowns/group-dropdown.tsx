import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
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
  const [groupDropdownOpen, setGroupDropdownOpen] = React.useState(false);

  return (
    <Dropdown
      data-test={id}
      id={id}
      toggle={
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isDisabled={disabled}
          onToggle={() => setGroupDropdownOpen(!groupDropdownOpen)}
        >
          {getGroupName(selected, scopes, t)}
        </DropdownToggle>
      }
      isOpen={groupDropdownOpen}
      dropdownItems={getGroupsForScope(scope, scopes).map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setGroupDropdownOpen(false);
            setGroupType(v);
          }}
        >
          {getGroupName(v, scopes, t)}
        </DropdownItem>
      ))}
    />
  );
};

export default GroupDropdown;
