import { ChartLegendTooltip, createContainer, getResizeObserver } from '@patternfly/react-charts';
import { TFunction } from 'i18next';
import * as React from 'react';
import { NamedMetric, TopologyMetricPeer, TopologyMetrics } from '../../api/loki';
import { MetricScope, MetricType } from '../../model/flow-query';
import { NodeData } from '../../model/topology';
import { getDateFromUnix, getFormattedDate } from '../../utils/datetime';
import { getFormattedRateValue, isUnknownPeer, matchPeer } from '../../utils/metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';

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

export const toDatapoints = (metric: NamedMetric): ChartDataPoint[] => {
  return metric.values.map(v => ({
    name: metric.shortName,
    date: getFormattedDate(getDateFromUnix(v[0])),
    x: getDateFromUnix(v[0]),
    y: Number(v[1])
  }));
};

export const chartVoronoi = (legendData: LegendDataItem[], metricType: MetricType) => {
  const CursorVoronoiContainer = createContainer('voronoi', 'cursor');
  const tooltipData = legendData.map(item => ({ ...item, name: item.tooltipName }));
  return (
    <CursorVoronoiContainer
      cursorDimension="x"
      labels={(dp: { datum: ChartDataPoint }) => {
        return dp.datum.y || dp.datum.y === 0 ? getFormattedRateValue(dp.datum.y, metricType) : 'n/a';
      }}
      labelComponent={<ChartLegendTooltip legendData={tooltipData} title={(datum: ChartDataPoint) => datum.date} />}
      mouseFollowTooltips
      voronoiDimension="x"
      voronoiPadding={50}
    />
  );
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
  scope: MetricScope,
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
    case 'host':
      return t('(non nodes)');
    case 'namespace':
    case 'owner':
    case 'resource':
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

export const observe = (
  containerRef: React.RefObject<HTMLDivElement>,
  dimensions: Dimensions,
  setDimensions: React.Dispatch<React.SetStateAction<Dimensions>>
) => {
  getResizeObserver(containerRef.current!, () => {
    if (containerRef?.current?.clientWidth || containerRef?.current?.clientHeight) {
      const newDimension = {
        width: containerRef?.current?.clientWidth || defaultDimensions.width,
        height: containerRef?.current?.clientHeight || defaultDimensions.height
      };

      if (newDimension.width !== dimensions.width || newDimension.height !== dimensions.height) {
        setDimensions(newDimension);
      }
    }
  });
};
