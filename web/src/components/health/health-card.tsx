import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { BellIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { computeResourceScore, HealthStat } from './health-helper';

export interface HealthCardProps {
  name?: string;
  kind?: string;
  resourceHealth: HealthStat;
  isDark: boolean;
  isSelected: boolean;
  onClick?: () => void;
  hideTitle?: boolean;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  name,
  kind,
  resourceHealth,
  isDark,
  isSelected,
  onClick,
  hideTitle
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const score = React.useMemo(() => computeResourceScore(resourceHealth), [resourceHealth]);

  // Combine counts from both alerts and recording rules
  const criticalCount = React.useMemo(
    () =>
      (resourceHealth.critical.firing.length || 0) +
      (resourceHealth.critical.pending.length || 0) +
      (resourceHealth.critical.recording.length || 0),
    [resourceHealth]
  );

  const warningCount = React.useMemo(
    () =>
      (resourceHealth.warning.firing.length || 0) +
      (resourceHealth.warning.pending.length || 0) +
      (resourceHealth.warning.recording.length || 0),
    [resourceHealth]
  );

  const infoCount = React.useMemo(
    () =>
      (resourceHealth.other.firing.length || 0) +
      (resourceHealth.other.pending.length || 0) +
      (resourceHealth.other.recording.length || 0),
    [resourceHealth]
  );

  const silencedCount = React.useMemo(
    () =>
      (resourceHealth.critical.silenced.length || 0) +
      (resourceHealth.warning.silenced.length || 0) +
      (resourceHealth.other.silenced.length || 0),
    [resourceHealth]
  );

  // Build CSS classes like other health cards
  const classes = ['card'];
  let icon = <InfoAltIcon className="icon" />;
  if (criticalCount > 0) {
    classes.push('critical');
    icon = <ExclamationCircleIcon className="icon critical" />;
  } else if (warningCount > 0) {
    classes.push('warning');
    icon = <ExclamationTriangleIcon className="icon warning" />;
  } else if (infoCount > 0) {
    classes.push('minor');
    icon = <BellIcon className="icon minor" />;
  }
  if (isDark) {
    classes.push('dark');
  }

  return (
    <Card className={classes.join(' ')} isClickable={onClick !== undefined} isClicked={isSelected}>
      <CardHeader
        className={hideTitle ? 'card-header-hidden' : 'card-header'}
        selectableActions={{
          selectableActionId: `health-card-${name || 'global'}`,
          selectableActionAriaLabelledby: `selectable-card-${name || 'global'}`,
          variant: 'single',
          onClickAction: onClick
        }}
      >
        {!hideTitle && (
          <Flex
            gap={{ default: 'gapSm' }}
            alignItems={{ default: 'alignItemsCenter' }}
            flexWrap={{ default: 'nowrap' }}
          >
            <FlexItem>{icon}</FlexItem>
            <FlexItem>
              <CardTitle>
                {kind && name ? <ResourceLink inline={true} kind={kind} name={name} /> : t('Global')}
              </CardTitle>
            </FlexItem>
          </Flex>
        )}
      </CardHeader>
      <CardBody>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          {hideTitle && <FlexItem className="card-body-icon">{icon}</FlexItem>}
          <FlexItem grow={{ default: 'grow' }}>
            <ul style={{ listStyleType: 'none' }}>
              {criticalCount > 0 && (
                <li>
                  {criticalCount} {t('critical issues')}
                </li>
              )}
              {warningCount > 0 && (
                <li>
                  {warningCount} {t('warnings')}
                </li>
              )}
              {infoCount > 0 && (
                <li>
                  {infoCount} {t('info metrics')}
                </li>
              )}
              {silencedCount > 0 && (
                <li>
                  {silencedCount} {t('silenced issues')}
                </li>
              )}
            </ul>
          </FlexItem>
          <FlexItem>
            <Flex direction={{ default: 'column' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <TextContent>
                  <Text component={TextVariants.small} style={{ color: 'var(--pf-v5-global--Color--200)' }}>
                    {t('Score')}
                  </Text>
                </TextContent>
              </FlexItem>
              <FlexItem>
                <TextContent>
                  <Text component={TextVariants.h1}>
                    {isNaN(score) || !isFinite(score) ? '-' : valueFormat(score, 1)}
                  </Text>
                </TextContent>
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
