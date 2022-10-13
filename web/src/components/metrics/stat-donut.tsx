import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ChartDonut, ChartLabel, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import { NamedMetric } from '../../api/loki';
import { MetricType, MetricFunction } from '../../model/flow-query';
import { getFormattedRateValue, isUnknownPeer } from '../../utils/metrics';
import { getStat } from '../../model/topology';

import './metrics-content.css';

export type StatDonutProps = {
  id: string;
  stat: MetricFunction;
  limit: number;
  metricType: MetricType;
  topKMetrics: NamedMetric[];
  totalMetric: NamedMetric;
  showOthers: boolean;
  showInternal: boolean;
  showOutOfScope: boolean;
};

export const StatDonut: React.FC<StatDonutProps> = ({
  id,
  stat,
  limit,
  metricType,
  topKMetrics,
  totalMetric,
  showOthers,
  showInternal,
  showOutOfScope
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let total = getStat(totalMetric.stats, stat);
  let filtered = topKMetrics;
  if (!showOutOfScope) {
    filtered = filtered.filter(m => {
      if (isUnknownPeer(m.source) && isUnknownPeer(m.destination)) {
        // This is full out-of-scope traffic. If it's hidden, remove it also from total
        total -= getStat(m.stats, stat);
        return false;
      }
      return true;
    });
  }
  if (!showInternal) {
    filtered = filtered.filter(m => {
      if (m.isInternal) {
        // This is internal traffic. If it's hidden, remove it also from total
        total -= getStat(m.stats, stat);
        return false;
      }
      return true;
    });
  }

  const sliced = filtered
    .map(m => ({
      name: m.name,
      value: getStat(m.stats, stat)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const others = Math.max(0, total - sliced.reduce((prev, cur) => prev + cur.value, 0));
  if (showOthers) {
    if (others > 0) {
      sliced.push({ name: t('Others'), value: others });
    }
  } else {
    total -= others;
  }

  const legendData = sliced.map((m, idx) => ({
    childName: `${'area-'}${idx}`,
    name: m.name
  }));

  const legentComponent = (
    <ChartLegend labelComponent={<ChartLabel className={'small-chart-label'} />} data={legendData} />
  );

  return (
    <div
      id={id}
      className="metrics-content-div"
      style={{
        width: '600px',
        height: '600px',
        alignSelf: 'center'
      }}
    >
      <ChartDonut
        themeColor={ChartThemeColor.multiUnordered}
        constrainToVisibleArea
        legendData={legendData}
        legendOrientation="vertical"
        legendPosition="right"
        legendAllowWrap={true}
        legendComponent={legentComponent}
        labels={({ datum }) => datum.x}
        width={500}
        height={350}
        data={sliced.map(m => ({ x: `${m.name}: ${getFormattedRateValue(m.value, metricType)}`, y: m.value }))}
        padding={{
          bottom: 20,
          left: 20,
          right: 300,
          top: 20
        }}
        title={`${getFormattedRateValue(total, metricType)}`}
        subTitle={t('Total')}
      />
    </div>
  );
};
