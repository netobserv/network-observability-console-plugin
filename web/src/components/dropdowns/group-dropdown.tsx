import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { getGroupsForScope, isGroupEnabled, TopologyGroupTypes } from '../../model/topology';

export const GroupDropdown: React.FC<{
  disabled?: boolean;
  scope: MetricScopeOptions;
  selected: TopologyGroupTypes;
  setGroupType: (v: TopologyGroupTypes) => void;
  id?: string;
  allowedScopes: FlowScope[];
}> = ({ disabled, scope, selected, setGroupType, id, allowedScopes }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [groupDropdownOpen, setGroupDropdownOpen] = React.useState(false);

  const getGroupDisplay = (groupType: TopologyGroupTypes) => {
    switch (groupType) {
      /** Clusters aggregation and groups */
      case TopologyGroupTypes.clusters:
        return t('Clusters');
      case TopologyGroupTypes.clustersHosts:
        return t('Clusters + Nodes');
      case TopologyGroupTypes.clustersZones:
        return t('Clusters + Zones');
      case TopologyGroupTypes.clustersNamespaces:
        return t('Clusters + Namespaces');
      case TopologyGroupTypes.clustersOwners:
        return t('Clusters + Owners');
      /** Zones aggregation and groups */
      case TopologyGroupTypes.zones:
        return t('Zones');
      case TopologyGroupTypes.zonesHosts:
        return t('Zones + Nodes');
      case TopologyGroupTypes.zonesNamespaces:
        return t('Zones + Namespaces');
      case TopologyGroupTypes.zonesOwners:
        return t('Zones + Owners');
      /** Hosts aggregation and groups */
      case TopologyGroupTypes.hosts:
        return t('Nodes');
      case TopologyGroupTypes.hostsNamespaces:
        return t('Nodes + Namespaces');
      case TopologyGroupTypes.hostsOwners:
        return t('Nodes + Owners');
      /** Namespaces aggregation and groups */
      case TopologyGroupTypes.namespaces:
        return t('Namespaces');
      case TopologyGroupTypes.namespacesOwners:
        return t('Namespaces + Owners');
      /** Owner aggregation */
      case TopologyGroupTypes.owners:
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
      dropdownItems={getGroupsForScope(scope)
        .filter(g => isGroupEnabled(g, allowedScopes))
        .map(v => (
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
