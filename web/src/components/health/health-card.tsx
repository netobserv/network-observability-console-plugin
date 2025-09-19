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
import { ByResource } from './health-helper';

export interface HealthCardProps {
  stats: ByResource;
  kind?: string;
  isDark: boolean;
  isSelected: boolean;
  onClick?: () => void;
}

export const HealthCard: React.FC<HealthCardProps> = ({ stats, kind, isDark, isSelected, onClick }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const pending = [...stats.critical.pending, ...stats.warning.pending, ...stats.other.pending];
  const silenced = [...stats.critical.silenced, ...stats.warning.silenced, ...stats.other.silenced];
  const classes = ['card'];
  let icon = <InfoAltIcon className="icon" />;
  if (stats.critical.firing.length > 0) {
    classes.push('critical');
    icon = <ExclamationCircleIcon className="icon critical" />;
  } else if (stats.warning.firing.length > 0) {
    classes.push('warning');
    icon = <ExclamationTriangleIcon className="icon warning" />;
  } else if (stats.other.firing.length > 0) {
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
          selectableActionId: stats.name,
          selectableActionAriaLabelledby: `selectable-card-${stats.name}`,
          variant: 'single',
          onClickAction: onClick
        }}
      >
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>{icon}</FlexItem>
          <FlexItem>
            <CardTitle>{kind ? <ResourceLink inline={true} kind={kind} name={stats.name} /> : t('Global')}</CardTitle>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem grow={{ default: 'grow' }}>
            <ul style={{ listStyleType: 'none' }}>
              {stats.critical.firing.length > 0 && (
                <li>
                  {stats.critical.firing.length} {t('critical issues')}
                </li>
              )}
              {stats.warning.firing.length > 0 && (
                <li>
                  {stats.warning.firing.length} {t('warnings')}
                </li>
              )}
              {stats.other.firing.length > 0 && (
                <li>
                  {stats.other.firing.length} {t('minor issues')}
                </li>
              )}
              {pending.length > 0 && (
                <li>
                  {pending.length} {t('pending issues')}
                </li>
              )}
              {silenced.length > 0 && (
                <li>
                  {silenced.length} {t('silenced issues')}
                </li>
              )}
            </ul>
          </FlexItem>
          <FlexItem>
            <TextContent>
              <Text component={TextVariants.h1}>{valueFormat(stats.score)}</Text>
            </TextContent>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
