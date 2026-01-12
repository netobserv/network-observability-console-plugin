import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  EmptyState,
  EmptyStateIcon,
  Gallery,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthCard } from './health-card';
import { ByResource, RecordingRulesByResource } from './health-helper';
import { RecordingRuleCard } from './recording-rule-card';
import { RecordingRuleDetails } from './recording-rule-details';
import { RuleDetails } from './rule-details';

export interface HealthDrawerContainerProps {
  title: string;
  stats: ByResource[];
  recordingRulesStats?: RecordingRulesByResource[];
  kind: string;
  isDark: boolean;
}

export const HealthDrawerContainer: React.FC<HealthDrawerContainerProps> = ({
  title,
  stats,
  recordingRulesStats,
  kind,
  isDark
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedResource, setSelectedResource] = React.useState<ByResource | undefined>(undefined);
  const [selectedRecordingResource, setSelectedRecordingResource] = React.useState<
    RecordingRulesByResource
  >();
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const onExpand = () => {
    drawerRef.current && drawerRef.current.focus();
  };

  // When selecting a violation, deselect recording rule
  const handleSelectResource = (r: ByResource | undefined) => {
    setSelectedResource(r);
    if (r) {
      setSelectedRecordingResource(undefined);
    }
  };

  // When selecting a recording rule, deselect violation
  const handleSelectRecordingResource = (r: RecordingRulesByResource | undefined) => {
    setSelectedRecordingResource(r);
    if (r) {
      setSelectedResource(undefined);
    }
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

  React.useEffect(() => {
    if (selectedRecordingResource && recordingRulesStats) {
      const fromStats = recordingRulesStats.find(s => s.name === selectedRecordingResource.name);
      if (fromStats !== selectedRecordingResource) {
        setSelectedRecordingResource(fromStats);
      }
    }
    // we want to update selectedRecordingResource when recordingRulesStats changes, no more
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingRulesStats]);

  const hasRecordingRules = recordingRulesStats && recordingRulesStats.length > 0;
  const isExpanded = selectedResource !== undefined || selectedRecordingResource !== undefined;

  // Sort alerts by score (best score = lowest value)
  const sortedAlerts = _.orderBy(stats, r => r.score, 'asc');

  // Sort recording rules by severity (most critical first)
  const sortedRecordingRules = hasRecordingRules
    ? [...recordingRulesStats!].sort((a, b) => {
        const aScore = a.critical.length * 3 + a.warning.length * 2 + a.other.length;
        const bScore = b.critical.length * 3 + b.warning.length * 2 + b.other.length;
        return bScore - aScore;
      })
    : [];

  const hasAnyViolations = sortedAlerts.length > 0 || sortedRecordingRules.length > 0;

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{title}</Text>
      </TextContent>
      <Drawer isExpanded={isExpanded} onExpand={onExpand} isInline>
        <DrawerContent
          panelContent={
            <DrawerPanelContent
              className={'health-gallery-drawer'}
              isResizable
              widths={{ default: 'width_33' }}
              minSize="300px"
            >
              <DrawerHead>
                <span tabIndex={isExpanded ? 0 : -1} ref={drawerRef}>
                  {selectedResource !== undefined && (
                    <>
                      <ResourceLink inline={true} kind={kind} name={selectedResource.name} />
                    </>
                  )}
                  {selectedRecordingResource !== undefined && (
                    <>
                      <ResourceLink inline={true} kind={kind} name={selectedRecordingResource.name} />
                    </>
                  )}
                </span>
              </DrawerHead>
              {selectedResource && (
                <div className="health-gallery-drawer-content">
                  <RuleDetails kind={kind} info={selectedResource} wide={false} />
                </div>
              )}
              {selectedRecordingResource && (
                <div className="health-gallery-drawer-content">
                  <RecordingRuleDetails kind={kind} info={selectedRecordingResource} wide={false} />
                </div>
              )}
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            {!hasAnyViolations && (
              <Bullseye>
                <EmptyState>
                  <EmptyStateIcon icon={CheckCircleIcon} />
                  <Title headingLevel="h2">{t('No violations found')}</Title>
                </EmptyState>
              </Bullseye>
            )}
            {hasAnyViolations && (
              <Gallery hasGutter minWidths={{ default: '300px' }}>
                {sortedAlerts.map(r => (
                  <HealthCard
                    key={`card-${r.name}`}
                    kind={kind}
                    isDark={isDark}
                    stats={r}
                    isSelected={r.name === selectedResource?.name}
                    onClick={() => {
                      handleSelectResource(r.name !== selectedResource?.name ? r : undefined);
                    }}
                  />
                ))}
                {sortedRecordingRules.map(r => (
                  <RecordingRuleCard
                    key={`recording-card-${r.name}`}
                    kind={kind}
                    isDark={isDark}
                    stats={r}
                    isSelected={r.name === selectedRecordingResource?.name}
                    onClick={() => {
                      handleSelectRecordingResource(r.name !== selectedRecordingResource?.name ? r : undefined);
                    }}
                  />
                ))}
              </Gallery>
            )}
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};
