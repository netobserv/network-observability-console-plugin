import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Text,
  TextContent,
  TextVariants,
  ToggleGroup,
  ToggleGroupItem
} from '@patternfly/react-core';
import { ListIcon, ThIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthGallery } from './health-gallery';
import { HealthHeatmap } from './health-heatmap';
import { ByResource } from './helper';
import { RuleDetails } from './rule-details';

export interface HealthDrawerContainerProps {
  title: string;
  stats: ByResource[];
  kind?: string;
  isDark: boolean;
}

export const HealthDrawerContainer: React.FC<HealthDrawerContainerProps> = ({ title, stats, kind, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [selectedResource, setSelectedResource] = React.useState<ByResource | undefined>(undefined);
  const [selectedPanelView, setSelectedPanelView] = React.useState<'heatmap' | 'table'>('heatmap');
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const onExpand = () => {
    drawerRef.current && drawerRef.current.focus();
  };

  React.useEffect(() => {
    if (selectedResource) {
      const fromStats = stats.find(s => s.name === selectedResource.name);
      if (fromStats !== selectedResource) {
        setSelectedResource(fromStats);
      }
    }
    // we want to update selectedResource when stats changes, no more
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats]);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{title}</Text>
      </TextContent>
      <Drawer isExpanded={selectedResource !== undefined} onExpand={onExpand} isInline>
        <DrawerContent
          panelContent={
            <DrawerPanelContent
              className={'health-gallery-drawer'}
              isResizable
              widths={{ default: 'width_33' }}
              minSize="300px"
            >
              <DrawerHead>
                <span tabIndex={selectedResource !== undefined ? 0 : -1} ref={drawerRef}>
                  {selectedResource !== undefined && (
                    <>
                      {kind ? <ResourceLink inline={true} kind={kind} name={selectedResource.name} /> : t('(global)')}
                    </>
                  )}
                </span>
                <DrawerActions>
                  <ToggleGroup aria-label="Heatmap view">
                    <ToggleGroupItem
                      icon={<ThIcon />}
                      buttonId="toggle-group-heatmap"
                      isSelected={selectedPanelView === 'heatmap'}
                      onChange={() => setSelectedPanelView('heatmap')}
                    />
                    <ToggleGroupItem
                      icon={<ListIcon />}
                      buttonId="toggle-group-table"
                      isSelected={selectedPanelView === 'table'}
                      onChange={() => setSelectedPanelView('table')}
                    />
                  </ToggleGroup>
                  <DrawerCloseButton onClick={() => setSelectedResource(undefined)} />
                </DrawerActions>
              </DrawerHead>
              {selectedResource && (
                <div className="health-gallery-drawer-content">
                  {selectedPanelView === 'heatmap' ? (
                    <HealthHeatmap info={selectedResource} />
                  ) : (
                    <RuleDetails info={selectedResource} />
                  )}
                </div>
              )}
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            <HealthGallery
              isDark={isDark}
              stats={stats}
              kind={kind}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
            />
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
