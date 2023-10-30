import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { Stats, TopologyMetrics } from '../../api/loki';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';
import { valueFormat } from '../../utils/format';
import './query-summary.css';
import StatsQuerySummary from './stats-query-summary';

export const MetricsQuerySummaryContent: React.FC<{
  metrics: TopologyMetrics[];
  appMetrics: TopologyMetrics | undefined;
  metricType: MetricType;
  numQueries?: number;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  metrics,
  appMetrics,
  metricType,
  numQueries,
  lastRefresh,
  direction,
  className,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const counters = React.useCallback(() => {
    const avgSum = metrics.map(m => m.stats.avg).reduce((prev, cur) => prev + cur, 0);
    const absSum = metrics.map(m => m.stats.total).reduce((prev, cur) => prev + cur, 0);

    switch (metricType) {
      case 'bytes': {
        const textAbs = appMetrics
          ? t('Filtered sum of top-k bytes / filtered total bytes')
          : t('Filtered sum of bytes');
        const textRate = appMetrics
          ? t('Filtered top-k byte rate / filtered total byte rate')
          : t('Filtered byte rate');
        const valAbs = appMetrics
          ? valueFormat(absSum, 1, t('B')) + ' / ' + valueFormat(appMetrics.stats.total, 1, t('B'))
          : valueFormat(absSum, 1, t('B'));
        const valRate = appMetrics
          ? valueFormat(avgSum, 2, t('Bps')) + ' / ' + valueFormat(appMetrics.stats.avg, 2, t('Bps'))
          : valueFormat(avgSum, 2, t('Bps'));
        return (
          <>
            <FlexItem>
              <Tooltip content={<Text component={TextVariants.p}>{textAbs}</Text>}>
                <Text id="bytesCount" component={TextVariants.p}>
                  {valAbs}
                </Text>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <Tooltip content={<Text component={TextVariants.p}>{textRate}</Text>}>
                <Text id="bpsCount" component={TextVariants.p}>
                  {valRate}
                </Text>
              </Tooltip>
            </FlexItem>
          </>
        );
      }
      case 'packets': {
        const textAbs = appMetrics
          ? t('Filtered sum of top-k packets / filtered total packets')
          : t('Filtered sum of packets');
        const valAbs = (appMetrics ? `${absSum} / ${appMetrics.stats.total}` : String(absSum)) + ' ' + t('packets');
        return (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{textAbs}</Text>}>
              <Text id="packetsCount" component={TextVariants.p}>
                {valAbs}
              </Text>
            </Tooltip>
          </FlexItem>
        );
      }
      case 'flowRtt': {
        const textAvg = appMetrics ? t('Filtered avg RTT / filtered total avg RTT') : t('Filtered avg RTT');
        const valAvg =
          (appMetrics
            ? `${valueFormat(avgSum / metrics.length, 1)} / ${valueFormat(appMetrics.stats.avg, 1)}`
            : String(valueFormat(avgSum / metrics.length, 1))) +
          ' ' +
          t('ms');
        return (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{textAvg}</Text>}>
              <Text id="rttAvg" component={TextVariants.p}>
                {valAvg}
              </Text>
            </Tooltip>
          </FlexItem>
        );
      }
      default: {
        return <></>;
      }
    }
  }, [appMetrics, metricType, metrics, t]);

  return (
    <Flex
      id="query-summary-content"
      className={`${className} ${direction === 'row' ? 'center' : ''}`}
      direction={{ default: direction }}
    >
      {direction === 'row' && (
        <FlexItem>
          <Text id="query-summary-title" component={TextVariants.h4}>
            {t('Summary')}
          </Text>
        </FlexItem>
      )}
      {counters()}
      {lastRefresh && (
        <StatsQuerySummary lastRefresh={lastRefresh} numQueries={direction === 'column' ? numQueries : undefined} />
      )}
      {direction === 'row' && toggleQuerySummary && (
        <FlexItem>
          <Text id="query-summary-toggle" component={TextVariants.a} onClick={toggleQuerySummary}>
            {isShowQuerySummary ? t('See less') : t('See more')}
          </Text>
        </FlexItem>
      )}
    </Flex>
  );
};

export const MetricsQuerySummary: React.FC<{
  metrics: TopologyMetrics[];
  stats: Stats | undefined;
  droppedMetrics: TopologyMetrics[];
  appMetrics: TopologyMetrics | undefined;
  appDroppedMetrics: TopologyMetrics | undefined;
  metricType: MetricType;
  lastRefresh: Date | undefined;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({ metrics, stats, appMetrics, metricType, lastRefresh, isShowQuerySummary, toggleQuerySummary }) => {
  if (!_.isEmpty(metrics)) {
    return (
      <Card id="query-summary" isFlat>
        <MetricsQuerySummaryContent
          direction="row"
          metrics={metrics}
          appMetrics={appMetrics}
          metricType={metricType}
          numQueries={stats?.numQueries}
          lastRefresh={lastRefresh}
          isShowQuerySummary={isShowQuerySummary}
          toggleQuerySummary={toggleQuerySummary}
        />
      </Card>
    );
  }
  return <></>;
};

export default MetricsQuerySummary;
