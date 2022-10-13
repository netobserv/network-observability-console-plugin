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
import { NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { getFormattedRateValue, isUnknownPeer } from '../../utils/metrics';
import { ChartDataPoint, chartVoronoi, LegendDataItem, toDatapoints } from './metrics-helper';
import './metrics-content.css';

export type MetricsTotalContentProps = {
  id: string;
  title: string;
  sizePx?: number;
  metricType: MetricType;
  topKMetrics: NamedMetric[];
  totalMetric: NamedMetric;
  limit: number;
  doubleWidth?: boolean;
  showTotal: boolean;
  showInternal: boolean;
  showOutOfScope: boolean;
};

export const MetricsTotalContent: React.FC<MetricsTotalContentProps> = ({
  id,
  title,
  sizePx,
  metricType,
  topKMetrics,
  totalMetric,
  limit,
  doubleWidth,
  showTotal,
  showInternal,
  showOutOfScope
}) => {
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
    name: m.name
  }));
  legendData.push({
    childName: 'area-total',
    name: totalMetric.name,
    symbol: { fill: '#8B8D8F' }
  });

  const topKDatapoints: ChartDataPoint[][] = filtered.map(toDatapoints);
  const totalDatapoints: ChartDataPoint[] = toDatapoints(totalMetric);

  const legentComponent = <ChartLegend labelComponent={<ChartLabel />} data={legendData} />;

  return (
    <>
      <TextContent id="metrics" className="metrics-content-div">
        <div
          id={`chart-${id}`}
          style={{
            width: sizePx ? `${doubleWidth ? 2 * sizePx : sizePx}px` : '100%',
            height: sizePx ? `${sizePx}px` : '100%',
            alignSelf: 'center'
          }}
        >
          <Chart
            themeColor={ChartThemeColor.multiUnordered}
            ariaTitle={title}
            containerComponent={chartVoronoi(legendData, metricType)}
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="bottom-left"
            legendAllowWrap={true}
            legendComponent={legentComponent}
            //TODO: fix refresh on selection change to enable animation
            //animate={true}
            scale={{ x: 'time', y: 'linear' }}
            width={doubleWidth ? 1400 : 700}
            height={600}
            domainPadding={{ x: 0, y: 0 }}
            padding={{
              bottom: legendData.length * 25 + 50,
              left: 90,
              right: 50,
              top: 50
            }}
          >
            <ChartAxis fixLabelOverlap />
            <ChartAxis dependentAxis showGrid fixLabelOverlap tickFormat={y => getFormattedRateValue(y, metricType)} />
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
