import { Flex, FlexItem, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { getStat } from '../../model/topology';
import { getFormattedValue } from '../../utils/metrics';

export const ElementPanelStats: React.FC<{
  metricsIn: TopologyMetrics[];
  metricsOut: TopologyMetrics[];
  metricsBoth: TopologyMetrics[];
  metricType: MetricType;
  isEdge: boolean;
}> = ({ metricsIn, metricsOut, metricsBoth, metricType, isEdge }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const latestIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  const averageIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  const totalIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  const latestOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  const averageOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  const totalOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  const latestBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  const averageBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  const totalBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  return (
    <Flex className="metrics-justify-content">
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <FlexItem>
            <Text className="element-stats-title" component={TextVariants.h4} />
          </FlexItem>
        </FlexItem>
        <FlexItem>
          <FlexItem>
            <Text className="element-stats-title" component={TextVariants.h4}>
              {t('Average rate')}
            </Text>
          </FlexItem>
        </FlexItem>
        <FlexItem>
          <FlexItem>
            <Text className="element-stats-title" component={TextVariants.h4}>
              {t('Latest rate')}
            </Text>
          </FlexItem>
        </FlexItem>
        <FlexItem>
          <FlexItem>
            <Text className="element-stats-title" component={TextVariants.h4}>
              {t('Total')}
            </Text>
          </FlexItem>
        </FlexItem>
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Text id="metrics-stats-in">{isEdge ? t('A -> B') : t('In')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-avg-in">{getFormattedValue(averageIn, metricType, 'avg')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-latest-in">{getFormattedValue(latestIn, metricType, 'last')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-total-in">{getFormattedValue(totalIn, metricType, 'sum')}</Text>
        </FlexItem>
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Text id="metrics-stats-out">{isEdge ? t('B -> A') : t('Out')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-avg-out">{getFormattedValue(averageOut, metricType, 'avg')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-latest-out">{getFormattedValue(latestOut, metricType, 'last')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-total-out">{getFormattedValue(totalOut, metricType, 'sum')}</Text>
        </FlexItem>
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Text id="metrics-stats-both">{t('Both')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-avg-both">{getFormattedValue(averageBoth, metricType, 'avg')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-latest-both">{getFormattedValue(latestBoth, metricType, 'last')}</Text>
        </FlexItem>
        <FlexItem>
          <Text id="metrics-stats-total-both">{getFormattedValue(totalBoth, metricType, 'sum')}</Text>
        </FlexItem>
      </Flex>
    </Flex>
  );
};
