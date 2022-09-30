import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRange } from '../../utils/datetime';
import { Record } from '../../api/ipfix';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import './query-summary.css';
import { bytesPerSeconds, humanFileSize } from '../../utils/bytes';
import { Stats } from '../../api/loki';

export const QuerySummaryContent: React.FC<{
  flows: Record[];
  limitReached: boolean;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
}> = ({ flows, limitReached, range, lastRefresh, direction, className }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let rangeInSeconds: number;
  if (typeof range === 'number') {
    rangeInSeconds = range;
  } else {
    rangeInSeconds = (range.to - range.from) / 1000;
  }

  const totalBytes = flows.map(f => f.fields.Bytes).reduce((a, b) => a + b, 0);

  return (
    <Flex id="query-summary-content" className={className} direction={{ default: direction }}>
      <FlexItem>
        <Flex direction={{ default: 'row' }}>
          {limitReached && (
            <FlexItem>
              <Tooltip content={<Text component={TextVariants.p}>{t('Query limit reached')}</Text>}>
                <ExclamationTriangleIcon className="query-summary-warning" />
              </Tooltip>
            </FlexItem>
          )}
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered flows count')}</Text>}>
              <Text id="flowsCount" component={TextVariants.p} className={limitReached ? 'query-summary-warning' : ''}>
                {t('{{count}} flows', { count: flows.length })}
              </Text>
            </Tooltip>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of bytes')}</Text>}>
          <Text id="bytesCount" component={TextVariants.p}>
            {humanFileSize(totalBytes, true, 0)}
          </Text>
        </Tooltip>
      </FlexItem>
      <FlexItem>
        <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of packets')}</Text>}>
          <Text id="packetsCount" component={TextVariants.p}>
            {t('{{count}} packets', {
              count: flows.map(f => f.fields.Packets).reduce((a, b) => a + b, 0)
            })}
          </Text>
        </Tooltip>
      </FlexItem>
      <FlexItem>
        <Tooltip content={<Text component={TextVariants.p}>{t('Filtered average speed')}</Text>}>
          <Text id="bpsCount" component={TextVariants.p}>
            {bytesPerSeconds(totalBytes / rangeInSeconds)}
          </Text>
        </Tooltip>
      </FlexItem>
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
    </Flex>
  );
};

export const QuerySummary: React.FC<{
  flows: Record[] | undefined;
  stats: Stats | undefined;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  toggleQuerySummary: () => void;
}> = ({ flows, stats, range, lastRefresh, toggleQuerySummary }) => {
  if (flows && flows.length && stats && lastRefresh) {
    return (
      <Card id="query-summary" isSelectable onClick={toggleQuerySummary}>
        <QuerySummaryContent
          direction="row"
          flows={flows}
          limitReached={stats.limitReached}
          range={range}
          lastRefresh={lastRefresh}
        />
      </Card>
    );
  }
  return <></>;
};

export default QuerySummary;
