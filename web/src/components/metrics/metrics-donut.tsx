import { ChartDonut, ChartLabel, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericMetric, MetricStats, NamedMetric } from '../../api/loki';
import { MetricFunction, MetricType } from '../../model/flow-query';
import { getStat } from '../../model/metrics';
import { localStorageOverviewDonutDimensionKey, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedValue, isUnknownPeer } from '../../utils/metrics';
import { defaultDimensions, Dimensions, observeDimensions } from '../../utils/metrics-helper';
import './metrics-content.css';

export interface MetricsDonutProps {
  id: string;
  subTitle?: string;
  limit: number;
  metricType: MetricType;
  metricFunction: MetricFunction;
  topKMetrics: GenericMetric[] | NamedMetric[];
  totalMetric: GenericMetric | NamedMetric;
  showOthers: boolean;
  othersName?: string;
  showLast?: boolean;
  showInternal?: boolean;
  showOutOfScope?: boolean;
  smallerTexts?: boolean;
  showLegend?: boolean;
  animate?: boolean;
  isDark?: boolean;
}

export const MetricsDonut: React.FC<MetricsDonutProps> = ({
  id,
  subTitle,
  metricFunction,
  limit,
  metricType,
  topKMetrics,
  totalMetric,
  showOthers,
  othersName,
  showLast,
  showInternal,
  showOutOfScope,
  smallerTexts,
  showLegend,
  animate,
  isDark
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const getStats = React.useCallback(
    (stats: MetricStats) => {
      return getStat(stats, showLast ? 'last' : metricFunction);
    },
    [metricFunction, showLast]
  );

  let total = getStats(totalMetric.stats);
  let filtered = topKMetrics;
  if (showOutOfScope === false) {
    filtered = (filtered as NamedMetric[]).filter(m => {
      if (isUnknownPeer(m.source) && isUnknownPeer(m.destination)) {
        // This is full out-of-scope traffic. If it's hidden, remove it also from total
        total -= getStats(m.stats);
        return false;
      }
      return true;
    });
  }
  if (showInternal === false) {
    filtered = (filtered as NamedMetric[]).filter(m => {
      if (m.isInternal) {
        // This is internal traffic. If it's hidden, remove it also from total
        total -= getStats(m.stats);
        return false;
      }
      return true;
    });
  }
  if (showOthers === false && othersName) {
    // remove others from generic metrics (DNS rcode NoError)
    filtered = (filtered as GenericMetric[]).filter(m => !othersName || m.name !== othersName);
  }

  let sliced = filtered
    .map(m => ({
      name: (m as NamedMetric).fullName || (m as GenericMetric).name,
      shortName: (m as NamedMetric).shortName || (m as GenericMetric).name,
      fullName: (m as NamedMetric).fullName || (m as GenericMetric).name,
      value: getStats(m.stats)
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const others = Math.max(0, total - sliced.reduce((prev, cur) => prev + cur.value, 0));
  if (showOthers) {
    if (others > 0 && !othersName) {
      sliced = [
        ...sliced,
        {
          name: t('Others'),
          fullName: t('Others'),
          shortName: t('Others'),
          value: others
        }
      ];
    }
  } else {
    total -= others;
    sliced = sliced.filter(m => m.name !== (othersName || t('Others')));
  }

  const legendData = sliced.map((m, idx) => ({
    childName: `${'area-'}${idx}`,
    name: m.name
  }));

  const legentComponent = (
    <ChartLegend
      labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
      data={legendData}
    />
  );

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    `${localStorageOverviewDonutDimensionKey}${showLegend ? '-legend' : ''}`,
    defaultDimensions
  );
  React.useEffect(() => {
    observeDimensions(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  return (
    <div
      id={id}
      className={`metrics-content-div ${isDark ? 'dark' : 'light'}`}
      ref={containerRef}
      data-test-metrics={topKMetrics.length}
    >
      <ChartDonut
        themeColor={ChartThemeColor.multiUnordered}
        constrainToVisibleArea
        legendData={showLegend ? legendData : undefined}
        legendOrientation="vertical"
        legendPosition="right"
        legendAllowWrap={true}
        legendComponent={showLegend ? legentComponent : undefined}
        radius={showLegend ? dimensions.height / 3 : undefined}
        innerRadius={showLegend ? dimensions.height / 4 : undefined}
        width={dimensions.width}
        height={dimensions.height}
        data={sliced.map(m => ({
          x: showLegend ? `${m.name}: ${getFormattedValue(m.value, metricType, metricFunction, t)}` : ' ',
          y: m.value
        }))}
        allowTooltip={showLegend}
        animate={animate}
        padding={
          showLegend
            ? {
                bottom: 20,
                left: 20,
                right: 400,
                top: 20
              }
            : {
                bottom: 0,
                left: 0,
                right: 0,
                top: 0
              }
        }
        title={`${getFormattedValue(total, metricType, metricFunction, t)}`}
        subTitle={subTitle ? subTitle : t('Total')}
      />
    </div>
  );
};
