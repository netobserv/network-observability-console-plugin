import { Chart, ChartAxis, ChartBar, ChartStack, ChartThemeColor, createContainer } from '@patternfly/react-charts';
import {
  Bullseye,
  Button,
  EmptyStateBody,
  Flex,
  FlexItem,
  PopoverPosition,
  Spinner,
  Text
} from '@patternfly/react-core';
import {
  AngleDoubleLeftIcon,
  AngleDoubleRightIcon,
  AngleLeftIcon,
  AngleRightIcon,
  QuestionCircleIcon,
  SearchMinusIcon,
  SearchPlusIcon
} from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LOCAL_STORAGE_HISTOGRAM_GUIDED_TOUR_DONE_KEY, useLocalStorage } from '../../utils/local-storage-hook';
import { NamedMetric, TopologyMetrics } from '../../api/loki';
import { TimeRange } from '../../utils/datetime';
import { getDateMsInSeconds } from '../../utils/duration';
import { getFormattedRateValue } from '../../utils/metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { GuidedTourHandle } from '../guided-tour/guided-tour';
import BrushHandleComponent from './brush-handle';
import './histogram.css';
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

export const VoronoiContainer = createContainer('voronoi', 'brush');

export const Histogram: React.FC<{
  id: string;
  totalMetric: NamedMetric;
  limit: number;
  isDark: boolean;
  range?: TimeRange;
  guidedTourHandle: GuidedTourHandle | null;
  setRange: (tr: TimeRange) => void;
  moveRange: (next: boolean) => void;
  zoomRange: (zoom: boolean) => void;
}> = ({ id, totalMetric, limit, isDark, range, guidedTourHandle, setRange, moveRange, zoomRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const datapoints: ChartDataPoint[] = toHistogramDatapoints(totalMetric);
  const defaultRange = getHistogramRangeFromLimit(totalMetric, limit);

  const containerRef = React.createRef<HTMLDivElement>();
  const zoomRef = React.createRef<HTMLInputElement>();
  const pageRef = React.createRef<HTMLInputElement>();
  const arrowRef = React.createRef<HTMLInputElement>();

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

  const zoomButtonTips = React.useCallback(() => {
    return t('Zoom in / out histogram. You can also use plus or minus buttons while histogram is focused.');
  }, [t]);

  const pageButtonTips = React.useCallback(() => {
    return t('Move selected range. You can also use page up or down buttons while histogram is focused.');
  }, [t]);

  const arrowButtonTips = React.useCallback(() => {
    return t('Move displayed range. You can also use arrow left or right buttons while histogram is focused.');
  }, [t]);

  const [guidedTourDone, setGuidedTourDone] = useLocalStorage<boolean>(LOCAL_STORAGE_HISTOGRAM_GUIDED_TOUR_DONE_KEY);
  React.useEffect(() => {
    if (!guidedTourHandle) {
      return;
    }

    guidedTourHandle.updateTourItems([
      {
        title: t('Histogram'),
        description: t(
          // eslint-disable-next-line max-len
          'The following bar chart represent the number of logs across time. You can select a portion of it to drill down into the selected time range and filter the content below accordingly.'
        ),
        assetName: 'histogram.gif',
        minWidth: '500px',
        ref: containerRef
      },
      {
        title: t('Zoom buttons'),
        description: zoomButtonTips(),
        assetName: 'histogram-zoom.gif',
        position: PopoverPosition.bottom,
        ref: zoomRef
      },
      {
        title: t('Arrow buttons'),
        description: arrowButtonTips(),
        ref: arrowRef
      },
      {
        title: t('Page buttons'),
        description: pageButtonTips(),
        assetName: 'histogram-pages.gif',
        minWidth: '500px',
        position: PopoverPosition.bottom,
        ref: pageRef
      }
    ]);

    if (!guidedTourDone) {
      setGuidedTourDone(true);
      guidedTourHandle.startTour();
    }
  }, [
    arrowButtonTips,
    arrowRef,
    containerRef,
    guidedTourDone,
    guidedTourHandle,
    pageButtonTips,
    pageRef,
    setGuidedTourDone,
    t,
    zoomButtonTips,
    zoomRef
  ]);

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
          <Button variant="plain" onClick={() => moveRange(false)} ref={arrowRef}>
            <AngleDoubleLeftIcon />
          </Button>

          <Button variant="plain" onClick={() => moveHistogramRange(false)} ref={pageRef}>
            <AngleLeftIcon />
          </Button>
        </FlexItem>
        <FlexItem>
          <Text>{getDomainDisplayText(range ? range : defaultRange)}</Text>
        </FlexItem>
        <FlexItem>
          <Button variant="plain" onClick={() => moveHistogramRange(true)}>
            <AngleRightIcon />
          </Button>
          <Button variant="plain" onClick={() => moveRange(true)}>
            <AngleDoubleRightIcon />
          </Button>
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}>
          <Flex className="histogram-zoom-container" direction={{ default: 'row' }}>
            <FlexItem>
              <Button variant="plain" onClick={() => zoomRange(false)} ref={zoomRef}>
                <SearchMinusIcon />
              </Button>
            </FlexItem>
            <FlexItem>
              <Button variant="plain" onClick={() => zoomRange(true)}>
                <SearchPlusIcon />
              </Button>
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem>
          <Button variant="plain" onClick={() => guidedTourHandle?.startTour()}>
            <QuestionCircleIcon />
          </Button>
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
  guidedTourHandle: GuidedTourHandle | null;
  setRange: (tr: TimeRange) => void;
  moveRange: (next: boolean) => void;
  zoomRange: (zoom: boolean) => void;
}> = ({ id, loading, totalMetric, limit, isDark, range, guidedTourHandle, setRange, moveRange, zoomRange }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return totalMetric ? (
    <Histogram
      id={id}
      totalMetric={toNamedMetric(t, totalMetric, TruncateLength.OFF, false, false)}
      limit={limit}
      isDark={isDark}
      range={range}
      guidedTourHandle={guidedTourHandle}
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
