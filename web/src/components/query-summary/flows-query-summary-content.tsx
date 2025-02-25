import { Content, ContentVariants, Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Record } from '../../api/ipfix';
import { RecordType } from '../../model/flow-query';
import { Warning } from '../../model/warnings';
import { rangeToSeconds, TimeRange } from '../../utils/datetime';
import { valueFormat } from '../../utils/format';
import StatsQuerySummary from './stats-query-summary';

export interface FlowsQuerySummaryContentProps {
  flows: Record[];
  type: RecordType;
  numQueries?: number;
  limitReached: boolean;
  range: number | TimeRange;
  loading?: boolean;
  lastRefresh?: Date;
  lastDuration?: number;
  warning?: Warning;
  direction: 'row' | 'column';
  className?: string;
  isShowQuerySummary?: boolean;
  toggleQuerySummary?: () => void;
}

export const FlowsQuerySummaryContent: React.FC<FlowsQuerySummaryContentProps> = ({
  flows,
  type,
  numQueries,
  limitReached,
  range,
  loading,
  lastRefresh,
  lastDuration,
  warning,
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
            <Tooltip content={<Content component={ContentVariants.p}>{t('Filtered sum of bytes')}</Content>}>
              <Content id="bytesCount" component={ContentVariants.p}>
                {valueFormat(bytes, 0, t('B'), limitReached)}
              </Content>
            </Tooltip>
          </FlexItem>
        )}
        {packets > 0 && (
          <FlexItem>
            <Tooltip content={<Content component={ContentVariants.p}>{t('Filtered sum of packets')}</Content>}>
              <Content id="packetsCount" component={ContentVariants.p}>
                {valueFormat(packets, 0, t('Packets'), limitReached, true)}
              </Content>
            </Tooltip>
          </FlexItem>
        )}
        {bytes > 0 && (
          <FlexItem>
            <Tooltip content={<Content component={ContentVariants.p}>{t('Filtered average speed')}</Content>}>
              <Content id="bytesPerSecondsCount" component={ContentVariants.p}>
                {valueFormat(bytes / rangeInSeconds, 2, t('Bps'), limitReached)}
              </Content>
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
          <Content id="query-summary-title" component={ContentVariants.h4}>
            {t('Summary')}
          </Content>
        </FlexItem>
      )}
      <StatsQuerySummary
        detailed={direction === 'column'}
        loading={loading}
        lastRefresh={lastRefresh}
        lastDuration={lastDuration}
        numQueries={numQueries}
        warning={warning}
      />
      {!_.isEmpty(flows) && (
        <FlexItem>
          <Flex direction={{ default: 'row' }}>
            {limitReached && (
              <FlexItem id="query-summary-warning-icon-container">
                <Tooltip content={<Content component={ContentVariants.p}>{t('Query limit reached')}</Content>}>
                  <InfoCircleIcon className="query-summary-warning" />
                </Tooltip>
              </FlexItem>
            )}
            <FlexItem>
              <Tooltip
                content={
                  <Content component={ContentVariants.p}>
                    {type === 'flowLog' ? t('Filtered flows count') : t('Filtered ended conversations count')}
                  </Content>
                }
              >
                <Content id="flowsCount" component={ContentVariants.p}>
                  {valueFormat(
                    filteredFlows!.length,
                    0,
                    type === 'flowLog' ? t('Flows') : t('Ended conversations'),
                    limitReached,
                    true
                  )}
                </Content>
              </Tooltip>
            </FlexItem>
          </Flex>
        </FlexItem>
      )}
      {counters()}
      {direction === 'row' && toggleQuerySummary && (
        <FlexItem>
          <Content id="query-summary-toggle" component={ContentVariants.a} onClick={toggleQuerySummary}>
            {isShowQuerySummary ? t('See less') : t('See more')}
          </Content>
        </FlexItem>
      )}
    </Flex>
  );
};

export default FlowsQuerySummaryContent;
