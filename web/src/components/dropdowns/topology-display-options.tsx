import { Checkbox, Flex, FlexItem, Switch, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope, MetricType, StatFunction } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { LayoutName, TopologyGroupTypes, TopologyOptions } from '../../model/topology';
import GroupDropdown from './group-dropdown';
import LayoutDropdown from './layout-dropdown';
import TruncateDropdown, { TruncateLength } from './truncate-dropdown';

import { ScopeConfigDef } from '../../model/scope';
import MetricFunctionDropdown from './metric-function-dropdown';
import MetricTypeDropdown from './metric-type-dropdown';
import ScopeDropdown from './scope-dropdown';

export type Size = 's' | 'm' | 'l';

export interface TopologyDisplayOptionsProps {
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
}

export const TopologyDisplayOptions: React.FC<TopologyDisplayOptionsProps> = ({
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
            <Text component={TextVariants.p}>
              {t('Edge labels')} <InfoAltIcon />
            </Text>
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
                selected={metricType}
                setMetricType={setMetricType}
                allowedTypes={allowedTypes}
              />
            </FlexItem>
          </Flex>
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Scope')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown
            data-test="scope"
            id="scope"
            selected={metricScope}
            setScopeType={setMetricScope}
            scopes={scopes}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Grouping items helps to better understand ownership.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Groups')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <GroupDropdown
            id="group"
            disabled={metricScope === MetricScopeOptions.CLUSTER}
            scope={metricScope as MetricScopeOptions}
            selected={topologyOptions.groupTypes}
            setGroupType={setGroupType}
            scopes={scopes}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The way in which topology items are arranged.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Layout')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <LayoutDropdown id="layout" selected={topologyOptions.layout} setLayout={setLayout} />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Various options to show / hide view details.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Show')} <InfoAltIcon />
            </Text>
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
            <Text component={TextVariants.p}>
              {t('Truncate labels')} <InfoAltIcon />
            </Text>
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
            isDisabled={topologyOptions.groupTypes === 'none'}
            isChecked={topologyOptions.groupTypes !== 'none' && !topologyOptions.startCollapsed}
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

export default TopologyDisplayOptions;
