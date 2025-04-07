import { Checkbox, Content, ContentVariants, Flex, FlexItem, Switch, Tooltip } from '@patternfly/react-core';
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
  appendTo?: () => HTMLElement;
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
  scopes,
  appendTo
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = React.createRef<HTMLDivElement>();

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
    <div ref={ref}>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('Measurement to show as edge labels.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Edge labels')} <InfoAltIcon />
            </Content>
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
                appendTo={appendTo}
              />
            </FlexItem>
            <FlexItem>
              <MetricTypeDropdown
                data-test="metricType"
                id="metricType"
                selected={metricType}
                setMetricType={setMetricType}
                allowedTypes={allowedTypes}
                appendTo={appendTo}
              />
            </FlexItem>
          </Flex>
        </div>
      </div>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Scope')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown
            data-test="scope"
            id="scope"
            selected={metricScope}
            setScopeType={setMetricScope}
            scopes={scopes}
            appendTo={appendTo}
          />
        </div>
      </div>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('Grouping items helps to better understand ownership.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Groups')} <InfoAltIcon />
            </Content>
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
            appendTo={appendTo}
          />
        </div>
      </div>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('The way in which topology items are arranged.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Layout')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <LayoutDropdown id="layout" selected={topologyOptions.layout} setLayout={setLayout} appendTo={appendTo} />
        </div>
      </div>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('Various options to show / hide view details.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Show')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <Checkbox
            id="edges-switch"
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
      </div>
      <div className="pf-v6-c-menu__group">
        <Tooltip content={t('Long labels can reduce visibility.')}>
          <div className="pf-v6-c-menu__group-title">
            <Content component={ContentVariants.p}>
              {t('Truncate labels')} <InfoAltIcon />
            </Content>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <TruncateDropdown
            id="truncate"
            selected={topologyOptions.truncateLength}
            setTruncateLength={setTruncateLength}
            appendTo={appendTo}
          />
        </div>
      </div>
      <div className="pf-v6-c-menu__group">
        <div className="display-dropdown-switch-padding">
          <Switch
            id="group-collapsed-switch"
            label={t('Collapse groups')}
            isDisabled={topologyOptions.groupTypes === 'none'}
            isChecked={topologyOptions.groupTypes !== 'none' && topologyOptions.startCollapsed}
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
    </div>
  );
};

export default TopologyDisplayOptions;
