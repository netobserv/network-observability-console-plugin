import { MenuToggle, MenuToggleElement, Select } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope, MetricType, StatFunction } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';
import { TopologyOptions } from '../../model/topology';
import { useOutsideClickEvent } from '../../utils/outside-hook';
import './topology-display-dropdown.css';
import { TopologyDisplayOptions } from './topology-display-options';

export const TopologyDisplayDropdown: React.FC<{
  metricFunction: StatFunction;
  setMetricFunction: (f: StatFunction) => void;
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  allowedTypes: MetricType[];
  scopes: ScopeConfigDef[];
}> = ({
  metricFunction,
  setMetricFunction,
  metricType,
  setMetricType,
  metricScope,
  setMetricScope,
  topologyOptions,
  setTopologyOptions,
  allowedTypes,
  scopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container" ref={ref}>
      <Select
        id="topology-display-dropdown"
        placeholder={t('Display options')}
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
            {t('Display options')}
          </MenuToggle>
        )}
      >
        <TopologyDisplayOptions
          metricFunction={metricFunction}
          setMetricFunction={setMetricFunction}
          metricType={metricType}
          setMetricType={setMetricType}
          metricScope={metricScope}
          setMetricScope={setMetricScope}
          topologyOptions={topologyOptions}
          setTopologyOptions={setTopologyOptions}
          allowedTypes={allowedTypes}
          scopes={scopes}
        />
      </Select>
    </div>
  );
};

export default TopologyDisplayDropdown;
