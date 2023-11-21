import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { DomainIcon, TachometerAltIcon, OutlinedClockIcon } from '@patternfly/react-icons';
import { getRateMetricKey, NetflowMetrics, Stats } from '../../api/loki';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';
import { valueFormat } from '../../utils/format';
import './query-summary.css';
import StatsQuerySummary from './stats-query-summary';

const EXPOSED_METRICS: MetricType[] = ['bytes', 'packets', 'droppedBytes', 'droppedPackets', 'dnsLatencies', 'flowRtt'];

export const MetricsQuerySummaryContent: React.FC<{
  metrics: NetflowMetrics;
  numQueries?: number;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
  isDark?: boolean;
}> = ({ metrics, numQueries, lastRefresh, direction, className, isShowQuerySummary, toggleQuerySummary, isDark }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const getMetrics = React.useCallback(
    (metricType: MetricType) => {
      switch (metricType) {
        case 'bytes':
        case 'packets':
          return metrics.rateMetrics?.[getRateMetricKey(metricType)];
        case 'droppedBytes':
        case 'droppedPackets':
          return metrics.droppedRateMetrics?.[getRateMetricKey(metricType)];
        case 'dnsLatencies':
          return metrics.dnsLatencyMetrics?.avg;
        case 'flowRtt':
          return metrics.rttMetrics?.avg;
        default:
          return undefined;
      }
    },
    [metrics]
  );

  const getAppMetrics = React.useCallback(
    (metricType: MetricType) => {
      switch (metricType) {
        case 'bytes':
        case 'packets':
          return metrics.totalRateMetric?.[getRateMetricKey(metricType)];
        case 'droppedBytes':
        case 'droppedPackets':
          return metrics.totalDroppedRateMetric?.[getRateMetricKey(metricType)];
        case 'dnsLatencies':
          return metrics.totalDnsLatencyMetric?.avg;
        case 'flowRtt':
          return metrics.totalRttMetric?.avg;
        default:
          return undefined;
      }
    },
    [metrics]
  );

  const counters = React.useCallback(
    (metricType: MetricType) => {
      const metrics = getMetrics(metricType);
      const appMetrics = getAppMetrics(metricType);
      if (!metrics || _.isEmpty(metrics)) {
        return undefined;
      }
      const avgSum = metrics.map(m => m.stats.avg).reduce((prev, cur) => prev + cur, 0);
      const absTotal = metrics.map(m => m.stats.total).reduce((prev, cur) => prev + cur, 0);

      switch (metricType) {
        case 'bytes':
        case 'droppedBytes': {
          const textColor = metricType === 'droppedBytes' ? (isDark ? '#C9190B' : '#A30000') : undefined;
          const droppedText = metricType === 'droppedBytes' ? ' ' + t('dropped') : '';
          const textAbs = appMetrics
            ? `${t('Filtered sum of top-k bytes')}${droppedText} / ${t('Filtered total bytes')}${droppedText}`
            : `${t('Filtered sum of top-k bytes')}${droppedText}`;
          const textRate = appMetrics
            ? `${t('Filtered top-k byte rate')}${droppedText} / ${t('Filtered total byte rate')}${droppedText}`
            : `${t('Filtered top-k byte rate')}${droppedText}`;
          const valAbs = appMetrics
            ? valueFormat(absTotal, 1, t('B')) + ' / ' + valueFormat(appMetrics.stats.total, 1, t('B'))
            : valueFormat(absTotal, 1, t('B'));
          const valRate = appMetrics
            ? valueFormat(avgSum, 2, t('Bps')) + ' / ' + valueFormat(appMetrics.stats.avg, 2, t('Bps'))
            : valueFormat(avgSum, 2, t('Bps'));
          return [
            <FlexItem key="bytesCount">
              <Tooltip content={<Text component={TextVariants.p}>{textAbs}</Text>}>
                <div className="stats-query-summary-container">
                  <Text id="bytesCount" component={TextVariants.p} style={{ color: textColor }}>
                    {valAbs}
                  </Text>
                </div>
              </Tooltip>
            </FlexItem>,
            <FlexItem key="bpsCount">
              <Tooltip content={<Text component={TextVariants.p}>{textRate}</Text>}>
                <div className="stats-query-summary-container-with-icon">
                  <TachometerAltIcon />
                  <Text id="bpsCount" component={TextVariants.p} style={{ color: textColor }}>
                    {valRate}
                  </Text>
                </div>
              </Tooltip>
            </FlexItem>
          ];
        }
        case 'packets':
        case 'droppedPackets': {
          const textColor = metricType === 'droppedPackets' ? (isDark ? '#C9190B' : '#A30000') : undefined;
          const droppedText = metricType === 'droppedPackets' ? ' ' + t('dropped') : '';
          const textAbs = appMetrics
            ? `${t('Filtered sum of top-k packets')}${droppedText} / ${t('Filtered total packets')}${droppedText}`
            : `${t('Filtered sum of top-k packets')}${droppedText}`;
          const valAbs =
            (appMetrics ? `${absTotal} / ${appMetrics.stats.total}` : String(absTotal)) + ' ' + t('packets');
          return [
            <FlexItem key="packetsCount">
              <Tooltip content={<Text component={TextVariants.p}>{textAbs}</Text>}>
                <div className="stats-query-summary-container">
                  <Text id="packetsCount" component={TextVariants.p} style={{ color: textColor }}>
                    {valAbs}
                  </Text>
                </div>
              </Tooltip>
            </FlexItem>
          ];
        }
        case 'dnsLatencies': {
          const textAvg = appMetrics
            ? `${t('Filtered avg DNS Latency')} | ${t('Filtered overall avg DNS Latency')}`
            : t('Filtered avg DNS Latency');
          const valAvg = appMetrics
            ? `${valueFormat(avgSum / metrics.length, 2, t('ms'))} | ${valueFormat(appMetrics.stats.avg, 2, t('ms'))}`
            : String(valueFormat(avgSum / metrics.length, 2, t('ms')));
          return [
            <FlexItem key="dnsAvg">
              <Tooltip content={<Text component={TextVariants.p}>{textAvg}</Text>}>
                <div className="stats-query-summary-container-with-icon">
                  <DomainIcon />
                  <Text id="dnsAvg" component={TextVariants.p}>
                    {valAvg}
                  </Text>
                </div>
              </Tooltip>
            </FlexItem>
          ];
        }
        case 'flowRtt': {
          const textAvg = appMetrics ? `${t('Filtered avg RTT')} | ${t('Overall avg RTT')}` : t('Filtered avg RTT');
          const valAvg = appMetrics
            ? `${valueFormat(avgSum / metrics.length, 2, t('ms'))} | ${valueFormat(appMetrics.stats.avg, 2, t('ms'))}`
            : String(valueFormat(avgSum / metrics.length, 2, t('ms')));
          return [
            <FlexItem key="rttAvg">
              <Tooltip content={<Text component={TextVariants.p}>{textAvg}</Text>}>
                <div className="stats-query-summary-container-with-icon">
                  <OutlinedClockIcon />
                  <Text id="rttAvg" component={TextVariants.p}>
                    {valAvg}
                  </Text>
                </div>
              </Tooltip>
            </FlexItem>
          ];
        }
        default: {
          return undefined;
        }
      }
    },
    [getAppMetrics, getMetrics, isDark, t]
  );

  const metricsToShow = React.useCallback(() => {
    const filtered = EXPOSED_METRICS.filter(mt => getMetrics(mt) !== undefined).flatMap((mt: MetricType) =>
      counters(mt)
    );
    // limit the number of metrics to show horizontally since we don't have enough room
    if (direction === 'row') {
      return filtered.slice(0, 5);
    }
    return filtered;
  }, [counters, direction, getMetrics]);

  return (
    <Flex
      id="query-summary-content"
      className={`${className} ${direction === 'row' ? 'center' : ''}`}
      direction={{ default: direction }}
    >
      {direction === 'row' && (
        <FlexItem key="title">
          <Text id="query-summary-title" component={TextVariants.h4}>
            {t('Summary')}
          </Text>
        </FlexItem>
      )}
      {metricsToShow()}
      {lastRefresh && (
        <FlexItem key="stats">
          <StatsQuerySummary lastRefresh={lastRefresh} numQueries={direction === 'column' ? numQueries : undefined} />
        </FlexItem>
      )}
      {direction === 'row' && toggleQuerySummary && (
        <FlexItem key="toggle">
          <Text id="query-summary-toggle" component={TextVariants.a} onClick={toggleQuerySummary}>
            {isShowQuerySummary ? t('See less') : t('See more')}
          </Text>
        </FlexItem>
      )}
    </Flex>
  );
};

export const MetricsQuerySummary: React.FC<{
  stats: Stats | undefined;
  metrics: NetflowMetrics;
  lastRefresh: Date | undefined;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
  isDark?: boolean;
}> = ({ metrics, stats, lastRefresh, isShowQuerySummary, toggleQuerySummary, isDark }) => {
  return (
    <Card id="query-summary" isFlat>
      <MetricsQuerySummaryContent
        direction="row"
        metrics={metrics}
        numQueries={stats?.numQueries}
        lastRefresh={lastRefresh}
        isShowQuerySummary={isShowQuerySummary}
        toggleQuerySummary={toggleQuerySummary}
        isDark={isDark}
      />
    </Card>
  );
};

export default MetricsQuerySummary;
