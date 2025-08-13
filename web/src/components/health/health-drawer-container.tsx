import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Drawer,
  DrawerActions,
  DrawerCloseButton,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Text,
  TextContent,
  TextVariants,
  ToggleGroup,
  ToggleGroupItem
} from '@patternfly/react-core';
import { EllipsisVIcon, ListIcon, ThIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthGallery } from './health-gallery';
import { HealthHeatmap } from './health-heatmap';
import { ByResource } from './helper';
import { RuleDetails } from './rule-details';

export interface HealthDrawerContainerProps {
  title: string;
  stats: ByResource[];
  kind: string;
  isDark: boolean;
}

export const HealthDrawerContainer: React.FC<HealthDrawerContainerProps> = ({ title, stats, kind, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedResource, setSelectedResource] = React.useState<ByResource | undefined>(undefined);
  const [selectedPanelView, setSelectedPanelView] = React.useState<'heatmap' | 'table'>('heatmap');
  const [isKebabOpen, setKebabOpen] = React.useState(false);
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

  const filter = encodeURIComponent(
    `${kind === 'Namespace' ? 'src_namespace' : 'src_node'}="${selectedResource?.name}"`
  );
  const kebabLinks = [
    {
      to: `/netflow-traffic?filters=${filter}&bnf=true`,
      text: t('View in Network Traffic')
    }
  ];

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
                      <ResourceLink inline={true} kind={kind} name={selectedResource.name} />
                      <Dropdown
                        isOpen={isKebabOpen}
                        onSelect={() => setKebabOpen(false)}
                        onOpenChange={(isOpen: boolean) => setKebabOpen(isOpen)}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                          <MenuToggle
                            ref={toggleRef}
                            variant="plain"
                            onClick={() => setKebabOpen(!isKebabOpen)}
                            isExpanded={isKebabOpen}
                          >
                            <EllipsisVIcon />
                          </MenuToggle>
                        )}
                      >
                        <DropdownList>
                          {kebabLinks.map((l, i) => {
                            return (
                              <DropdownItem key={'link_' + i} value={i} to={l.to}>
                                {l.text}
                              </DropdownItem>
                            );
                          })}
                        </DropdownList>
                      </Dropdown>
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
                    <HealthHeatmap info={selectedResource} interactive={true} />
                  ) : (
                    <RuleDetails info={selectedResource} detailed={false} />
                  )}
                </div>
              )}
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            <HealthGallery
              stats={stats}
              kind={kind}
              isDark={isDark}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
            />
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
