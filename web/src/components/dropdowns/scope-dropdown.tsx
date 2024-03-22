import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';

export const ScopeDropdown: React.FC<{
  selected: FlowScope;
  setScopeType: (v: FlowScope) => void;
  id?: string;
  allowMultiCluster: boolean;
  allowZone: boolean;
}> = ({ selected, setScopeType, id, allowMultiCluster, allowZone }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

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
      popperProps={{
        position: 'right'
      }}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          onClick={() => setOpen(!isOpen)}
          isExpanded={isOpen}
        >
          {getScopeDisplay(selected as MetricScopeOptions)}
        </MenuToggle>
      )}
    >
      {Object.values(MetricScopeOptions)
        .filter(
          ms =>
            (allowMultiCluster || ms !== MetricScopeOptions.CLUSTER) && (allowZone || ms !== MetricScopeOptions.ZONE)
        )
        .map(v => (
          <DropdownItem
            data-test={v}
            id={v}
            key={v}
            onClick={() => {
              setOpen(false);
              setScopeType(v);
            }}
          >
            {getScopeDisplay(v)}
          </DropdownItem>
        ))}
    </Dropdown>
  );
};

export default ScopeDropdown;
