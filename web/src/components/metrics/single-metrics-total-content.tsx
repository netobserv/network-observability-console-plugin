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
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { GenericMetric, NamedMetric } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { LOCAL_STORAGE_OVERVIEW_METRICS_TOTAL_DIMENSION_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { getFormattedRateValue } from '../../utils/metrics';
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

export type SingleMetricsTotalContentProps = {
  id: string;
  title: string;
  metricType: MetricType;
  topKMetrics: GenericMetric[];
  totalMetric: NamedMetric;
  limit: number;
  showTotal: boolean;
  showOthers: boolean;
  othersName?: string;
  smallerTexts?: boolean;
};

export const SingleMetricsTotalContent: React.FC<SingleMetricsTotalContentProps> = ({
  id,
  title,
  metricType,
  topKMetrics,
  totalMetric,
  limit,
  showTotal,
  showOthers,
  othersName,
  smallerTexts
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let filtered = [...topKMetrics];
  if (showOthers) {
    const others = {
      name: othersName || t('Others'),
      values: _.cloneDeep(totalMetric.values),
      aggregateBy: 'dnsRCode',
      stats: totalMetric.stats
    } as GenericMetric;
    filtered.forEach(m => {
      for (let i = 0; i < m.values.length; i++) {
        others.values[i][1] -= m.values[i][1];
      }
    });
    filtered.push(others);
  }
  filtered = filtered.slice(0, limit);

  const legendData: LegendDataItem[] = filtered.map((m, idx) => ({
    childName: `bar-${idx}`,
    name: m.name,
    tooltipName: m.name
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
            legendData={legendData}
            legendOrientation="horizontal"
            legendPosition="bottom-left"
            legendAllowWrap={true}
            legendComponent={legentComponent}
            //TODO: fix refresh on selection change to enable animation
            //animate={true}
            scale={{ x: 'time', y: 'linear' }}
            width={dimensions.width}
            height={dimensions.height}
            domainPadding={{ x: 0, y: 0 }}
            padding={{
              bottom: (legendData.length / 2) * 25 + 100,
              left: 90,
              right: 50,
              top: 50
            }}
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
