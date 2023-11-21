import { FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { GlobeAmericasIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import './query-summary.css';

export const StatsQuerySummary: React.FC<{
  lastRefresh: Date;
  numQueries?: number;
}> = ({ numQueries, lastRefresh }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <FlexItem>
      <Tooltip
        content={
          <Text component={TextVariants.p}>
            {t('Last refresh: {{time}}', {
              time: lastRefresh.toLocaleTimeString()
            })}
            {numQueries && ` ${t('running')} ${numQueries} ${numQueries > 1 ? t('queries') : t('query')}`}
          </Text>
        }
      >
        <div className="stats-query-summary-container-with-icon">
          <GlobeAmericasIcon />
          <Text id="lastRefresh" component={TextVariants.p}>
            {lastRefresh.toLocaleTimeString()}
            {numQueries && ` ${t('running')} ${numQueries} ${numQueries > 1 ? t('queries') : t('query')}`}
          </Text>
        </div>
      </Tooltip>
    </FlexItem>
  );
};

export default StatsQuerySummary;
