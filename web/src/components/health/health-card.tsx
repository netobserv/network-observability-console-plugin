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
import { ByResource, computeUnifiedScore, RecordingRulesByResource } from './health-helper';

export interface HealthCardProps {
  name?: string;
  kind?: string;
  alertInfo?: ByResource;
  recordingInfo?: RecordingRulesByResource;
  isDark: boolean;
  isSelected: boolean;
  onClick?: () => void;
}

export const HealthCard: React.FC<HealthCardProps> = ({
  name,
  kind,
  alertInfo,
  recordingInfo,
  isDark,
  isSelected,
  onClick
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const score = React.useMemo(() => computeUnifiedScore(alertInfo, recordingInfo), [alertInfo, recordingInfo]);

  // Combine counts from both alerts and recording rules
  const criticalCount = React.useMemo(
    () =>
      (alertInfo?.critical.firing.length || 0) +
      (alertInfo?.critical.pending.length || 0) +
      (recordingInfo?.critical.length || 0),
    [alertInfo, recordingInfo]
  );

  const warningCount = React.useMemo(
    () =>
      (alertInfo?.warning.firing.length || 0) +
      (alertInfo?.warning.pending.length || 0) +
      (recordingInfo?.warning.length || 0),
    [alertInfo, recordingInfo]
  );

  const infoCount = React.useMemo(
    () =>
      (alertInfo?.other.firing.length || 0) +
      (alertInfo?.other.pending.length || 0) +
      (recordingInfo?.other.length || 0),
    [alertInfo, recordingInfo]
  );

  const silencedCount = React.useMemo(
    () =>
      (alertInfo?.critical.silenced.length || 0) +
      (alertInfo?.warning.silenced.length || 0) +
      (alertInfo?.other.silenced.length || 0),
    [alertInfo]
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
        className="card-header"
        selectableActions={{
          selectableActionId: `health-card-${name || 'global'}`,
          selectableActionAriaLabelledby: `selectable-card-${name || 'global'}`,
          variant: 'single',
          onClickAction: onClick
        }}
      >
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>{icon}</FlexItem>
          <FlexItem>
            <CardTitle>{kind && name ? <ResourceLink inline={true} kind={kind} name={name} /> : t('Global')}</CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
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
