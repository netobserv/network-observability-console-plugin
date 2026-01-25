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
import { ByResource, getAllAlerts, RecordingRulesByResource } from './health-helper';
import { HealthCard } from './health-card';
import { RuleDetails } from './rule-details';

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
          {/* Unified card row */}
          <GridItem span={12}>
            <HealthCard
              isDark={isDark}
              alertInfo={allAlerts.length > 0 ? info : undefined}
              recordingInfo={hasRecordingRules ? recordingRules : undefined}
              isSelected={false}
            />
          </GridItem>
          {/* Table row */}
          <GridItem span={12}>
            <RuleDetails
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
