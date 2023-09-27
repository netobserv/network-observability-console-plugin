import { ChartDonut, ChartLabel, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericMetric, NamedMetric } from '../../api/loki';
import { MetricFunction, MetricType } from '../../model/flow-query';
import { getStat } from '../../model/topology';
import { LOCAL_STORAGE_OVERVIEW_DONUT_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedRateValue } from '../../utils/metrics';
import './metrics-content.css';
import { defaultDimensions, Dimensions, observeDimensions } from './metrics-helper';

export type DroppedDonutProps = {
  id: string;
  stat: MetricFunction;
  limit: number;
  metricType: MetricType;
  topKMetrics: GenericMetric[];
  totalMetric: NamedMetric;
  showOthers: boolean;
  smallerTexts?: boolean;
  showLegend?: boolean;
};

export const DroppedDonut: React.FC<DroppedDonutProps> = ({
  id,
  stat,
  limit,
  metricType,
  topKMetrics,
  totalMetric,
  showOthers,
  smallerTexts,
  showLegend
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let total = getStat(totalMetric.stats, stat);

  const sliced = topKMetrics
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
    <ChartLegend
      labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
      data={legendData}
    />
  );

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    `${LOCAL_STORAGE_OVERVIEW_DONUT_DIMENSION_KEY}${showLegend ? '-legend' : ''}`,
    defaultDimensions
  );
  React.useEffect(() => {
    observeDimensions(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  return (
    <div id={id} className="metrics-content-div" ref={containerRef}>
      <ChartDonut
        themeColor={ChartThemeColor.multiUnordered}
        constrainToVisibleArea
        legendData={showLegend ? legendData : undefined}
        legendOrientation="vertical"
        legendPosition="right"
        legendAllowWrap={true}
        legendComponent={showLegend ? legentComponent : undefined}
        //TODO: fix refresh on selection change to enable animation
        //animate={true}
        width={dimensions.width}
        height={dimensions.height}
        allowTooltip={showLegend}
        data={sliced.map(m => ({
          x: showLegend ? `${m.name}: ${getFormattedRateValue(m.value, metricType, t)}` : ' ',
          y: m.value
        }))}
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
        title={`${getFormattedRateValue(total, metricType, t)}`}
        subTitle={t('Total dropped')}
      />
    </div>
  );
};
