import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';

export const ScopeDropdown: React.FC<{
  selected: FlowScope;
  setScopeType: (v: FlowScope) => void;
  id?: string;
  allowedScopes: FlowScope[];
}> = ({ selected, setScopeType, id, allowedScopes }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [scopeDropdownOpen, setScopeDropdownOpen] = React.useState(false);

  const getScopeDisplay = (scopeType: MetricScopeOptions) => {
    switch (scopeType) {
      case MetricScopeOptions.CLUSTER:
        return t('Cluster');
      case MetricScopeOptions.ZONE:
        return t('Zone');
      case MetricScopeOptions.HOST:
        return t('Node');
      case MetricScopeOptions.NAMESPACE:
        return t('Namespace');
      case MetricScopeOptions.OWNER:
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
          {getScopeDisplay(selected as MetricScopeOptions)}
        </DropdownToggle>
      }
      isOpen={scopeDropdownOpen}
      dropdownItems={Object.values(MetricScopeOptions)
        .filter(ms => allowedScopes.includes(ms as FlowScope))
        .map(v => (
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
