import { Content, ContentVariants, Flex, FlexItem } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyMetrics } from '../../../api/loki';
import { isTimeMetric, MetricType } from '../../../model/flow-query';
import { getStat } from '../../../model/metrics';
import { getFormattedValue } from '../../../utils/metrics';

export interface ElementPanelStatsProps {
  metricsIn: TopologyMetrics[];
  metricsOut: TopologyMetrics[];
  metricsBoth: TopologyMetrics[];
  metricType: MetricType;
  isEdge: boolean;
}

export const ElementPanelStats: React.FC<ElementPanelStatsProps> = ({
  metricsIn,
  metricsOut,
  metricsBoth,
  metricType,
  isEdge
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const isTime = isTimeMetric(metricType);
  const latestIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  const averageIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  const totalIn = metricsIn.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  const latestOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  const averageOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  const totalOut = metricsOut.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  let latestBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'last'), 0);
  let averageBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'avg'), 0);
  if (isTime) {
    latestBoth = latestIn && latestOut ? latestBoth / 2 : 0;
    averageBoth = averageIn && averageOut ? averageBoth / 2 : 0;
  }
  const totalBoth = metricsBoth.reduce((prev, cur) => prev + getStat(cur.stats, 'sum'), 0);
  return (
    <Flex className="metrics-justify-content">
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <FlexItem>
            <Content className="element-stats-title" component={ContentVariants.h4} />
          </FlexItem>
        </FlexItem>
        <FlexItem>
          <FlexItem>
            <Content className="element-stats-title" component={ContentVariants.h4}>
              {isTime ? t('Average time') : t('Average rate')}
            </Content>
          </FlexItem>
        </FlexItem>
        <FlexItem>
          <FlexItem>
            <Content className="element-stats-title" component={ContentVariants.h4}>
              {isTime ? t('Latest time') : t('Latest rate')}
            </Content>
          </FlexItem>
        </FlexItem>
        {!isTime ? (
          <FlexItem>
            <FlexItem>
              <Content className="element-stats-title" component={ContentVariants.h4}>
                {t('Total')}
              </Content>
            </FlexItem>
          </FlexItem>
        ) : (
          <></>
        )}
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Content id="metrics-stats-in">{isEdge ? t('A -> B') : t('In')}</Content>
        </FlexItem>
        <FlexItem>
          <Content id="metrics-stats-avg-in">
            {getFormattedValue(averageIn, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        <FlexItem>
          <Content id="metrics-stats-latest-in">
            {getFormattedValue(latestIn, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        {!isTime ? (
          <FlexItem>
            <Content id="metrics-stats-total-in">{getFormattedValue(totalIn, metricType, 'sum', t)}</Content>
          </FlexItem>
        ) : (
          <></>
        )}
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Content id="metrics-stats-out">{isEdge ? t('B -> A') : t('Out')}</Content>
        </FlexItem>
        <FlexItem>
          <Content id="metrics-stats-avg-out">
            {getFormattedValue(averageOut, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        <FlexItem>
          <Content id="metrics-stats-latest-out">
            {getFormattedValue(latestOut, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        {!isTime ? (
          <FlexItem>
            <Content id="metrics-stats-total-out">{getFormattedValue(totalOut, metricType, 'sum', t)}</Content>
          </FlexItem>
        ) : (
          <></>
        )}
      </Flex>
      <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
        <FlexItem>
          <Content id="metrics-stats-both">{t('Both')}</Content>
        </FlexItem>

        <FlexItem>
          <Content id="metrics-stats-avg-both">
            {getFormattedValue(averageBoth, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        <FlexItem>
          <Content id="metrics-stats-latest-both">
            {getFormattedValue(latestBoth, metricType, isTime ? 'avg' : 'rate', t)}
          </Content>
        </FlexItem>
        {!isTime ? (
          <FlexItem>
            <Content id="metrics-stats-total-both">{getFormattedValue(totalBoth, metricType, 'sum', t)}</Content>
          </FlexItem>
        ) : (
          <></>
        )}
      </Flex>
    </Flex>
  );
};
