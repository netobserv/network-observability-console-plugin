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
import { getAllHealthItems, HealthStat } from './health-helper';
import { RuleDetails } from './rule-details';

export interface HealthGlobalProps {
  info: HealthStat;
  isDark: boolean;
}

export const HealthGlobal: React.FC<HealthGlobalProps> = ({ info, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const all = getAllHealthItems(info);

  return (
    <>
      <TextContent>
        <Text component={TextVariants.h3}>{t('Global rule violations')}</Text>
      </TextContent>
      {all.length === 0 ? (
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
            <HealthCard isDark={isDark} resourceHealth={info} isSelected={false} />
          </GridItem>
          {/* Table row */}
          <GridItem span={12}>
            <RuleDetails kind={'Global'} resourceHealth={info} />
          </GridItem>
        </Grid>
      )}
    </>
  );
};
