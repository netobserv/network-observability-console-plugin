import { TFunction } from 'i18next';
import _ from 'lodash';
import { RawTopologyMetrics, MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { MetricScopeOptions } from '../model/metrics';
import { MetricFunction, MetricType } from '../model/flow-query';
import { elementPerMinText, roundTwoDigits } from './count';
import { computeStepInterval, getRangeEnd, rangeToSeconds, TimeRange } from './datetime';
import { bytesPerSeconds, humanFileSize } from './bytes';

export const parseMetrics = (raw: RawTopologyMetrics, range: number | TimeRange): TopologyMetrics => {
  const stats = computeStats(raw.values, range);
  return {
    source: {
      addr: raw.metric.SrcAddr,
      name: raw.metric.SrcK8S_Name,
      namespace: raw.metric.SrcK8S_Namespace,
      ownerName: raw.metric.SrcK8S_OwnerName,
      ownerType: raw.metric.SrcK8S_OwnerType,
      type: raw.metric.SrcK8S_Type,
      hostName: raw.metric.SrcK8S_HostName
    },
    destination: {
      addr: raw.metric.DstAddr,
      name: raw.metric.DstK8S_Name,
      namespace: raw.metric.DstK8S_Namespace,
      ownerName: raw.metric.DstK8S_OwnerName,
      ownerType: raw.metric.DstK8S_OwnerType,
      type: raw.metric.DstK8S_Type,
      hostName: raw.metric.DstK8S_HostName
    },
    values: raw.values,
    stats: stats
  };
};

/**
 * computeStats computes avg, max and total. Input metric is always the bytes rate (Bps).
 */
export const computeStats = (values: (string | number)[][], range: number | TimeRange): MetricStats => {
  const filtered = values.map(dp => Number(dp[1])).filter(v => !_.isNaN(v));
  if (filtered.length === 0) {
    return { latest: 0, avg: 0, max: 0, total: 0 };
  }

  // TODO: fill missing dp with 0

  // Figure out what's the expected number of datapoints, because series may not contain all datapoints
  // We'll assume that missing datapoints are zeros
  const info = computeStepInterval(range);
  const rangeInSeconds = rangeToSeconds(range);
  const expectedDatapoints = Math.floor(rangeInSeconds / info.stepSeconds);

  // Compute stats
  const sum = filtered.reduce((prev, cur) => prev + cur, 0);
  const avg = sum / expectedDatapoints;
  const max = Math.max(...filtered);

  // Get last datapoint. If the serie ends too early before the expected end range, we assume it's 0
  // (with a tolerance margin)
  const tolerance = 5 * info.stepSeconds;
  const endRange = getRangeEnd(range).getTime() / 1000;
  const lastDP = values[values.length - 1] as [number, string];
  const latest = lastDP[0] >= endRange - tolerance ? Number(lastDP[1]) : 0;

  return {
    latest: roundTwoDigits(latest),
    avg: roundTwoDigits(avg),
    max: roundTwoDigits(max),
    total: Math.floor(avg * rangeInSeconds)
  };
};

export const getMetricName = (peer: TopologyMetricPeer, scope: MetricScopeOptions, t: TFunction): string => {
  switch (scope) {
    case MetricScopeOptions.HOST:
      return peer.hostName ? peer.hostName : peer.type === 'Node' ? peer.name! : t('External');
    case MetricScopeOptions.NAMESPACE:
      return peer.namespace ? peer.namespace : peer.type === 'Namespace' ? peer.name! : t('Unknown');
    case MetricScopeOptions.OWNER:
      return peer.namespace && peer.ownerName
        ? `${peer.namespace}.${peer.ownerName}`
        : peer.ownerName
        ? peer.ownerName
        : t('Unknown');
    case MetricScopeOptions.RESOURCE:
    default:
      return peer.namespace && peer.name
        ? `${peer.namespace}.${peer.name}`
        : peer.name
        ? peer.name
        : peer.addr || t('Unknown');
  }
};

export const getMetricValue = (v: number, mt: MetricType, mf: MetricFunction): string => {
  switch (mt) {
    case 'bytes':
      return mf === 'sum' ? humanFileSize(v, true, 0) : bytesPerSeconds(v);
    case 'packets':
      return mf === 'sum' ? String(v) : elementPerMinText(v);
  }
};

export const matchPeer = (
  type: string,
  namespace: string,
  name: string,
  addr: string,
  peer: TopologyMetricPeer
): boolean => {
  return (
    (type === 'Namespace' && name === peer.namespace) ||
    (type === 'Node' && name === peer.hostName) ||
    (type === peer.ownerType && name === peer.ownerName && namespace === peer.namespace) ||
    (!!addr && addr === peer.addr)
  );
};
