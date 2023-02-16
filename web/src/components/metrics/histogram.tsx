import { Chart, ChartAxis, ChartBar, ChartStack, ChartThemeColor, createContainer } from '@patternfly/react-charts';
import {
  AngleRightIcon,
  AngleLeftIcon,
  SearchMinusIcon,
  SearchPlusIcon,
  AngleDoubleLeftIcon,
  AngleDoubleRightIcon
} from '@patternfly/react-icons';
import { Bullseye, Button, EmptyStateBody, Flex, FlexItem, Spinner, Text, Tooltip } from '@patternfly/react-core';
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
  moveRange: (next: boolean) => void;
  zoomRange: (zoom: boolean) => void;
}> = ({ id, totalMetric, limit, isDark, range, setRange, moveRange, zoomRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const datapoints: ChartDataPoint[] = toHistogramDatapoints(totalMetric);
  const defaultRange = getHistogramRangeFromLimit(totalMetric, limit);

  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = React.useState<Dimensions>({ width: 3000, height: 300 });
  React.useEffect(() => {
    observe(containerRef, dimensions, setDimensions);
  }, [containerRef, dimensions]);

  const moveHistogramRange = React.useCallback(
    (next: boolean) => {
      containerRef.current?.focus();

      const r = range ? range : defaultRange;
      const rSize = r.to - r.from;

      let start = r.from - rSize;
      if (next) {
        start = r.to;
      }
      const end = start + rSize;

      //try to get new range using limit
      let updatedRange = getHistogramRangeFromLimit(totalMetric, limit, start);

      //else fallback on previous / next range keeping actual width
      if (!updatedRange.from || !updatedRange.to) {
        const minTime = getDateMsInSeconds(Math.min(...datapoints.map(dp => dp.x.getTime())));
        const maxTime = getDateMsInSeconds(Math.max(...datapoints.map(dp => dp.x.getTime())));

        updatedRange = {
          from: start > minTime ? start : minTime,
          to: end < maxTime ? end : maxTime
        };
      }

      if (updatedRange.from && updatedRange.to && updatedRange.from < updatedRange.to) {
        setRange(updatedRange);
      } else {
        setRange(defaultRange);
      }
    },
    [containerRef, datapoints, defaultRange, limit, range, setRange, totalMetric]
  );

  const onKeyDown = React.useCallback(
    (key: string) => {
      switch (key) {
        case 'ArrowRight':
          moveRange(true);
          break;
        case 'ArrowLeft':
          moveRange(false);
          break;
        case '+':
          zoomRange(true);
          break;
        case '-':
          zoomRange(false);
          break;
        case 'PageUp':
          moveHistogramRange(true);
          break;
        case 'PageDown':
          moveHistogramRange(false);
          break;
      }
    },
    [moveHistogramRange, moveRange, zoomRange]
  );

  const zoomButtonTips = () => {
    return t('Zoom in / out histogram. You can also use plus or minus buttons while histogram is focused.');
  };

  const pageButtonTips = () => {
    return t('Move selected range. You can also use page up or down buttons while histogram is focused.');
  };

  const arrowButtonTips = () => {
    return t('Move displayed range. You can also use arrow left or right buttons while histogram is focused.');
  };

  return (
    <div
      id={`chart-${id}`}
      className="metrics-content-div"
      ref={containerRef}
      tabIndex={0}
      onKeyDown={e => onKeyDown(e.key)}
    >
      <Flex className="histogram-range-container" direction={{ default: 'row' }}>
        <FlexItem flex={{ default: 'flex_1' }} />
        <FlexItem>
          <Tooltip content={arrowButtonTips()}>
            <Button variant="plain" onClick={() => moveRange(false)}>
              <AngleDoubleLeftIcon />
            </Button>
          </Tooltip>
          <Tooltip content={pageButtonTips()}>
            <Button variant="plain" onClick={() => moveHistogramRange(false)}>
              <AngleLeftIcon />
            </Button>
          </Tooltip>
        </FlexItem>
        <FlexItem>
          <Text>{getDomainDisplayText(range ? range : defaultRange)}</Text>
        </FlexItem>
        <FlexItem>
          <Tooltip content={pageButtonTips()}>
            <Button variant="plain" onClick={() => moveHistogramRange(true)}>
              <AngleRightIcon />
            </Button>
          </Tooltip>
          <Tooltip content={arrowButtonTips()}>
            <Button variant="plain" onClick={() => moveRange(true)}>
              <AngleDoubleRightIcon />
            </Button>
          </Tooltip>
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}>
          <Flex className="histogram-zoom-container" direction={{ default: 'row' }}>
            <FlexItem>
              <Tooltip content={zoomButtonTips()}>
                <Button variant="plain" onClick={() => zoomRange(false)}>
                  <SearchMinusIcon />
                </Button>
              </Tooltip>
            </FlexItem>
            <FlexItem>
              <Tooltip content={zoomButtonTips()}>
                <Button variant="plain" onClick={() => zoomRange(true)}>
                  <SearchPlusIcon />
                </Button>
              </Tooltip>
            </FlexItem>
          </Flex>
        </FlexItem>
      </Flex>
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
              containerRef.current?.focus();
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
          right: 25,
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
  moveRange: (next: boolean) => void;
  zoomRange: (zoom: boolean) => void;
}> = ({ id, loading, totalMetric, limit, isDark, range, setRange, moveRange, zoomRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return totalMetric ? (
    <Histogram
      id={id}
      totalMetric={toNamedMetric(t, totalMetric, TruncateLength.OFF, false, false)}
      limit={limit}
      isDark={isDark}
      range={range}
      setRange={setRange}
      moveRange={moveRange}
      zoomRange={zoomRange}
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
