import { TFunction } from 'i18next';
import _ from 'lodash';
import { RawTopologyMetrics, TopologyMetric, TopologyMetrics } from '../api/loki';
import { MetricScopeOptions } from '../model/metrics';
import { MetricFunction, MetricType } from '../model/flow-query';
import { elementPerMinText, roundTwoDigits } from './count';
import { computeStepInterval, getRangeEnd, rangeToSeconds, TimeRange } from './datetime';
import { bytesPerSeconds, humanFileSize } from './bytes';

/**
 * computeStats computes avg, max and total. Input metric is always the bytes rate (Bps).
 */
export const computeStats = (tm: RawTopologyMetrics, range: number | TimeRange): TopologyMetrics => {
  const values = tm.values.map(dp => Number(dp[1])).filter(v => !_.isNaN(v));
  if (values.length === 0) {
    return {
      ...tm,
      stats: { latest: 0, avg: 0, max: 0, total: 0 }
    };
  }

  // TODO: fill missing dp with 0

  // Figure out what's the expected number of datapoints, because series may not contain all datapoints
  // We'll assume that missing datapoints are zeros
  const info = computeStepInterval(range);
  const rangeInSeconds = rangeToSeconds(range);
  const expectedDatapoints = Math.floor(rangeInSeconds / info.stepSeconds);

  // Compute stats
  const sum = values.reduce((prev, cur) => prev + cur, 0);
  const avg = sum / expectedDatapoints;
  const max = Math.max(...values);

  // Get last datapoint. If the serie ends too early before the expected end range, we assume it's 0
  // (with a tolerance margin)
  const tolerance = 5 * info.stepSeconds;
  const endRange = getRangeEnd(range).getTime() / 1000;
  const lastDP = tm.values[tm.values.length - 1] as [number, string];
  const latest = lastDP[0] >= endRange - tolerance ? Number(lastDP[1]) : 0;

  return {
    ...tm,
    stats: {
      latest: roundTwoDigits(latest),
      avg: roundTwoDigits(avg),
      max: roundTwoDigits(max),
      total: Math.floor(avg * rangeInSeconds)
    }
  };
};

export const getMetricName = (metric: TopologyMetric, scope: MetricScopeOptions, src: boolean, t: TFunction) => {
  const m = metric as never;
  const prefix = src ? 'Src' : 'Dst';
  switch (scope) {
    case MetricScopeOptions.HOST:
      return m[`${prefix}K8S_HostName`]
        ? m[`${prefix}K8S_HostName`]
        : m[`${prefix}K8S_Type`] === 'Node'
        ? m[`${prefix}K8S_Name`]
        : t('External');
    case MetricScopeOptions.NAMESPACE:
      return m[`${prefix}K8S_Namespace`]
        ? m[`${prefix}K8S_Namespace`]
        : m[`${prefix}K8S_Type`] === 'Namespace'
        ? m[`${prefix}K8S_Name`]
        : t('Unknown');
    case MetricScopeOptions.OWNER:
      return m[`${prefix}K8S_Namespace`] && m[`${prefix}K8S_OwnerName`]
        ? `${m[`${prefix}K8S_Namespace`]}.${m[`${prefix}K8S_OwnerName`]}`
        : m[`${prefix}K8S_OwnerName`]
        ? m[`${prefix}K8S_OwnerName`]
        : t('Unknown');
    case MetricScopeOptions.RESOURCE:
    default:
      return m[`${prefix}K8S_Namespace`] && m[`${prefix}K8S_Name`]
        ? `${m[`${prefix}K8S_Namespace`]}.${m[`${prefix}K8S_Name`]}`
        : m[`${prefix}K8S_Name`]
        ? m[`${prefix}K8S_Name`]
        : m[`${prefix}Addr`];
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
