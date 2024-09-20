import { Select, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope, MetricType, StatFunction } from '../../model/flow-query';
import { TopologyOptions } from '../../model/topology';
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
  allowedScopes: FlowScope[];
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
  allowedScopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="topology-display-dropdown"
        placeholderText={<Text component={TextVariants.p}>{t('Display options')}</Text>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={
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
            allowedScopes={allowedScopes}
          />
        }
      />
    </div>
  );
};

export default TopologyDisplayDropdown;
