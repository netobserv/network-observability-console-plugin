import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, EmptyState, EmptyStateIcon, Grid, Title } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RecordingRuleChart } from './recording-rule-chart';

export interface RecordingRulesGridProps {
  rules: Rule[];
}

export const RecordingRulesGrid: React.FC<RecordingRulesGridProps> = ({ rules }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  if (!rules || !Array.isArray(rules) || rules.length === 0) {
    return (
      <Bullseye>
        <EmptyState>
          <EmptyStateIcon icon={CheckCircleIcon} />
          <Title headingLevel="h2">{t('No recording rules found')}</Title>
        </EmptyState>
      </Bullseye>
    );
  }

  return (
    <Grid hasGutter style={{ marginTop: '1rem', marginBottom: '2rem' }}>
      {rules.map((rule, idx) => (
        <RecordingRuleChart key={`${rule.name}-${idx}`} rule={rule} />
      ))}
    </Grid>
  );
};

export default RecordingRulesGrid;
