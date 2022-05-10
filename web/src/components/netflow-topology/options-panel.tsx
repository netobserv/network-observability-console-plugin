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
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import {
  LayoutName,
  TopologyGroupTypes,
  TopologyOptions,
  TopologyScopes,
  TopologyTruncateLength
} from '../../model/topology';
import { GroupDropdown } from '../dropdowns/group-dropdown';
import { LayoutDropdown } from '../dropdowns/layout-dropdown';
import ScopeDropdown from '../dropdowns/scope-dropdown';
import TruncateDropdown from '../dropdowns/truncate-dropdown';
import './options-panel.css';

export type RecordDrawerProps = {
  options: TopologyOptions;
  setOptions: (opts: TopologyOptions) => void;
  onClose: () => void;
  id?: string;
};

export const OptionsPanel: React.FC<RecordDrawerProps> = ({ id, options, setOptions, onClose }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const setLayout = (layout: LayoutName) => {
    setOptions({
      ...options,
      layout
    });
  };

  const setScope = (scope: TopologyScopes) => {
    setOptions({
      ...options,
      scope
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
    <DrawerPanelContent id={id} isResizable defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
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
              <Text component={TextVariants.h4}>{t('Scope')}</Text>
              <ScopeDropdown id="scope" selected={options.scope} setScopeType={setScope} />
            </div>
            <div className="options-col-container">
              <Text component={TextVariants.h4}>{t('Groups')}</Text>
              <GroupDropdown
                id="group"
                disabled={options.scope === TopologyScopes.HOST}
                scope={options.scope}
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
