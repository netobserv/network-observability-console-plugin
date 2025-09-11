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
import { ByResource, getAllAlerts } from './helper';
import { RuleDetails } from './rule-details';

export interface HealthGlobalProps {
  info: ByResource;
  isDark: boolean;
}

export const HealthGlobal: React.FC<HealthGlobalProps> = ({ info, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const allAlerts = getAllAlerts(info);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('Global rule violations')}</Text>
      </TextContent>
      {allAlerts.length === 0 ? (
        <Bullseye>
          <EmptyState>
            <EmptyStateIcon icon={CheckCircleIcon} />
            <Title headingLevel="h2">{t('No violations found')}</Title>
          </EmptyState>
        </Bullseye>
      ) : (
        <Grid hasGutter>
          <GridItem span={3}>
            <HealthCard isDark={isDark} stats={info} isSelected={false} />
          </GridItem>
          <GridItem span={9}>
            <RuleDetails info={info} header={true} />
          </GridItem>
        </Grid>
      )}
    </>
  );
};
