import {
  Bullseye,
  EmptyState,
  EmptyStateIcon,
  Grid,
  GridItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { HealthCard } from './health-card';
import { ByResource, getAllAlerts, RecordingRulesByResource } from './health-helper';
import { RecordingRuleCard } from './recording-rule-card';
import { UnifiedRuleDetails } from './unified-rule-details';

export interface HealthGlobalProps {
  info: ByResource;
  recordingRules?: RecordingRulesByResource;
  isDark: boolean;
}

export const HealthGlobal: React.FC<HealthGlobalProps> = ({ info, recordingRules, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const allAlerts = getAllAlerts(info);
  const hasRecordingRules =
    recordingRules &&
    (recordingRules.critical.length > 0 || recordingRules.warning.length > 0 || recordingRules.other.length > 0);

  const hasAnyViolations = allAlerts.length > 0 || hasRecordingRules;

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('Global rule violations')}</Text>
      </TextContent>
      {!hasAnyViolations ? (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={CheckCircleIcon} />
            <Title headingLevel="h2">{t('No violations found')}</Title>
          </EmptyState>
        </Bullseye>
      ) : (
        <Grid hasGutter>
          <GridItem span={3}>
            {allAlerts.length > 0 && <HealthCard isDark={isDark} stats={info} isSelected={false} />}
            {hasRecordingRules && (
              <div style={{ marginTop: allAlerts.length > 0 ? '1rem' : '0' }}>
                <RecordingRuleCard isDark={isDark} stats={recordingRules} isSelected={false} />
              </div>
            )}
          </GridItem>
          <GridItem span={9}>
            <UnifiedRuleDetails
              kind={'Global'}
              alertInfo={allAlerts.length > 0 ? info : undefined}
              recordingRuleInfo={hasRecordingRules ? recordingRules : undefined}
            />
          </GridItem>
        </Grid>
      )}
    </>
  );
};
