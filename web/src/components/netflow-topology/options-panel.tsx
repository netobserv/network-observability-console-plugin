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
import { LayoutName, TopologyGroupTypes, TopologyOptions } from '../../model/topology';
import { GroupDropdown } from '../dropdowns/group-dropdown';
import { LayoutDropdown } from '../dropdowns/layout-dropdown';
import './options-panel.css';

export type RecordDrawerProps = {
  layout: LayoutName;
  setLayout: (l: LayoutName) => void;
  options: TopologyOptions;
  setOptions: (opts: TopologyOptions) => void;
  onClose: () => void;
  id?: string;
};

export const OptionsPanel: React.FC<RecordDrawerProps> = ({ id, layout, setLayout, options, setOptions, onClose }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const setGroupType = (groupTypes: TopologyGroupTypes) => {
    setOptions({
      ...options,
      groupTypes
    });
  };

  return (
    <DrawerPanelContent id={id}>
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
              <LayoutDropdown id="layout" selected={layout} setLayout={setLayout} />
            </div>
            <div className="options-col-container">
              <Text component={TextVariants.h4}>{t('Groups')}</Text>
              <GroupDropdown id="group" selected={options.groupTypes} setGroupType={setGroupType} />
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
            <Switch
              id="truncate-switch"
              label={t('Long labels are truncated')}
              labelOff={t('Whole labels are displayed')}
              isChecked={options.truncateLabels}
              onChange={() =>
                setOptions({
                  ...options,
                  truncateLabels: !options.truncateLabels
                })
              }
              isReversed
            />
          </div>
        )}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default OptionsPanel;
