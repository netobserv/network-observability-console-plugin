import { MetricStats } from '../api/loki';
import { MetricFunction } from './flow-query';
import { PERCENTILE_VALUES } from '../utils/metrics';

export enum MetricScopeOptions {
  HOST = 'host',
  NAMESPACE = 'namespace',
  OWNER = 'owner',
  RESOURCE = 'resource'
}

export const getStat = (stats: MetricStats, mf: MetricFunction): number => {
  switch (mf) {
    case 'avg':
      return stats.avg;
    case 'min':
      return stats.min;
    case 'max':
      return stats.max;
    case 'last':
      return stats.latest;
    case 'sum':
      return stats.total;
    case 'p90':
      return stats.percentiles[PERCENTILE_VALUES.indexOf(90)];
    case 'p99':
      return stats.percentiles[PERCENTILE_VALUES.indexOf(99)];
  }
};
