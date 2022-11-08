import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRange } from '../../utils/datetime';
import { Record } from '../../api/ipfix';
import { InfoCircleIcon } from '@patternfly/react-icons';
import './query-summary.css';
import { byteFormat, byteRateFormat } from '../../utils/format';
import { Stats } from '../../api/loki';
import _ from 'lodash';

export const FlowsQuerySummaryContent: React.FC<{
  flows: Record[];
  limitReached: boolean;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({ flows, limitReached, range, lastRefresh, direction, className, isShowQuerySummary, toggleQuerySummary }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let rangeInSeconds: number;
  if (typeof range === 'number') {
    rangeInSeconds = range;
  } else {
    rangeInSeconds = (range.to - range.from) / 1000;
  }

  const counters = React.useCallback(() => {
    const bytes = flows.map(f => f.fields.Bytes).reduce((a, b) => a + b, 0);
    const packets = flows.map(f => f.fields.Packets).reduce((a, b) => a + b, 0);

    return (
      <>
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of bytes')}</Text>}>
              <Text id="bytesCount" component={TextVariants.p}>
                {byteFormat(bytes, 0, limitReached)}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {packets > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of packets')}</Text>}>
              <Text id="packetsCount" component={TextVariants.p}>
                {`${packets}${limitReached ? '+' : ''} ${t('packets')}`}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered average speed')}</Text>}>
              <Text id="bpsCount" component={TextVariants.p}>
                {byteRateFormat(bytes / rangeInSeconds, 2, limitReached)}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
      </>
    );
  }, [flows, limitReached, rangeInSeconds, t]);

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

export const FlowsQuerySummary: React.FC<{
  flows: Record[];
  stats: Stats | undefined;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({ flows, stats, range, lastRefresh, isShowQuerySummary, toggleQuerySummary }) => {
  if (!_.isEmpty(flows) && stats) {
    return (
      <Card id="query-summary" isFlat>
        <FlowsQuerySummaryContent
          direction="row"
          flows={flows}
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

export default FlowsQuerySummary;
