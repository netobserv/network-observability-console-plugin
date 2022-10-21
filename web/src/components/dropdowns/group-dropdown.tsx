import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScopeOptions } from '../../model/metrics';
import { getAvailableGroups, TopologyGroupTypes } from '../../model/topology';

export const GroupDropdown: React.FC<{
  disabled?: boolean;
  scope: MetricScopeOptions;
  selected: TopologyGroupTypes;
  setGroupType: (v: TopologyGroupTypes) => void;
  id?: string;
}> = ({ disabled, scope, selected, setGroupType, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
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
          {getGroupDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={groupDropdownOpen}
      dropdownItems={getAvailableGroups(scope).map(v => (
        <DropdownItem
          data-test={v}
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
