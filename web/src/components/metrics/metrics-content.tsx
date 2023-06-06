import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLabel,
  ChartLegend,
  ChartScatter,
  ChartStack,
  ChartThemeColor
} from '@patternfly/react-charts';
import * as React from 'react';
import { NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { getFormattedRateValue } from '../../utils/metrics';
import {
  ChartDataPoint,
  chartVoronoi,
  Dimensions,
  defaultDimensions,
  observe,
  toDatapoints,
  LegendDataItem
} from './metrics-helper';
import './metrics-content.css';
import { useTranslation } from 'react-i18next';

export type MetricsContentProps = {
  id: string;
  title: string;
  metricType: MetricType;
  metrics: NamedMetric[];
  limit: number;
  showBar?: boolean;
  showArea?: boolean;
  showScatter?: boolean;
  smallerTexts?: boolean;
  itemsPerRow?: number;
  tooltipsTruncate: boolean;
};

export const MetricsContent: React.FC<MetricsContentProps> = ({
  id,
  title,
  metricType,
  metrics,
  limit,
  showBar,
  showArea,
  showScatter,
  smallerTexts,
  itemsPerRow,
  tooltipsTruncate
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const filteredMetrics = metrics.slice(0, limit);

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
  const [dimensions, setDimensions] = React.useState<Dimensions>(defaultDimensions);
  React.useEffect(() => {
    observe(containerRef, dimensions, setDimensions);
  }, [containerRef, dimensions]);

  return (
    <div id={`chart-${id}`} className="metrics-content-div" ref={containerRef} data-test-metrics={metrics}>
      <Chart
        themeColor={ChartThemeColor.multiUnordered}
        ariaTitle={title}
        containerComponent={chartVoronoi(legendData, metricType, t)}
        legendData={legendData}
        legendOrientation={'horizontal'}
        legendPosition="bottom-left"
        legendAllowWrap={true}
        legendComponent={legentComponent}
        //TODO: fix refresh on selection change to enable animation
        //animate={true}
        scale={{ x: 'time', y: showBar ? 'linear' : 'sqrt' }}
        width={dimensions.width}
        height={dimensions.height}
        domainPadding={{ x: 0, y: 0 }}
        padding={{
          bottom: (itemsPerRow && itemsPerRow > 1 ? legendData.length / 2 + 1 : legendData.length) * 25 + 75,
          left: 90,
          right: 50,
          top: 50
        }}
      >
        <ChartAxis fixLabelOverlap />
        <ChartAxis dependentAxis showGrid fixLabelOverlap tickFormat={y => getFormattedRateValue(y, metricType, t)} />
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
