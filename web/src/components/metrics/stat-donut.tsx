import { ChartDonut, ChartLabel, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NamedMetric } from '../../api/loki';
import { MetricFunction, MetricType } from '../../model/flow-query';
import { getStat } from '../../model/topology';
import { LOCAL_STORAGE_OVERVIEW_DONUT_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedRateValue, isUnknownPeer } from '../../utils/metrics';
import './metrics-content.css';
import { defaultDimensions, Dimensions, observe } from './metrics-helper';

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
  smallerTexts?: boolean;
  showLegend?: boolean;
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
  showOutOfScope,
  smallerTexts,
  showLegend
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
      shortName: m.shortName,
      fullName: m.fullName,
      value: getStat(m.stats, stat)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const others = Math.max(0, total - sliced.reduce((prev, cur) => prev + cur.value, 0));
  if (showOthers) {
    if (others > 0) {
      sliced.push({ fullName: t('Others'), shortName: t('Others'), value: others });
    }
  } else {
    total -= others;
  }

  const legendData = sliced.map((m, idx) => ({
    childName: `${'area-'}${idx}`,
    name: m.shortName
  }));

  const legentComponent = (
    <ChartLegend
      labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
      data={legendData}
    />
  );

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    LOCAL_STORAGE_OVERVIEW_DONUT_DIMENSION_KEY,
    defaultDimensions
  );
  React.useEffect(() => {
    observe(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  return (
    <div id={id} className="metrics-content-div" ref={containerRef} data-test-metrics={topKMetrics.length}>
      <ChartDonut
        themeColor={ChartThemeColor.multiUnordered}
        constrainToVisibleArea
        legendData={showLegend ? legendData : undefined}
        legendOrientation="vertical"
        legendPosition="right"
        legendAllowWrap={true}
        legendComponent={showLegend ? legentComponent : undefined}
        labels={({ datum }) => datum.x}
        //TODO: fix refresh on selection change to enable animation
        //animate={true}
        width={dimensions.width}
        height={dimensions.height}
        data={sliced.map(m => ({ x: `${m.fullName}: ${getFormattedRateValue(m.value, metricType, t)}`, y: m.value }))}
        padding={
          showLegend
            ? {
                bottom: 20,
                left: 20,
                right: 400,
                top: 20
              }
            : undefined
        }
        title={`${getFormattedRateValue(total, metricType, t)}`}
        subTitle={t('Total')}
      />
    </div>
  );
};
