import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLabel,
  ChartLegend,
  ChartLine,
  ChartScatter,
  ChartStack,
  ChartThemeColor
} from '@patternfly/react-charts';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { LOCAL_STORAGE_OVERVIEW_METRICS_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedRateValue } from '../../utils/metrics';
import './metrics-content.css';
import {
  ChartDataPoint,
  chartVoronoi,
  defaultDimensions,
  Dimensions,
  LegendDataItem,
  observeDimensions,
  toDatapoints
} from './metrics-helper';

export type MetricsContentProps = {
  id: string;
  metricType: MetricType;
  metrics: NamedMetric[];
  limit: number;
  showLegend?: boolean;
  showBar?: boolean;
  showArea?: boolean;
  showLine?: boolean;
  showScatter?: boolean;
  smallerTexts?: boolean;
  itemsPerRow?: number;
  tooltipsTruncate: boolean;
  animate?: boolean;
};

export const MetricsContent: React.FC<MetricsContentProps> = ({
  id,
  metricType,
  metrics,
  limit,
  showBar,
  showArea,
  showLine,
  showScatter,
  smallerTexts,
  itemsPerRow,
  tooltipsTruncate,
  showLegend,
  animate
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let filteredMetrics = metrics.slice(0, limit);
  if (['dnsLatencies', 'flowRtt'].includes(metricType)) {
    filteredMetrics = filteredMetrics.map(m => ({ ...m, values: m.values.filter(v => v[1] !== 0) }));
  }

  const legendData: LegendDataItem[] = filteredMetrics.map((m, idx) => ({
    childName: `${showBar ? 'bar-' : 'area-'}${idx}`,
    name: m.shortName,
    tooltipName: tooltipsTruncate ? m.shortName : m.fullName
  }));

  const topKDatapoints: ChartDataPoint[][] = filteredMetrics.map(toDatapoints);

  const legentComponent = (
    <ChartLegend
      itemsPerRow={itemsPerRow ? itemsPerRow : 1}
      labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
      data={legendData}
    />
  );

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    `${LOCAL_STORAGE_OVERVIEW_METRICS_DIMENSION_KEY}${showLegend ? '-legend' : ''}`,
    defaultDimensions
  );
  React.useEffect(() => {
    observeDimensions(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  return (
    <div id={`chart-${id}`} className="metrics-content-div" ref={containerRef} data-test-metrics={metrics.length}>
      <Chart
        themeColor={ChartThemeColor.multiUnordered}
        containerComponent={showLegend ? chartVoronoi(legendData, metricType, t) : undefined}
        legendData={showLegend ? legendData : undefined}
        legendOrientation={'horizontal'}
        legendPosition="bottom-left"
        legendAllowWrap={true}
        legendComponent={showLegend ? legentComponent : undefined}
        animate={animate}
        scale={{ x: 'time', y: showBar ? 'linear' : 'sqrt' }}
        width={dimensions.width}
        height={dimensions.height}
        domainPadding={{ x: 0, y: 0 }}
        padding={
          showLegend
            ? {
                bottom: (itemsPerRow && itemsPerRow > 1 ? legendData.length / 2 + 1 : legendData.length) * 25 + 75,
                left: 90,
                right: 50,
                top: 50
              }
            : {
                bottom: 0,
                left: 0,
                right: 0,
                top: 0
              }
        }
      >
        <ChartAxis fixLabelOverlap tickFormat={showLegend ? () => '' : undefined} />
        <ChartAxis
          dependentAxis
          showGrid
          fixLabelOverlap
          tickFormat={y => (showLegend ? getFormattedRateValue(y, metricType, t) : '')}
        />
        {showBar && (
          <ChartStack>
            {topKDatapoints.map((datapoints, idx) => (
              <ChartBar name={`bar-${idx}`} key={`bar-${idx}`} data={datapoints} />
            ))}
          </ChartStack>
        )}
        {showArea && (
          <ChartGroup>
            {topKDatapoints.map((datapoints, idx) => (
              <ChartArea name={`area-${idx}`} key={`area-${idx}`} data={datapoints} interpolation="monotoneX" />
            ))}
          </ChartGroup>
        )}
        {showLine && (
          <ChartGroup>
            {topKDatapoints.map((datapoints, idx) => (
              <ChartLine name={`line-${idx}`} key={`line-${idx}`} data={datapoints} interpolation="monotoneX" />
            ))}
          </ChartGroup>
        )}
        {showScatter && (
          <ChartGroup>
            {topKDatapoints.map((datapoints, idx) => (
              <ChartScatter name={`scatter-${idx}`} key={`scatter-${idx}`} data={datapoints} />
            ))}
          </ChartGroup>
        )}
      </Chart>
    </div>
  );
};

export default MetricsContent;
