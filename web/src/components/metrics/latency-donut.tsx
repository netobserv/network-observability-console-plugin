import { ChartDonut, ChartLabel, ChartLegend, ChartThemeColor } from '@patternfly/react-charts';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericMetric, NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { getStat } from '../../model/topology';
import { LOCAL_STORAGE_OVERVIEW_DONUT_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedValue } from '../../utils/metrics';
import './metrics-content.css';
import { defaultDimensions, Dimensions, observeDimensions } from './metrics-helper';

export type LatencyDonutProps = {
  id: string;
  limit: number;
  metricType: MetricType;
  topKMetrics: NamedMetric[] | GenericMetric[];
  totalMetric: NamedMetric;
  showOthers: boolean;
  othersName?: string;
  smallerTexts?: boolean;
  subTitle: string;
  showLegend?: boolean;
};

export const LatencyDonut: React.FC<LatencyDonutProps> = ({
  id,
  limit,
  metricType,
  topKMetrics,
  totalMetric,
  showOthers,
  othersName,
  smallerTexts,
  subTitle,
  showLegend
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let total = getStat(totalMetric.stats, 'avg');

  const sliced = topKMetrics
    .map(m => ({
      name: (m as NamedMetric).fullName || (m as GenericMetric).name,
      value: getStat(m.stats, 'avg')
    }))
    .filter(m => !othersName || m.name !== othersName)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);

  const others = Math.max(0, total - sliced.reduce((prev, cur) => prev + cur.value, 0));
  if (showOthers) {
    if (others > 0) {
      sliced.push({ name: othersName || t('Others'), value: others });
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
          x: showLegend ? `${m.name}: ${getFormattedValue(m.value, metricType, 'sum', t)}` : ' ',
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
        title={`${getFormattedValue(total, metricType, 'sum', t)}`}
        subTitle={subTitle}
      />
    </div>
  );
};
