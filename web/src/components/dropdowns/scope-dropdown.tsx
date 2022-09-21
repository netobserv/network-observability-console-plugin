import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';

export const ScopeDropdown: React.FC<{
  selected: MetricScope;
  setScopeType: (v: MetricScope) => void;
  id?: string;
}> = ({ selected, setScopeType, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [scopeDropdownOpen, setScopeDropdownOpen] = React.useState(false);

  const getScopeDisplay = (scopeType: MetricScopeOptions) => {
    switch (scopeType) {
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
        .filter(v => v !== MetricScopeOptions.APP)
        .map(v => (
          <DropdownItem
            data-test={v}
            id={v}
            key={v}
            onClick={() => {
              setScopeDropdownOpen(false);
              setScopeType(v as MetricScope);
            }}
          >
            {getScopeDisplay(v)}
          </DropdownItem>
        ))}
    />
  );
};

export default ScopeDropdown;
