import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Switch,
  Text,
  TextVariants
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { LayoutName, TopologyGroupTypes, TopologyOptions, TopologyTruncateLength } from '../../model/topology';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { GroupDropdown } from '../dropdowns/group-dropdown';
import { LayoutDropdown } from '../dropdowns/layout-dropdown';
import TruncateDropdown from '../dropdowns/truncate-dropdown';
import './options-panel.css';

export type RecordDrawerProps = {
  options: TopologyOptions;
  setOptions: (opts: TopologyOptions) => void;
  metricScope: MetricScope;
  onClose: () => void;
  id?: string;
};

export const OptionsPanel: React.FC<RecordDrawerProps> = ({ id, options, metricScope, setOptions, onClose }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const setLayout = (layout: LayoutName) => {
    setOptions({
      ...options,
      layout
    });
  };

  const setGroupType = (groupTypes: TopologyGroupTypes) => {
    setOptions({
      ...options,
      groupTypes
    });
  };

  const setTruncateLength = (truncateLength: TopologyTruncateLength) => {
    setOptions({
      ...options,
      truncateLength
    });
  };

  return (
    <DrawerPanelContent
      data-test={id}
      id={id}
      isResizable
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
    >
      <DrawerHead>
        <Text component={TextVariants.h2}>{t('Options')}</Text>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        {options && (
          <div className="options-container">
            <div className="options-col-container">
              <Text component={TextVariants.h4}>{t('Display')}</Text>
              <LayoutDropdown id="layout" selected={options.layout} setLayout={setLayout} />
            </div>
            <div className="options-col-container">
              <Text component={TextVariants.h4}>{t('Groups')}</Text>
              <GroupDropdown
                id="group"
                disabled={metricScope === MetricScopeOptions.HOST}
                scope={metricScope as MetricScopeOptions}
                selected={options.groupTypes}
                setGroupType={setGroupType}
              />
            </div>
            <Switch
              id="group-collapsed-switch"
              label={t('Groups are expanded')}
              labelOff={t('Groups are collapsed')}
              isDisabled={options.groupTypes === TopologyGroupTypes.NONE}
              isChecked={options.groupTypes !== TopologyGroupTypes.NONE && !options.startCollapsed}
              onChange={() =>
                setOptions({
                  ...options,
                  startCollapsed: !options.startCollapsed
                })
              }
              isReversed
            />
            <Switch
              id="edges-switch"
              label={t('Edges are displayed')}
              labelOff={t('Edges are hidden')}
              isChecked={options.edges}
              onChange={() =>
                setOptions({
                  ...options,
                  edges: !options.edges
                })
              }
              isReversed
            />
            <Switch
              id="edges-tag-switch"
              label={t('Labels on edges are displayed')}
              labelOff={t('Labels on edges are hidden')}
              isDisabled={!options.edges}
              isChecked={options.edges && options.edgeTags}
              onChange={() =>
                setOptions({
                  ...options,
                  edgeTags: !options.edgeTags
                })
              }
              isReversed
            />
            <Switch
              id="badge-switch"
              label={t('Badges are displayed')}
              labelOff={t('Badges are hidden')}
              isChecked={options.nodeBadges}
              onChange={() =>
                setOptions({
                  ...options,
                  nodeBadges: !options.nodeBadges
                })
              }
              isReversed
            />
            <div className="options-col-container">
              <Text component={TextVariants.h4}>{t('Truncate labels')}</Text>
              <TruncateDropdown id="truncate" selected={options.truncateLength} setTruncateLength={setTruncateLength} />
            </div>
          </div>
        )}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default OptionsPanel;
