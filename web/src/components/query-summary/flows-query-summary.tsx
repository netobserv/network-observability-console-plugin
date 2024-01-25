import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { rangeToSeconds, TimeRange } from '../../utils/datetime';
import { Record } from '../../api/ipfix';
import { InfoCircleIcon } from '@patternfly/react-icons';
import './query-summary.css';
import { valueFormat } from '../../utils/format';
import { Stats } from '../../api/loki';
import { RecordType } from '../../model/flow-query';
import _ from 'lodash';
import StatsQuerySummary from './stats-query-summary';

export const FlowsQuerySummaryContent: React.FC<{
  flows: Record[];
  type: RecordType;
  numQueries?: number;
  limitReached: boolean;
  range: number | TimeRange;
  loading?: boolean;
  lastRefresh?: Date;
  lastDuration?: number;
  warningMessage?: string;
  slownessReason?: string;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  flows,
  type,
  numQueries,
  limitReached,
  range,
  loading,
  lastRefresh,
  lastDuration,
  warningMessage,
  slownessReason,
  direction,
  className,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const filteredFlows = flows.filter(
    r => !r.labels._RecordType || ['endConnection', 'flowLog'].includes(r.labels._RecordType)
  );

  const rangeInSeconds = rangeToSeconds(range);

  const counters = React.useCallback(() => {
    const bytes = filteredFlows.map(f => f.fields.Bytes || 0).reduce((a, b) => a + b, 0);
    const packets = filteredFlows.map(f => f.fields.Packets || 0).reduce((a, b) => a + b, 0);

    return (
      <>
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of bytes')}</Text>}>
              <Text id="bytesCount" component={TextVariants.p}>
                {valueFormat(bytes, 0, t('B'), limitReached)}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {packets > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered sum of packets')}</Text>}>
              <Text id="packetsCount" component={TextVariants.p}>
                {valueFormat(packets, 0, t('Packets'), limitReached, true)}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Text component={TextVariants.p}>{t('Filtered average speed')}</Text>}>
              <Text id="bytesPerSecondsCount" component={TextVariants.p}>
                {valueFormat(bytes / rangeInSeconds, 2, t('Bps'), limitReached)}
              </Text>
            </Tooltip>
          </FlexItem>
        )}
      </>
    );
  }, [filteredFlows, limitReached, rangeInSeconds, t]);

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
      <StatsQuerySummary
        detailed={direction === 'column'}
        loading={loading}
        lastRefresh={lastRefresh}
        lastDuration={lastDuration}
        numQueries={numQueries}
        warningMessage={warningMessage}
        slownessReason={slownessReason}
      />
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
              <Tooltip
                content={
                  <Text component={TextVariants.p}>
                    {type === 'flowLog' ? t('Filtered flows count') : t('Filtered ended conversations count')}
                  </Text>
                }
              >
                <Text id="flowsCount" component={TextVariants.p}>
                  {valueFormat(
                    filteredFlows!.length,
                    0,
                    type === 'flowLog' ? t('Flows') : t('Ended conversations'),
                    limitReached,
                    true
                  )}
                </Text>
              </Tooltip>
            </FlexItem>
          </Flex>
        </FlexItem>
      )}
      {counters()}
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
  stats?: Stats;
  type: RecordType;
  range: number | TimeRange;
  loading?: boolean;
  lastRefresh?: Date;
  lastDuration?: number;
  warningMessage?: string;
  slownessReason?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}> = ({
  flows,
  stats,
  type,
  range,
  loading,
  lastRefresh,
  lastDuration,
  warningMessage,
  slownessReason,
  isShowQuerySummary,
  toggleQuerySummary
}) => {
  if (!_.isEmpty(flows) && stats) {
    return (
      <Card id="query-summary" isFlat>
        <FlowsQuerySummaryContent
          direction="row"
          flows={flows}
          type={type}
          numQueries={stats.numQueries}
          limitReached={stats.limitReached}
          range={range}
          loading={loading}
          lastRefresh={lastRefresh}
          lastDuration={lastDuration}
          warningMessage={warningMessage}
          slownessReason={slownessReason}
          isShowQuerySummary={isShowQuerySummary}
          toggleQuerySummary={toggleQuerySummary}
        />
      </Card>
    );
  }
  return <></>;
};

export default FlowsQuerySummary;
