import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Badge,
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
import { BellIcon, ExclamationCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { valueFormat } from '../../utils/format';
import { RecordingRulesByResource } from './health-helper';

export interface RecordingRuleCardProps {
  stats: RecordingRulesByResource;
  kind?: string;
  isDark: boolean;
  isSelected: boolean;
  onClick?: () => void;
}

export const RecordingRuleCard: React.FC<RecordingRuleCardProps> = ({ stats, kind, isDark, isSelected, onClick }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const classes = ['card'];
  let icon = <BellIcon className="icon" />;
  if (stats.critical.length > 0) {
    classes.push('critical');
    icon = <ExclamationCircleIcon className="icon critical" />;
  } else if (stats.warning.length > 0) {
    classes.push('warning');
    icon = <ExclamationTriangleIcon className="icon warning" />;
  } else if (stats.other.length > 0) {
    classes.push('minor');
    icon = <BellIcon className="icon minor" />;
  }
  if (isDark) {
    classes.push('dark');
  }

  const totalRules = stats.critical.length + stats.warning.length + stats.other.length;

  return (
    <Card className={classes.join(' ')} isClickable={onClick !== undefined} isClicked={isSelected}>
      <CardHeader
        className="card-header"
        selectableActions={{
          selectableActionId: `recording-${stats.name}`,
          selectableActionAriaLabelledby: `selectable-card-recording-${stats.name}`,
          variant: 'single',
          onClickAction: onClick
        }}
      >
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>{icon}</FlexItem>
          <FlexItem>
            <CardTitle>{kind ? <ResourceLink inline={true} kind={kind} name={stats.name} /> : t('Global')}</CardTitle>
          </FlexItem>
          <FlexItem>
            <Badge isRead>{t('Recording')}</Badge>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <ul style={{ listStyleType: 'none' }}>
              {stats.critical.length > 0 && (
                <li>
                  {stats.critical.length} {t('critical metrics')}
                </li>
              )}
              {stats.warning.length > 0 && (
                <li>
                  {stats.warning.length} {t('warning metrics')}
                </li>
              )}
              {stats.other.length > 0 && (
                <li>
                  {stats.other.length} {t('info metrics')}
                </li>
              )}
            </ul>
          </FlexItem>
          <FlexItem>
            <TextContent>
              <Text component={TextVariants.h1}>{totalRules}</Text>
            </TextContent>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
