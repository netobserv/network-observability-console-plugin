import * as React from 'react';
import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { valueFormat } from '../../utils/format';
import { TopologyMetrics } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import './query-summary.css';

export const MetricsQuerySummaryContent: React.FC<{
  metrics: TopologyMetrics[];
  appMetrics: TopologyMetrics | undefined;
  metricType: MetricType;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  metrics,
  appMetrics,
  metricType,
  lastRefresh,
  direction,
  className,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const counters = React.useCallback(() => {
    const rateSum = metrics.map(m => m.stats.avg).reduce((prev, cur) => prev + cur, 0);
    const absSum = metrics.map(m => m.stats.total).reduce((prev, cur) => prev + cur, 0);
    if (metricType === 'bytes') {
      const textAbs = appMetrics ? t('Filtered sum of top-k bytes / filtered total bytes') : t('Filtered sum of bytes');
      const textRate = appMetrics ? t('Filtered top-k byte rate / filtered total byte rate') : t('Filtered byte rate');
      const valAbs = appMetrics
        ? valueFormat(absSum, 1, t('B')) + ' / ' + valueFormat(appMetrics.stats.total, 1, t('B'))
        : valueFormat(absSum, 1, t('B'));
      const valRate = appMetrics
        ? valueFormat(rateSum, 2, t('Bps')) + ' / ' + valueFormat(appMetrics.stats.avg, 2, t('Bps'))
        : valueFormat(rateSum, 2, t('Bps'));
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
    } else {
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
  }, [appMetrics, metricType, metrics, t]);

  return (
    <Flex id="query-summary-content" className={className} direction={{ default: direction }}>
      {direction === 'row' && (
        <FlexItem>
          <Text id="query-summary-title" component={TextVariants.h4}>
            {t('Summary')}
          </Text>
        </FlexItem>
      )}
      {counters()}
      <FlexItem>
        <Tooltip
          content={
            <Text component={TextVariants.p}>
              {t('Last refresh: {{time}}', {
                time: lastRefresh ? lastRefresh.toLocaleString() : ''
              })}
            </Text>
          }
        >
          <Text id="lastRefresh" component={TextVariants.p}>
            {lastRefresh ? lastRefresh.toLocaleTimeString() : ''}
          </Text>
        </Tooltip>
      </FlexItem>
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
  droppedMetrics: TopologyMetrics[];
  appMetrics: TopologyMetrics | undefined;
  appDroppedMetrics: TopologyMetrics | undefined;
  metricType: MetricType;
  lastRefresh: Date | undefined;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({ metrics, appMetrics, metricType, lastRefresh, isShowQuerySummary, toggleQuerySummary }) => {
  if (!_.isEmpty(metrics)) {
    return (
      <Card id="query-summary" isFlat>
        <MetricsQuerySummaryContent
          direction="row"
          metrics={metrics}
          appMetrics={appMetrics}
          metricType={metricType}
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
