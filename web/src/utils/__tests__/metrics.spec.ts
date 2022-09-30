import { RawTopologyMetrics, TopologyMetric } from '../../api/loki';
import { computeStepInterval } from '../datetime';
import { computeStats } from '../metrics';

describe('computeStats', () => {
  it('should compute simple stats', () => {
    // 300s range
    const range = { from: 1664372000, to: 1664372300 };
    const info = computeStepInterval(range);
    expect(info.stepSeconds).toEqual(15);
    const values = [] as [number, string][];
    for (let i = range.from; i < range.to; i += info.stepSeconds) {
      if (i < 1664372100) {
        // 7 times "5"
        values.push([i, '5']);
      } else if (i < 1664372200) {
        // then 7 times "10"
        values.push([i, '10']);
      } else {
        // then 6 times "8"
        values.push([i, '8']);
      }
    } // sum = 153

    const raw: RawTopologyMetrics = {
      metric: {} as TopologyMetric,
      values: values
    };
    const m = computeStats(raw, range);

    expect(m.stats.latest).toEqual(8);
    expect(m.stats.max).toEqual(10);
    expect(m.stats.avg).toEqual(7.65 /* 153/20 */);
    expect(m.stats.total).toEqual(2295 /* 7.65*300 */);
  });

  it('should compute stats with missing data points', () => {
    // 300s range
    const range = { from: 1664372000, to: 1664372300 };
    const info = computeStepInterval(range);
    expect(info.stepSeconds).toEqual(15);
    const values = [] as [number, string][];
    for (let i = range.from; i < range.to; i += info.stepSeconds) {
      if (i < 1664372100) {
        // 7 times "5"
        values.push([i, '5']);
      } else if (i < 1664372200) {
        // then 7 times "10"
        values.push([i, '10']);
      } else {
        // missing data points, stands for "0"
      }
    } // sum = 105

    const raw: RawTopologyMetrics = {
      metric: {} as TopologyMetric,
      values: values
    };
    const m = computeStats(raw, range);

    expect(m.stats.latest).toEqual(0);
    expect(m.stats.max).toEqual(10);
    expect(m.stats.avg).toEqual(5.25 /* 105/20 */);
    expect(m.stats.total).toEqual(1575 /* 5.25*300 */);
  });
});
