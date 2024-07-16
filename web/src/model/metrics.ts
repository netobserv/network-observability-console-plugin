import { MetricStats } from '../api/loki';
import { PERCENTILE_VALUES } from '../utils/metrics';
import { StatFunction } from './flow-query';

export enum MetricScopeOptions {
  CLUSTER = 'cluster',
  ZONE = 'zone',
  HOST = 'host',
  NAMESPACE = 'namespace',
  OWNER = 'owner',
  RESOURCE = 'resource'
}

export const getStat = (stats: MetricStats, mf: StatFunction): number => {
  switch (mf) {
    case 'count':
    case 'sum':
      return stats.total;
    case 'rate':
    case 'avg':
      return stats.avg;
    case 'min':
      return stats.min;
    case 'max':
      return stats.max;
    case 'last':
      return stats.latest;
    case 'p90':
      return stats.percentiles[PERCENTILE_VALUES.indexOf(90)];
    case 'p99':
      return stats.percentiles[PERCENTILE_VALUES.indexOf(99)];
  }
};
