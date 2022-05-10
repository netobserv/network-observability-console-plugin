import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyGroupTypes, TopologyScopes } from '../../model/topology';

export const GroupDropdown: React.FC<{
  disabled?: boolean;
  scope: TopologyScopes;
  selected: TopologyGroupTypes;
  setGroupType: (v: TopologyGroupTypes) => void;
  id?: string;
}> = ({ disabled, scope, selected, setGroupType, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [groupDropdownOpen, setGroupDropdownOpen] = React.useState(false);

  const getGroupDisplay = (groupType: TopologyGroupTypes) => {
    switch (groupType) {
      case TopologyGroupTypes.NAMESPACES_OWNERS:
        return t('Namespaces + Owners');
      case TopologyGroupTypes.HOSTS_NAMESPACES:
        return t('Nodes + Namespaces');
      case TopologyGroupTypes.HOSTS_OWNERS:
        return t('Nodes + Owners');
      case TopologyGroupTypes.HOSTS:
        return t('Nodes');
      case TopologyGroupTypes.NAMESPACES:
        return t('Namespaces');
      case TopologyGroupTypes.OWNERS:
        return t('Owners');
      default:
        return t('None');
    }
  };

  const getAvailableGroups = React.useCallback(() => {
    switch (scope) {
      case TopologyScopes.HOST:
        return [TopologyGroupTypes.NONE];
      case TopologyScopes.NAMESPACE:
        return [TopologyGroupTypes.NONE, TopologyGroupTypes.HOSTS];
      case TopologyScopes.OWNER:
        return [
          TopologyGroupTypes.NONE,
          TopologyGroupTypes.HOSTS,
          TopologyGroupTypes.HOSTS_NAMESPACES,
          TopologyGroupTypes.NAMESPACES
        ];
      case TopologyScopes.RESOURCE:
      default:
        return Object.values(TopologyGroupTypes);
    }
  }, [scope]);

  //reset to last available group on scope change
  React.useEffect(() => {
    const availableGroups = getAvailableGroups();
    if (!availableGroups.includes(selected)) {
      setGroupType(availableGroups[availableGroups.length - 1]);
    }
  }, [getAvailableGroups, scope, selected, setGroupType]);

  return (
    <Dropdown
      id={id}
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle
          id={`${id}-dropdown`}
          isDisabled={disabled}
          onToggle={() => setGroupDropdownOpen(!groupDropdownOpen)}
        >
          {getGroupDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={groupDropdownOpen}
      dropdownItems={getAvailableGroups().map(v => (
        <DropdownItem
          id={v}
          key={v}
          onClick={() => {
            setGroupDropdownOpen(false);
            setGroupType(v);
          }}
        >
          {getGroupDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default GroupDropdown;
