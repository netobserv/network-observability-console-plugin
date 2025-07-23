import { FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { ExclamationTriangleIcon, GlobeAmericasIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Warning } from '../../model/warnings';
import { formatDurationAboveMillisecond } from '../../utils/duration';
import './query-summary.css';

export interface StatsQuerySummaryProps {
  detailed?: boolean;
  loading?: boolean;
  lastRefresh?: Date;
  lastDuration?: number;
  warning?: Warning;
  numQueries?: number;
  dataSources?: string[];
}

export const StatsQuerySummary: React.FC<StatsQuerySummaryProps> = ({
  detailed,
  numQueries,
  dataSources,
  lastRefresh,
  lastDuration,
  loading,
  warning
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const dateText = lastRefresh ? lastRefresh.toLocaleTimeString() : t('Loading...');
  const durationText = lastDuration ? formatDurationAboveMillisecond(lastDuration) : '';

  const formatDatasources = React.useCallback(() => {
    return dataSources?.map(ds => (ds === 'prom' ? 'Prometheus' : ds === 'loki' ? 'Loki' : ds)).join(', ') || '';
  }, [dataSources]);

  return (
    <FlexItem>
      <Tooltip
        content={
          <>
            <Text>
              {lastRefresh
                ? t('Last refresh: {{time}}', {
                    time: dateText
                  })
                : dateText}
            </Text>
            {dataSources?.length && <Text>{t('Datasource(s): {{sources}}', { sources: formatDatasources() })}</Text>}
            {numQueries && <Text>{t('Query count: {{numQueries}}', { numQueries })}</Text>}
            {durationText !== '' && <Text>{t('Duration: {{duration}}', { duration: durationText })}</Text>}
            {warning !== undefined && (
              <>
                <br />
                <Text>{warning.summary}</Text>
                <Text>{warning.details}</Text>
              </>
            )}
          </>
        }
      >
        <div className={`stats-query-summary-container-with-icon ${loading ? 'stats-loading-blink' : ''}`}>
          {warning !== undefined ? <ExclamationTriangleIcon /> : <GlobeAmericasIcon />}
          <Text id="lastRefresh" component={TextVariants.p}>
            {dateText}
            {detailed && numQueries && ` ${t('running')} ${numQueries} ${numQueries > 1 ? t('queries') : t('query')}`}
            {detailed && dataSources?.length && ` ${t('from')} ${formatDatasources()}`}
            {detailed && durationText !== '' && ` ${t('in')} ${durationText}`}
          </Text>
        </div>
      </Tooltip>
    </FlexItem>
  );
};

export default StatsQuerySummary;
