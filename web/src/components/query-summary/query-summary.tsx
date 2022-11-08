import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRange } from '../../utils/datetime';
import { Record } from '../../api/ipfix';
import { InfoCircleIcon } from '@patternfly/react-icons';
import './query-summary.css';
import { byteFormat, byteRateFormat } from '../../utils/format';
import { Stats, TopologyMetrics } from '../../api/loki';
import _ from 'lodash';
import { MetricType } from 'src/model/flow-query';

export const QuerySummaryContent: React.FC<{
  flows: Record[] | undefined;
  metrics: TopologyMetrics[] | undefined;
  appMetrics: TopologyMetrics[] | undefined;
  metricType: MetricType;
  limitReached: boolean;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  flows,
  metrics,
  appMetrics,
  metricType,
  limitReached,
  range,
  lastRefresh,
  direction,
  className,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let rangeInSeconds: number;
  if (typeof range === 'number') {
    rangeInSeconds = range;
  } else {
    rangeInSeconds = (range.to - range.from) / 1000;
  }

  const counters = React.useCallback(() => {
    const bytes = !_.isEmpty(flows)
      ? flows!.map(f => f.fields.Bytes).reduce((a, b) => a + b, 0)
      : !_.isEmpty(metrics) && metricType === 'bytes'
      ? metrics![0].stats.total
      : 0;

    const totalBytes = !_.isEmpty(appMetrics) && metricType === 'bytes' ? appMetrics![0].stats.total : 0;

    const packets = !_.isEmpty(flows)
      ? flows!.map(f => f.fields.Packets).reduce((a, b) => a + b, 0)
      : !_.isEmpty(metrics) && metricType === 'packets'
      ? metrics![0].stats.total
      : 0;

    const totalPackets = !_.isEmpty(appMetrics) && metricType === 'packets' ? appMetrics![0].stats.total : 0;

    return (
      <>
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of bytes')}</Text>}>
              <Text id="bytesCount" component={TextVariants.p}>
                {`${byteFormat(bytes, 0, !_.isEmpty(flows) && limitReached)}${
                  totalBytes > 0 ? ' / ' + byteFormat(totalBytes, 0) : ''
                }`}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {packets > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of packets')}</Text>}>
              <Text id="packetsCount" component={TextVariants.p}>
                {`${packets}${!_.isEmpty(flows) && limitReached ? '+' : ''}${
                  totalPackets > 0 ? ' / ' + totalPackets : ''
                } ${t('packets')}`}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered average speed')}</Text>}>
              <Text id="bpsCount" component={TextVariants.p}>
                {`${byteRateFormat(bytes / rangeInSeconds, 2, !_.isEmpty(flows) && limitReached)}${
                  totalBytes > 0 ? ' / ' + byteRateFormat(totalBytes / rangeInSeconds, 2) : ''
                }`}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
      </>
    );
  }, [appMetrics, flows, limitReached, metricType, metrics, rangeInSeconds, t]);

  return (
    <Flex id="query-summary-content" className={className} direction={{ default: direction }}>
      {direction === 'row' && (
        <FlexItem>
          <Text id="query-summary-title" component={TextVariants.h4}>
            {t('Summary')}
          </Text>
        </FlexItem>
      )}
      {!_.isEmpty(flows) && (
        <FlexItem>
          <Flex direction={{ default: 'row' }}>
            {limitReached && (
              <FlexItem id="query-summary-warning-icon-container">
                <Tooltip content={<Text component={TextVariants.p}>{t('Query limit reached')}</Text>}>
                  <InfoCircleIcon className="query-summary-warning" />
                </Tooltip>
              </FlexItem>
            )}
            <FlexItem>
              <Tooltip content={<Text component={TextVariants.p}>{t('Filtered flows count')}</Text>}>
                <Text id="flowsCount" component={TextVariants.p}>
                  {`${flows!.length}${limitReached ? '+' : ''} ${t('flows')}`}
                </Text>
              </Tooltip>
            </FlexItem>
          </Flex>
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

export const QuerySummary: React.FC<{
  flows: Record[] | undefined;
  metrics: TopologyMetrics[] | undefined;
  appMetrics: TopologyMetrics[] | undefined;
  metricType: MetricType;
  stats: Stats | undefined;
  appStats: Stats | undefined;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  flows,
  metrics,
  appMetrics,
  metricType,
  stats,
  range,
  lastRefresh,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  if ((!_.isEmpty(flows) || !_.isEmpty(metrics)) && stats) {
    return (
      <Card id="query-summary" isFlat>
        <QuerySummaryContent
          direction="row"
          flows={flows}
          metrics={metrics}
          appMetrics={appMetrics}
          metricType={metricType}
          limitReached={stats.limitReached}
          range={range}
          lastRefresh={lastRefresh}
          isShowQuerySummary={isShowQuerySummary}
          toggleQuerySummary={toggleQuerySummary}
        />
      </Card>
    );
  }
  return <></>;
};

export default QuerySummary;
