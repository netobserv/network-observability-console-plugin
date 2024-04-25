import { Checkbox, Flex, FlexItem, Select, Switch, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StatFunction, FlowScope, MetricType } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { LayoutName, TopologyGroupTypes, TopologyOptions } from '../../model/topology';
import GroupDropdown from './group-dropdown';
import LayoutDropdown from './layout-dropdown';
import TruncateDropdown, { TruncateLength } from './truncate-dropdown';

import './topology-display-dropdown.css';
import MetricFunctionDropdown from './metric-function-dropdown';
import MetricTypeDropdown from './metric-type-dropdown';
import ScopeDropdown from './scope-dropdown';

export type Size = 's' | 'm' | 'l';

export const TopologyDisplayOptions: React.FC<{
  metricFunction: StatFunction;
  setMetricFunction: (f: StatFunction) => void;
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  allowPktDrop: boolean;
  allowDNSMetric: boolean;
  allowRTTMetric: boolean;
  allowMultiCluster: boolean;
  allowZone: boolean;
  allowHost: boolean;
  allowNamespace: boolean;
  allowOwner: boolean;
  allowResource: boolean;
}> = ({
  metricFunction,
  setMetricFunction,
  metricType,
  setMetricType,
  metricScope,
  setMetricScope,
  topologyOptions,
  setTopologyOptions,
  allowPktDrop,
  allowDNSMetric,
  allowRTTMetric,
  allowMultiCluster,
  allowZone,
  allowHost,
  allowNamespace,
  allowOwner,
  allowResource
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const setLayout = (layout: LayoutName) => {
    setTopologyOptions({
      ...topologyOptions,
      layout
    });
  };

  const setGroupType = (groupTypes: TopologyGroupTypes) => {
    setTopologyOptions({
      ...topologyOptions,
      groupTypes
    });
  };

  const setTruncateLength = (truncateLength: TruncateLength) => {
    setTopologyOptions({
      ...topologyOptions,
      truncateLength
    });
  };

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Measurement to show as edge labels.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Edge labels')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <Flex>
            <FlexItem>
              <MetricFunctionDropdown
                data-test="metricFunction"
                id="metricFunction"
                selected={metricFunction}
                setMetricFunction={setMetricFunction}
                metricType={metricType}
              />
            </FlexItem>
            <FlexItem>
              <MetricTypeDropdown
                data-test="metricType"
                id="metricType"
                isTopology
                selected={metricType}
                setMetricType={setMetricType}
                allowPktDrop={allowPktDrop}
                allowDNSMetric={allowDNSMetric}
                allowRTTMetric={allowRTTMetric}
              />
            </FlexItem>
          </Flex>
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Scope')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown
            data-test="scope"
            id="scope"
            selected={metricScope}
            setScopeType={setMetricScope}
            allowMultiCluster={allowMultiCluster}
            allowZone={allowZone}
            allowHost={allowHost}
            allowNamespace={allowNamespace}
            allowOwner={allowOwner}
            allowResource={allowResource}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Grouping items helps to better understand ownership.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Groups')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <GroupDropdown
            id="group"
            disabled={metricScope === MetricScopeOptions.CLUSTER}
            scope={metricScope as MetricScopeOptions}
            selected={topologyOptions.groupTypes}
            setGroupType={setGroupType}
            allowMultiCluster={allowMultiCluster}
            allowZone={allowZone}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The way in which topology items are arranged.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Layout')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <LayoutDropdown id="layout" selected={topologyOptions.layout} setLayout={setLayout} />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Various options to show / hide view details.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Show')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <Checkbox
          id="edges-switch"
          className="display-dropdown-padding"
          label={t('Edges')}
          isChecked={topologyOptions.edges}
          onChange={() =>
            setTopologyOptions({
              ...topologyOptions,
              edges: !topologyOptions.edges
            })
          }
        />
        <Checkbox
          id="edges-tag-switch"
          className="display-dropdown-padding"
          label={t('Edges label')}
          isDisabled={!topologyOptions.edges}
          isChecked={topologyOptions.edges && topologyOptions.edgeTags}
          onChange={() =>
            setTopologyOptions({
              ...topologyOptions,
              edgeTags: !topologyOptions.edgeTags
            })
          }
        />
        <Checkbox
          id="badge-switch"
          className="display-dropdown-padding"
          label={t('Badges')}
          isChecked={topologyOptions.nodeBadges}
          onChange={() =>
            setTopologyOptions({
              ...topologyOptions,
              nodeBadges: !topologyOptions.nodeBadges
            })
          }
        />
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Long labels can reduce visibility.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Truncate labels')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <TruncateDropdown
            id="truncate"
            selected={topologyOptions.truncateLength}
            setTruncateLength={setTruncateLength}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <div className="display-dropdown-padding">
          <Switch
            id="group-collapsed-switch"
            label={t('Collapse groups')}
            isDisabled={topologyOptions.groupTypes === TopologyGroupTypes.NONE}
            isChecked={topologyOptions.groupTypes !== TopologyGroupTypes.NONE && !topologyOptions.startCollapsed}
            onChange={() =>
              setTopologyOptions({
                ...topologyOptions,
                startCollapsed: !topologyOptions.startCollapsed
              })
            }
            isReversed
          />
        </div>
      </div>
    </>
  );
};

export const TopologyDisplayDropdown: React.FC<{
  metricFunction: StatFunction;
  setMetricFunction: (f: StatFunction) => void;
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  topologyOptions: TopologyOptions;
  setTopologyOptions: (o: TopologyOptions) => void;
  allowPktDrop: boolean;
  allowDNSMetric: boolean;
  allowRTTMetric: boolean;
  allowMultiCluster: boolean;
  allowZone: boolean;
  allowHost: boolean;
  allowNamespace: boolean;
  allowOwner: boolean;
  allowResource: boolean;
}> = ({
  metricFunction,
  setMetricFunction,
  metricType,
  setMetricType,
  metricScope,
  setMetricScope,
  topologyOptions,
  setTopologyOptions,
  allowPktDrop,
  allowDNSMetric,
  allowRTTMetric,
  allowMultiCluster,
  allowZone,
  allowHost,
  allowNamespace,
  allowOwner,
  allowResource
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="topology-display-dropdown"
        placeholderText={<span>{t('Display options')}</span>}
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
            allowPktDrop={allowPktDrop}
            allowDNSMetric={allowDNSMetric}
            allowRTTMetric={allowRTTMetric}
            allowMultiCluster={allowMultiCluster}
            allowZone={allowZone}
            allowHost={allowHost}
            allowNamespace={allowNamespace}
            allowOwner={allowOwner}
            allowResource={allowResource}
          />
        }
      />
    </div>
  );
};

export default TopologyDisplayDropdown;
