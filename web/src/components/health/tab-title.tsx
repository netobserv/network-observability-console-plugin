import { TabTitleIcon, TabTitleText } from '@patternfly/react-core';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoAltIcon
} from '@patternfly/react-icons';
import * as React from 'react';
import { getResourceSeverity, HealthStat } from './health-helper';

export interface HealthTabTitleProps {
  title: string;
  stats: HealthStat[];
}

export const HealthTabTitle: React.FC<HealthTabTitleProps> = ({ stats, title }) => {
  const severities = stats.map(getResourceSeverity);
  const icon = severities.includes('critical') ? (
    <ExclamationCircleIcon className="icon critical" />
  ) : severities.includes('warning') ? (
    <ExclamationTriangleIcon className="icon warning" />
  ) : severities.includes('info') ? (
    <BellIcon className="icon minor" />
  ) : severities.filter(s => s !== undefined).length > 0 ? (
    <InfoAltIcon />
  ) : (
    <CheckCircleIcon className="icon healthy" />
  );
  return (
    <>
      <TabTitleIcon>{icon}</TabTitleIcon>
      <TabTitleText>{title}</TabTitleText>
    </>
  );
};
