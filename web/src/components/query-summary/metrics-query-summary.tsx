import { Card } from '@patternfly/react-core';
import * as React from 'react';
import { NetflowMetrics, Stats } from '../../api/loki';
import { MetricsQuerySummaryContent } from './metrics-query-summary-content';
import './query-summary.css';

export interface MetricsQuerySummaryProps {
  stats?: Stats;
  metrics: NetflowMetrics;
  loading?: boolean;
  lastRefresh?: Date;
  lastDuration?: number;
  warningMessage?: string;
  slownessReason?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
  isDark?: boolean;
}

export const MetricsQuerySummary: React.FC<MetricsQuerySummaryProps> = ({
  metrics,
  stats,
  loading,
  lastRefresh,
  lastDuration,
  warningMessage,
  slownessReason,
  isShowQuerySummary,
  toggleQuerySummary,
  isDark
}) => {
  return (
    <Card id="query-summary" isFlat>
      <MetricsQuerySummaryContent
        direction="row"
        metrics={metrics}
        numQueries={stats?.numQueries}
        dataSources={stats?.dataSources}
        loading={loading}
        lastRefresh={lastRefresh}
        lastDuration={lastDuration}
        warningMessage={warningMessage}
        slownessReason={slownessReason}
        isShowQuerySummary={isShowQuerySummary}
        toggleQuerySummary={toggleQuerySummary}
        isDark={isDark}
      />
    </Card>
  );
};

export default MetricsQuerySummary;
