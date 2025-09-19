import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import * as React from 'react';
import { HealthGallery } from './health-gallery';
import { ByResource } from './health-helper';
import { RuleDetails } from './rule-details';

export interface HealthDrawerContainerProps {
  title: string;
  stats: ByResource[];
  kind: string;
  isDark: boolean;
}

export const HealthDrawerContainer: React.FC<HealthDrawerContainerProps> = ({ title, stats, kind, isDark }) => {
  const [selectedResource, setSelectedResource] = React.useState<ByResource | undefined>(undefined);
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
                      <ResourceLink inline={true} kind={kind} name={selectedResource.name} />
                    </>
                  )}
                </span>
              </DrawerHead>
              {selectedResource && (
                <div className="health-gallery-drawer-content">
                  <RuleDetails kind={kind} info={selectedResource} wide={false} />
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
