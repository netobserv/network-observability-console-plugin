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
import { RuleDetails } from './rule-details';

// Unified item that can contain both alerts and recording rules
interface UnifiedResourceItem {
  name: string;
  alertInfo?: ByResource;
  recordingInfo?: RecordingRulesByResource;
  score: number;
}

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
  const [selectedItemName, setSelectedItemName] = React.useState<string | undefined>(undefined);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const onExpand = () => {
    drawerRef.current && drawerRef.current.focus();
  };

  // Combine alerts and recording rules by resource name
  const unifiedItems = React.useMemo(() => {
    const itemsMap = new Map<string, UnifiedResourceItem>();

    // Add alerts
    stats.forEach(alert => {
      itemsMap.set(alert.name, {
        name: alert.name,
        alertInfo: alert,
        recordingInfo: undefined,
        score: alert.score
      });
    });

    // Add or merge recording rules
    recordingRulesStats?.forEach(recordingRule => {
      const existing = itemsMap.get(recordingRule.name);
      if (existing) {
        existing.recordingInfo = recordingRule;
        // Use minimum score (best score)
        existing.score = Math.min(existing.score, recordingRule.score);
      } else {
        itemsMap.set(recordingRule.name, {
          name: recordingRule.name,
          alertInfo: undefined,
          recordingInfo: recordingRule,
          score: recordingRule.score
        });
      }
    });

    // Sort by score (best score = lowest value)
    return _.orderBy(Array.from(itemsMap.values()), item => item.score, 'asc');
  }, [stats, recordingRulesStats]);

  const selectedItem = React.useMemo(() => {
    return selectedItemName ? unifiedItems.find(item => item.name === selectedItemName) : undefined;
  }, [selectedItemName, unifiedItems]);

  const isExpanded = selectedItem !== undefined;
  const hasAnyViolations = unifiedItems.length > 0;

  return (
    <>

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
                  <RuleDetails
                    kind={kind}
                    alertInfo={selectedItem.alertInfo}
                    recordingRuleInfo={selectedItem.recordingInfo}
                  />
                </div>
              )}
            </DrawerPanelContent>
          }
        >
          <DrawerContentBody>
            <TextContent>
              <Text component={TextVariants.h3}>{title}</Text>
            </TextContent>
            {!hasAnyViolations && (
              <Bullseye>
                <EmptyState>
                  <EmptyStateIcon icon={CheckCircleIcon} />
                  <Title headingLevel="h2">{t('No violations found')}</Title>
                </EmptyState>
              </Bullseye>
            )}
            {hasAnyViolations && (
              <Gallery hasGutter minWidths={{ default: '300px' }} style={{ marginRight: '1.5rem' }}>
                {unifiedItems.map(item => (
                  <HealthCard
                    key={`card-${item.name}`}
                    name={item.name}
                    kind={kind}
                    isDark={isDark}
                    alertInfo={item.alertInfo}
                    recordingInfo={item.recordingInfo}
                    isSelected={item.name === selectedItemName}
                    onClick={() => {
                      setSelectedItemName(item.name !== selectedItemName ? item.name : undefined);
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
