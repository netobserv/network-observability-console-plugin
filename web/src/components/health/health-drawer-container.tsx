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

// Type guard to differentiate between ByResource and RecordingRulesByResource
const isAlertResource = (item: ByResource | RecordingRulesByResource): item is ByResource => {
  // ByResource has critical.firing, RecordingRulesByResource has critical as array
  return 'firing' in item.critical;
};

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
  const [selectedItem, setSelectedItem] = React.useState<ByResource | RecordingRulesByResource | undefined>(undefined);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const onExpand = () => {
    drawerRef.current && drawerRef.current.focus();
  };

  React.useEffect(() => {
    if (selectedItem) {
      if (isAlertResource(selectedItem)) {
        const fromStats = stats.find(s => s.name === selectedItem.name);
        if (fromStats !== selectedItem) {
          setSelectedItem(fromStats);
        }
      } else if (recordingRulesStats) {
        const fromStats = recordingRulesStats.find(s => s.name === selectedItem.name);
        if (fromStats !== selectedItem) {
          setSelectedItem(fromStats);
        }
      }
    }
    // we want to update selectedItem when stats or recordingRulesStats changes, no more
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats, recordingRulesStats]);

  const hasRecordingRules = recordingRulesStats && recordingRulesStats.length > 0;
  const isExpanded = selectedItem !== undefined;

  // Sort alerts by score (best score = lowest value)
  const sortedAlerts = React.useMemo(() => _.orderBy(stats, r => r.score, 'asc'), [stats]);

  // Sort recording rules by score (best score = lowest value)
  const sortedRecordingRules = React.useMemo(
    () => (hasRecordingRules ? _.orderBy(recordingRulesStats!, r => r.score, 'asc') : []),
    [hasRecordingRules, recordingRulesStats]
  );

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
                  {selectedItem && <ResourceLink inline={true} kind={kind} name={selectedItem.name} />}
                </span>
              </DrawerHead>
              {selectedItem && (
                <div className="health-gallery-drawer-content">
                  {isAlertResource(selectedItem) ? (
                    <RuleDetails kind={kind} info={selectedItem} wide={false} />
                  ) : (
                    <RecordingRuleDetails kind={kind} info={selectedItem} wide={false} />
                  )}
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
                    isSelected={r.name === selectedItem?.name}
                    onClick={() => {
                      setSelectedItem(r.name !== selectedItem?.name ? r : undefined);
                    }}
                  />
                ))}
                {sortedRecordingRules.map(r => (
                  <RecordingRuleCard
                    key={`recording-card-${r.name}`}
                    kind={kind}
                    isDark={isDark}
                    stats={r}
                    isSelected={r.name === selectedItem?.name}
                    onClick={() => {
                      setSelectedItem(r.name !== selectedItem?.name ? r : undefined);
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
