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
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { getFormattedRateValue } from '../../utils/metrics';
import { ChartDataPoint, chartVoronoi, Dimensions, defaultDimensions, observe, toDatapoints } from './metrics-helper';
import './metrics-content.css';

export type MetricsContentProps = {
  id: string;
  title: string;
  metricType: MetricType;
  metrics: NamedMetric[];
  limit: number;
  counters?: JSX.Element;
  showTitle?: boolean;
  showBar?: boolean;
  showArea?: boolean;
  showScatter?: boolean;
  smallerTexts?: boolean;
  itemsPerRow?: number;
};

export const MetricsContent: React.FC<MetricsContentProps> = ({
  id,
  title,
  metricType,
  metrics,
  limit,
  counters,
  showTitle,
  showBar,
  showArea,
  showScatter,
  smallerTexts,
  itemsPerRow
}) => {
  const filteredMetrics = metrics.slice(0, limit);

  const legendData = filteredMetrics.map((m, idx) => ({
    childName: `${showBar ? 'bar-' : 'area-'}${idx}`,
    name: m.name
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
    <TextContent id="metrics" className="metrics-content-div">
      {showTitle && (
        <Text id="metrics-title" component={TextVariants.h4}>
          {title}
        </Text>
      )}
      {counters}
      <div id={`chart-${id}`} className="metrics-content-div" ref={containerRef}>
        <Chart
          themeColor={ChartThemeColor.multiUnordered}
          ariaTitle={title}
          containerComponent={chartVoronoi(legendData, metricType)}
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
          <ChartAxis dependentAxis showGrid fixLabelOverlap tickFormat={y => getFormattedRateValue(y, metricType)} />
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
    </TextContent>
  );
};

export default MetricsContent;
