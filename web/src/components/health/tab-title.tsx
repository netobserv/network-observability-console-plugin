import { TabTitleIcon, TabTitleText } from '@patternfly/react-core';
import {
  BellIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InfoAltIcon
} from '@patternfly/react-icons';
import * as React from 'react';
import { ByResource } from './helper';

export interface HealthTabTitleProps {
  title: string;
  stats: ByResource[];
}

export const HealthTabTitle: React.FC<HealthTabTitleProps> = ({ stats, title }) => {
  const icon = stats.some(s => s.critical.firing.length > 0) ? (
    <ExclamationCircleIcon className='icon critical' />
  ) : stats.some(s => s.warning.firing.length > 0) ? (
    <ExclamationTriangleIcon className='icon warning' />
  ) : stats.some(s => s.other.firing.length > 0) ? (
    <BellIcon className='icon minor' />
  ) : stats.some(s => s.critical.pending.length > 0) ||
    stats.some(s => s.warning.pending.length > 0) ||
    stats.some(s => s.other.pending.length > 0) ||
    stats.some(s => s.critical.silenced.length > 0) ||
    stats.some(s => s.warning.silenced.length > 0) ||
    stats.some(s => s.other.silenced.length > 0) ? (
    <InfoAltIcon />
  ) : (
    <CheckCircleIcon className='icon healthy' />
  );
  return (
    <>
      <TabTitleIcon>{icon}</TabTitleIcon>
      <TabTitleText>{title}</TabTitleText>
    </>
  );
};
