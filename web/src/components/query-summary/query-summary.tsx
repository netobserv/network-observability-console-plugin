import { Card, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TimeRange } from '../../utils/datetime';
import { Record } from '../../api/ipfix';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import './query-summary.css';
import { bytesPerSeconds, humanFileSize } from '../../utils/bytes';

export const QuerySummaryContent: React.FC<{
  flows: Record[];
  range: number | TimeRange;
  limit: number;
  direction: 'row' | 'column';
  className?: string;
}> = ({ flows, range, limit, direction, className }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  let rangeInSeconds: number;
  if (typeof range === 'number') {
    rangeInSeconds = range;
  } else {
    rangeInSeconds = (range.to - range.from) / 1000;
  }

  const limitReached = limit === flows.length;
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
            {bytesPerSeconds(totalBytes, rangeInSeconds)}
          </Text>
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};

export const QuerySummary: React.FC<{
  flows: Record[] | undefined;
  range: number | TimeRange;
  limit: number;
  toggleQuerySummary: () => void;
}> = ({ flows, range, limit, toggleQuerySummary }) => {
  if (flows && flows.length) {
    return (
      <Card id="query-summary" isSelectable onClick={toggleQuerySummary}>
        <QuerySummaryContent direction="row" flows={flows} range={range} limit={limit} />
      </Card>
    );
  }
  return <></>;
};

export default QuerySummary;
