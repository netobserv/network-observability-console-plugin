import * as React from 'react';
import { ChartLegendTooltip, createContainer } from '@patternfly/react-charts';
import { TFunction } from 'i18next';
import { NamedMetric, TopologyMetricPeer, TopologyMetrics } from '../../api/loki';
import { NodeData } from '../../model/topology';
import { getDateFromUnix, getFormattedDate } from '../../utils/datetime';
import { getFormattedRateValue, matchPeer } from '../../utils/metrics';
import { MetricScope, MetricType } from '../../model/flow-query';

export type LegendDataItem = {
  childName?: string;
  name?: string;
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
    name: metric.name,
    date: getFormattedDate(getDateFromUnix(v[0])),
    x: getDateFromUnix(v[0]),
    y: Number(v[1])
  }));
};

export const chartVoronoi = (legendData: LegendDataItem[], metricType: MetricType) => {
  const CursorVoronoiContainer = createContainer('voronoi', 'cursor');
  return (
    <CursorVoronoiContainer
      cursorDimension="x"
      labels={(dp: { datum: ChartDataPoint }) => {
        return dp.datum.y || dp.datum.y === 0 ? getFormattedRateValue(dp.datum.y, metricType) : 'n/a';
      }}
      labelComponent={<ChartLegendTooltip legendData={legendData} title={(datum: ChartDataPoint) => datum.date} />}
      mouseFollowTooltips
      voronoiDimension="x"
      voronoiPadding={50}
    />
  );
};

//TODO: NETOBSERV-635 add this as tab options
// function truncate(input: string) {
//   const length = doubleWidth ? 64 : showDonut ? 10 : 18;
//   if (input.length > length) {
//     return input.substring(0, length / 2) + '…' + input.substring(input.length - length / 2);
//   }
//   return input;
// }

// function truncateParts(input: string) {
//   if (input.includes('.')) {
//     const splitted = input.split('.');
//     const result: string[] = [];
//     splitted.forEach(s => {
//       result.push(truncate(s));
//     });
//     return result.join('.');
//   }
//   return truncate(input);
// }

const getPeerName = (t: TFunction, peer: TopologyMetricPeer, scope: MetricScope): string => {
  if (peer.displayName) {
    return peer.displayName;
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

export const toNamedMetric = (t: TFunction, m: TopologyMetrics, data?: NodeData): NamedMetric => {
  const srcName = getPeerName(t, m.source, m.scope);
  const dstName = getPeerName(t, m.destination, m.scope);
  if (srcName === dstName) {
    if (m.source.displayName) {
      // E.g: namespace "netobserv" to "netobserv"
      return {
        ...m,
        name: `${srcName} (${t('internal')})`,
        isInternal: true
      };
    } else {
      // E.g: host-network traffic while scope is "namespaces"
      return {
        ...m,
        name: srcName,
        isInternal: false
      };
    }
  }
  if (data && matchPeer(data, m.source)) {
    return {
      ...m,
      name: `${t('To')} ${dstName}`,
      isInternal: false
    };
  } else if (data && matchPeer(data, m.destination)) {
    return {
      ...m,
      name: `${t('From')} ${srcName}`,
      isInternal: false
    };
  }
  return {
    ...m,
    name: `${srcName} -> ${dstName}`,
    isInternal: false
  };
};
