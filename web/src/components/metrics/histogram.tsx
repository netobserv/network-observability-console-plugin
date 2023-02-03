import { Chart, ChartAxis, ChartBar, ChartStack, ChartThemeColor, createContainer } from '@patternfly/react-charts';
import { Bullseye, EmptyStateBody, Spinner, Text } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { NamedMetric, TopologyMetrics } from '../../api/loki';
import { TimeRange } from '../../utils/datetime';
import { getDateMsInSeconds } from '../../utils/duration';
import { getFormattedRateValue } from '../../utils/metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import BrushHandleComponent from './brush-handle';
import {
  ChartDataPoint,
  Dimensions,
  getDomainDisplayText,
  getDomainFromRange,
  getHistogramRangeFromLimit,
  observe,
  toHistogramDatapoints,
  toNamedMetric
} from './metrics-helper';
import './histogram.css';

export const VoronoiContainer = createContainer('voronoi', 'brush');

export const Histogram: React.FC<{
  id: string;
  totalMetric: NamedMetric;
  limit: number;
  isDark: boolean;
  range?: TimeRange;
  setRange: (tr: TimeRange) => void;
}> = ({ id, totalMetric, limit, isDark, range, setRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const datapoints: ChartDataPoint[] = toHistogramDatapoints(totalMetric);
  const defaultRange = getHistogramRangeFromLimit(totalMetric, limit);

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = React.useState<Dimensions>({ width: 3000, height: 300 });
  React.useEffect(() => {
    observe(containerRef, dimensions, setDimensions);
  }, [containerRef, dimensions]);

  return (
    <div id={`chart-${id}`} className="metrics-content-div" ref={containerRef}>
      <Text className="histogram-range">{getDomainDisplayText(range ? range : defaultRange)}</Text>
      <Chart
        themeColor={ChartThemeColor.multiUnordered}
        containerComponent={
          <VoronoiContainer
            brushDimension="x"
            onBrushDomainChange={(updated?: { x?: Array<Date | number> }) => {
              if (limit && updated?.x && updated.x.length && typeof updated.x[0] === 'object') {
                const start = getDateMsInSeconds(updated.x[0].getTime());
                const range = getHistogramRangeFromLimit(totalMetric, limit, start);

                if (range.from < range.to) {
                  updated.x = getDomainFromRange(range);
                }
              }
            }}
            onBrushDomainChangeEnd={(domain?: { x?: Array<Date | number> }) => {
              if (
                domain?.x &&
                domain.x.length > 1 &&
                typeof domain.x[0] === 'object' &&
                typeof domain.x[1] === 'object'
              ) {
                const start = domain.x[0];
                const end = domain.x[1];

                if (start.getTime() < end.getTime()) {
                  setRange({ from: getDateMsInSeconds(start.getTime()), to: getDateMsInSeconds(end.getTime()) });
                }
              }
            }}
            handleComponent={<BrushHandleComponent isDark={isDark} />}
            defaultBrushArea="none"
            handleWidth={1}
            brushStyle={{ stroke: 'transparent', fill: 'black', fillOpacity: 0.1 }}
            brushDomain={{
              x: getDomainFromRange(range ? range : defaultRange)
            }}
          />
        }
        //TODO: fix refresh on selection change to enable animation
        //animate={true}
        scale={{ x: 'time', y: 'linear' }}
        width={dimensions.width}
        height={dimensions.height}
        padding={{
          top: 30,
          right: 10,
          bottom: 35,
          left: 60
        }}
      >
        <ChartAxis fixLabelOverlap />
        <ChartAxis dependentAxis showGrid fixLabelOverlap tickFormat={y => getFormattedRateValue(y, 'count', t)} />
        <ChartStack>
          <ChartBar
            name={`bar-${id}`}
            key={`bar-${id}`}
            data={datapoints}
            barWidth={(dimensions.width / datapoints.length) * 0.8}
            alignment={'start'}
          />
        </ChartStack>
      </Chart>
    </div>
  );
};

export const HistogramContainer: React.FC<{
  id: string;
  loading: boolean;
  totalMetric: TopologyMetrics | undefined;
  limit: number;
  isDark: boolean;
  range?: TimeRange;
  setRange: (tr: TimeRange) => void;
}> = ({ id, loading, totalMetric, limit, isDark, range, setRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return totalMetric ? (
    <Histogram
      id={id}
      totalMetric={toNamedMetric(t, totalMetric, TruncateLength.OFF, false, false)}
      limit={limit}
      isDark={isDark}
      range={range}
      setRange={setRange}
    />
  ) : loading ? (
    <Bullseye data-test="loading-histogram">
      <Spinner size="xl" />
    </Bullseye>
  ) : (
    <EmptyStateBody>{t('No datapoints found.')}</EmptyStateBody>
  );
};

export default HistogramContainer;
