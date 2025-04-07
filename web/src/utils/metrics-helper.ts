import { TFunction } from 'i18next';
import _ from 'lodash';
import * as React from 'react';
import { GenericMetric, NamedMetric, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { TruncateLength } from '../components/dropdowns/truncate-dropdown';
import { FlowScope } from '../model/flow-query';
import { NodeData } from '../model/topology';
import { getDateFromUnix, getFormattedDate, TimeRange } from './datetime';
import { getDateSInMiliseconds } from './duration';
import { isUnknownPeer, matchPeer } from './metrics';

export type LegendDataItem = {
  childName?: string;
  name?: string;
  tooltipName?: string;
  labels?: {
    fill?: string;
  };
  symbol?: {
    fill?: string;
    type?: string;
  };
};

export type ChartDataPoint = {
  name: string;
  date: string;
  x: Date;
  y: number;
};

export const toDatapoints = (metric: NamedMetric | GenericMetric): ChartDataPoint[] => {
  return metric.values.map(v => ({
    name: (metric as NamedMetric).shortName || (metric as GenericMetric).name,
    date: getFormattedDate(getDateFromUnix(v[0])),
    x: getDateFromUnix(v[0]),
    y: Number(v[1])
  }));
};

export const toHistogramDatapoints = (metric: NamedMetric): ChartDataPoint[] => {
  const result: ChartDataPoint[] = [];
  for (let i = 0; i < metric.values.length; i++) {
    result.push({
      name: metric.shortName,
      date: getFormattedDate(getDateFromUnix(metric.values[i][0])),
      x: getDateFromUnix(metric.values[i][0]),
      y: Number(metric.values[i + 1]?.[1] | 0)
    });
  }
  return result;
};

export const getHistogramRangeFromLimit = (totalMetric: NamedMetric, limit: number, start?: number): TimeRange => {
  let limitCount = 0,
    from = 0,
    to = 0;
  let values: [number, number][];

  if (start !== undefined) {
    // get maximum range from start date before reaching the limit
    values = totalMetric.values.filter(v => v[0] >= start && v[1] > 0);
    from = values.shift()?.[0] || 0;
  } else {
    //get last range equal or higher to the limit to preview default loki behavior
    values = [...totalMetric.values].reverse();
    to = values.shift()?.[0] || 0;
  }

  for (const v of values) {
    limitCount += v[1];

    if (start !== undefined) {
      if (limitCount < limit) {
        to = v[0];
      } else {
        break;
      }
    } else {
      from = v[0];
      if (limitCount > limit) {
        break;
      }
    }
  }
  return { from, to };
};

export const getDomainFromRange = (range: TimeRange): [Date, Date] => {
  return [new Date(getDateSInMiliseconds(range.from)), new Date(getDateSInMiliseconds(range.to))];
};

export const getDomainDisplayText = (range: TimeRange): string => {
  const domain = getDomainFromRange(range);
  return `${getFormattedDate(domain[0])} - ${getFormattedDate(domain[1])}`;
};

const truncate = (input: string, length: number) => {
  if (input.length > length) {
    return input.substring(0, length / 2) + '…' + input.substring(input.length - length / 2);
  }
  return input;
};

const truncateParts = (input: string, length: number) => {
  if (length === 0) {
    return input;
  }

  if (input.includes('.')) {
    const splitted = input.split('.');
    const result: string[] = [];
    splitted.forEach(s => {
      result.push(truncate(s, length / splitted.length));
    });
    return result.join('.');
  }
  return truncate(input, length);
};

const getPeerName = (
  t: TFunction,
  peer: TopologyMetricPeer,
  scope: FlowScope,
  truncateLength: TruncateLength,
  inclNamespace: boolean,
  disambiguate: boolean
): string => {
  const name = peer.getDisplayName(inclNamespace, disambiguate);
  if (name) {
    return truncateParts(name, truncateLength);
  }
  if (scope === 'app') {
    // No peer distinction here
    return t('Total');
  }
  switch (scope) {
    case 'cluster':
    case 'zone':
    case 'host':
      return t('(non nodes)');
    default:
      return t('(non pods)');
  }
};

export const toNamedMetric = (
  t: TFunction,
  m: TopologyMetrics,
  truncateLength: TruncateLength,
  inclNamespace: boolean,
  disambiguate: boolean,
  data?: NodeData
): NamedMetric => {
  const srcName = getPeerName(t, m.source, m.scope, truncateLength, inclNamespace, disambiguate);
  const srcFullName = getPeerName(t, m.source, m.scope, TruncateLength.OFF, inclNamespace, disambiguate);
  const dstName = getPeerName(t, m.destination, m.scope, truncateLength, inclNamespace, disambiguate);
  const dstFullName = getPeerName(t, m.destination, m.scope, TruncateLength.OFF, inclNamespace, disambiguate);
  if (srcFullName === dstFullName) {
    if (!isUnknownPeer(m.source)) {
      // E.g: namespace "netobserv" to "netobserv"
      return {
        ...m,
        shortName: `${srcName} (${t('internal')})`,
        fullName: `${srcFullName} (${t('internal')})`,
        isInternal: true
      };
    } else {
      // E.g: host-network traffic while scope is "namespaces"
      return {
        ...m,
        shortName: srcName,
        fullName: srcFullName,
        isInternal: false
      };
    }
  }
  if (data && matchPeer(data, m.source)) {
    return {
      ...m,
      shortName: `${t('To')} ${dstName}`,
      fullName: `${t('To')} ${dstFullName}`,
      isInternal: false
    };
  } else if (data && matchPeer(data, m.destination)) {
    return {
      ...m,
      shortName: `${t('From')} ${srcName}`,
      fullName: `${t('From')} ${srcFullName}`,
      isInternal: false
    };
  }
  return {
    ...m,
    shortName: `${srcName} -> ${dstName}`,
    fullName: `${srcFullName} -> ${dstFullName}`,
    isInternal: false
  };
};

export type Dimensions = {
  width: number;
  height: number;
};

export const defaultDimensions: Dimensions = {
  width: 500,
  height: 500
};

export const listenResizeEvents = (resize: () => void) => {
  // first call to init
  resize();

  // then listen to event
  const debouncedResize = _.debounce(resize, 100);
  window.addEventListener('resize', debouncedResize);
  return () => {
    window.removeEventListener('resize', debouncedResize);
  };
};

export const handleDimensionsChange = (
  containerRef: React.RefObject<HTMLDivElement>,
  dimensions: Dimensions,
  setDimensions: React.Dispatch<React.SetStateAction<Dimensions>>
) => {
  listenResizeEvents(() => {
    if (containerRef.current) {
      const newDimension = {
        width: containerRef.current.clientWidth || defaultDimensions.width,
        height: containerRef.current.clientHeight || defaultDimensions.height
      };

      if (newDimension.width !== dimensions.width || newDimension.height !== dimensions.height) {
        setDimensions(newDimension);
      }
    }
  });
};

export const handleRectChange = (
  containerRef: React.RefObject<HTMLDivElement>,
  rect: DOMRect,
  setRect: React.Dispatch<React.SetStateAction<DOMRect>>
) => {
  listenResizeEvents(() => {
    if (containerRef.current) {
      const updatedRect = containerRef.current.getBoundingClientRect();
      if (updatedRect.width !== rect.width || updatedRect.height !== rect.height) setRect(updatedRect);
    }
  });
};
