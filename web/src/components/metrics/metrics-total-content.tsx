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
import { TextContent } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { LOCAL_STORAGE_OVERVIEW_METRICS_TOTAL_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedRateValue, isUnknownPeer } from '../../utils/metrics';
import './metrics-content.css';
import {
  ChartDataPoint,
  chartVoronoi,
  defaultDimensions,
  Dimensions,
  LegendDataItem,
  observe,
  toDatapoints
} from './metrics-helper';

export type MetricsTotalContentProps = {
  id: string;
  title: string;
  metricType: MetricType;
  topKMetrics: NamedMetric[];
  totalMetric: NamedMetric;
  limit: number;
  showTotal: boolean;
  showInternal: boolean;
  showOutOfScope: boolean;
  smallerTexts?: boolean;
  showLegend?: boolean;
};

export const MetricsTotalContent: React.FC<MetricsTotalContentProps> = ({
  id,
  title,
  metricType,
  topKMetrics,
  totalMetric,
  limit,
  showTotal,
  showInternal,
  showOutOfScope,
  smallerTexts,
  showLegend
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let filtered = topKMetrics;
  if (!showInternal) {
    filtered = filtered.filter(m => !m.isInternal);
  }
  if (!showOutOfScope) {
    filtered = filtered.filter(m => !isUnknownPeer(m.source) || !isUnknownPeer(m.destination));
  }
  filtered = filtered.slice(0, limit);

  const legendData: LegendDataItem[] = filtered.map((m, idx) => ({
    childName: `bar-${idx}`,
    name: m.shortName,
    tooltipName: m.fullName
  }));
  legendData.push({
    childName: 'area-total',
    name: totalMetric.shortName,
    tooltipName: totalMetric.fullName,
    symbol: { fill: '#8B8D8F' }
  });

  const topKDatapoints: ChartDataPoint[][] = filtered.map(toDatapoints);
  const totalDatapoints: ChartDataPoint[] = toDatapoints(totalMetric);

  const legentComponent = (
    <ChartLegend
      itemsPerRow={2}
      labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
      data={legendData}
    />
  );

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    LOCAL_STORAGE_OVERVIEW_METRICS_TOTAL_DIMENSION_KEY,
    defaultDimensions
  );
  React.useEffect(() => {
    observe(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  return (
    <>
      <TextContent id="metrics" className="metrics-content-div">
        <div id={`chart-${id}`} className="metrics-content-div" ref={containerRef}>
          <Chart
            themeColor={ChartThemeColor.multiUnordered}
            ariaTitle={title}
            containerComponent={chartVoronoi(legendData, metricType, t)}
            legendData={showLegend ? legendData : undefined}
            legendOrientation="horizontal"
            legendPosition="bottom-left"
            legendAllowWrap={true}
            legendComponent={showLegend ? legentComponent : undefined}
            //TODO: fix refresh on selection change to enable animation
            //animate={true}
            scale={{ x: 'time', y: 'linear' }}
            width={dimensions.width}
            height={dimensions.height}
            domainPadding={{ x: 0, y: 0 }}
            padding={
              showLegend
                ? {
                    bottom: (legendData.length / 2) * 25 + 100,
                    left: 90,
                    right: 50,
                    top: 50
                  }
                : undefined
            }
          >
            <ChartAxis fixLabelOverlap />
            <ChartAxis
              dependentAxis
              showGrid
              fixLabelOverlap
              tickFormat={y => getFormattedRateValue(y, metricType, t)}
            />
            <ChartStack>
              {topKDatapoints.map((datapoints, idx) => (
                <ChartBar name={`bar-${idx}`} key={`bar-${idx}`} data={datapoints} />
              ))}
            </ChartStack>
            {showTotal && (
              <ChartGroup>
                <ChartArea
                  name={'area-total'}
                  style={{ data: { fill: '#8B8D8F' } }}
                  data={totalDatapoints}
                  interpolation="monotoneX"
                />
              </ChartGroup>
            )}
            {showTotal && (
              <ChartGroup>
                <ChartScatter name={'scatter-total'} style={{ data: { fill: '#8B8D8F' } }} data={totalDatapoints} />
              </ChartGroup>
            )}
          </Chart>
        </div>
      </TextContent>
    </>
  );
};
