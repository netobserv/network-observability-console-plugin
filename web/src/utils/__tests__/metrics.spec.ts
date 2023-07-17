import { RawTopologyMetrics, TopologyMetricPeer, TopologyMetrics } from '../../api/loki';
import { NodeData } from '../../model/topology';
import {
  calibrateRange,
  computeStats,
  createPeer,
  getFormattedValue,
  matchPeer,
  normalizeMetrics,
  parseMetrics
} from '../metrics';

const t = (k: string) => k;

describe('normalize and computeStats', () => {
  it('should normalize and compute simple stats', () => {
    const values: [number, unknown][] = [
      [1664372000, '5'],
      [1664372015, '5'],
      [1664372030, '5'],
      [1664372045, '5'],
      [1664372060, '5'],
      [1664372075, '5'],
      [1664372090, '5'],
      [1664372105, '10'],
      [1664372120, '10'],
      [1664372135, '10'],
      [1664372150, '10'],
      [1664372165, '10'],
      [1664372180, '10'],
      [1664372195, '10'],
      [1664372210, '8'],
      [1664372225, '8'],
      [1664372240, '8'],
      [1664372255, '8'],
      [1664372270, '8'],
      [1664372285, '8'],
      [1664372300, '8']
    ];

    const { start, end, step } = calibrateRange([values], { from: 1664372000, to: 1664372300 }, 1664372300, true);
    const norm = normalizeMetrics(values, start, end, step);
    expect(norm).toEqual([
      [1664372000, 5],
      [1664372015, 5],
      [1664372030, 5],
      [1664372045, 5],
      [1664372060, 5],
      [1664372075, 5],
      [1664372090, 5],
      [1664372105, 10],
      [1664372120, 10],
      [1664372135, 10],
      [1664372150, 10],
      [1664372165, 10],
      [1664372180, 10],
      [1664372195, 10],
      [1664372210, 8],
      [1664372225, 8],
      [1664372240, 8],
      [1664372255, 8],
      [1664372270, 8],
      [1664372285, 8],
      [1664372300, 8]
    ]);

    const stats = computeStats(norm);

    expect(stats.latest).toEqual(8);
    expect(stats.max).toEqual(10);
    expect(stats.avg).toEqual(7.67 /* 161/21 */);
    expect(stats.total).toEqual(2300 /* 7.67*300 */);
  });

  it('should normalize and compute stats with missing close to "now"', () => {
    // Building data so that there is a missing datapoint at +300s, which is close to "now"
    // This missing datapoint should be ignored for tolerance, rather than counted as a zero
    const now = Math.floor(new Date().getTime() / 1000);
    const first = now - 330;
    const values: [number, unknown][] = [
      [first, '5'],
      [first + 15, '5'],
      [first + 30, '5'],
      [first + 45, '5'],
      [first + 60, '5'],
      [first + 75, '5'],
      [first + 90, '5'],
      [first + 105, '10'],
      [first + 120, '10'],
      [first + 135, '10'],
      [first + 150, '10'],
      [first + 165, '10'],
      [first + 180, '10'],
      [first + 195, '10'],
      [first + 210, '8'],
      [first + 225, '8'],
      [first + 240, '8'],
      [first + 255, '8'],
      [first + 270, '8'],
      [first + 285, '8']
    ];

    const { start, end, step } = calibrateRange([values], 300, now, true);
    const norm = normalizeMetrics(values, start, end, step);
    expect(norm).toEqual([
      [first, 5],
      [first + 15, 5],
      [first + 30, 5],
      [first + 45, 5],
      [first + 60, 5],
      [first + 75, 5],
      [first + 90, 5],
      [first + 105, 10],
      [first + 120, 10],
      [first + 135, 10],
      [first + 150, 10],
      [first + 165, 10],
      [first + 180, 10],
      [first + 195, 10],
      [first + 210, 8],
      [first + 225, 8],
      [first + 240, 8],
      [first + 255, 8],
      [first + 270, 8],
      [first + 285, 8]
    ]);

    const stats = computeStats(norm);

    expect(stats.latest).toEqual(8);
    expect(stats.max).toEqual(10);
    expect(stats.avg).toEqual(7.65 /* 153/20 */);
    expect(stats.total).toEqual(2180 /* 7.65*285 */);
  });

  it('should normalize and compute stats with missing data points', () => {
    // No data between 1664372105 and 1664372195
    const values: [number, unknown][] = [
      [1664372000, '5'],
      [1664372015, '5'],
      [1664372030, '5'],
      [1664372045, '5'],
      [1664372060, '5'],
      [1664372075, '5'],
      [1664372090, '5'],
      [1664372210, '8'],
      [1664372225, '8'],
      [1664372240, '8'],
      [1664372255, '8'],
      [1664372270, '8'],
      [1664372285, '8'],
      [1664372300, '8']
    ];

    const { start, end, step } = calibrateRange([values], { from: 1664372000, to: 1664372300 }, 1664372300, true);
    const norm = normalizeMetrics(values, start, end, step);
    expect(norm).toEqual([
      [1664372000, 5],
      [1664372015, 5],
      [1664372030, 5],
      [1664372045, 5],
      [1664372060, 5],
      [1664372075, 5],
      [1664372090, 5],
      [1664372105, 0],
      [1664372120, 0],
      [1664372135, 0],
      [1664372150, 0],
      [1664372165, 0],
      [1664372180, 0],
      [1664372195, 0],
      [1664372210, 8],
      [1664372225, 8],
      [1664372240, 8],
      [1664372255, 8],
      [1664372270, 8],
      [1664372285, 8],
      [1664372300, 8]
    ]);

    const stats = computeStats(norm);

    expect(stats.latest).toEqual(8);
    expect(stats.max).toEqual(8);
    expect(stats.avg).toEqual(4.33 /* 91/21 */);
    expect(stats.total).toEqual(1300 /* 4.33*300 */);
  });
});

describe('matchPeers', () => {
  it('should match namespace nodes', () => {
    const peers: TopologyMetricPeer[] = [createPeer({ namespace: '' }), createPeer({ namespace: 'test' })];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown',
      peer: createPeer({})
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With test namespace
    data.nodeType = 'namespace';
    data.peer = createPeer({ namespace: 'test' });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);

    // With another namespace
    data.peer = createPeer({ namespace: 'test2' });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([]);
  });

  it('should match owner nodes', () => {
    const peers: TopologyMetricPeer[] = [
      createPeer({ namespace: '' }),
      createPeer({
        namespace: 'ns1',
        owner: { name: 'depl-a', type: 'Deployment' }
      }),
      createPeer({
        namespace: 'ns1',
        owner: { name: 'depl-b', type: 'Deployment' }
      }),
      createPeer({
        namespace: 'ns1',
        owner: { name: 'depl-a', type: 'DaemonSet' }
      }),
      createPeer({
        namespace: 'ns2',
        owner: { name: 'depl-a', type: 'Deployment' }
      })
    ];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown',
      peer: createPeer({})
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With depl-a deployment
    data.nodeType = 'owner';
    data.peer = createPeer({ owner: { type: 'Deployment', name: 'depl-a' }, namespace: 'ns1' });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);
  });

  it('should match resource nodes', () => {
    const peers: TopologyMetricPeer[] = [
      createPeer({ namespace: '' }),
      createPeer({
        namespace: 'ns1',
        owner: { name: 'depl-a', type: 'Deployment' },
        resource: { name: 'depl-a-12345', type: 'Pod' },
        addr: '1.2.3.4'
      }),
      createPeer({
        namespace: 'ns1',
        owner: { name: 'depl-b', type: 'Deployment' },
        resource: { name: 'depl-b-67890', type: 'Pod' },
        addr: '1.2.3.5'
      }),
      createPeer({
        namespace: 'ns1',
        resource: { name: 'svc-a', type: 'Service' },
        addr: '1.2.3.6'
      }),
      createPeer({
        namespace: 'ns2',
        owner: { name: 'depl-a', type: 'Deployment' },
        resource: { name: 'depl-a-12345', type: 'Pod' },
        addr: '1.2.3.7'
      })
    ];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown',
      peer: createPeer({})
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With depl-a-12345 pod
    data.nodeType = 'resource';
    data.peer = createPeer({
      resource: { name: 'depl-a-12345', type: 'Pod' },
      owner: { name: 'depl-a', type: 'Deployment' },
      namespace: 'ns1',
      addr: '1.2.3.4'
    });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);
  });

  it('should match group', () => {
    const peers: TopologyMetricPeer[] = [
      createPeer({ namespace: '' }),
      createPeer({
        namespace: 'ns1',
        hostName: 'host1',
        owner: { name: 'depl-a', type: 'Deployment' },
        resource: { name: 'depl-a-12345', type: 'Pod' },
        addr: '1.2.3.4'
      }),
      createPeer({
        namespace: 'ns1',
        hostName: 'host2',
        owner: { name: 'depl-b', type: 'Deployment' },
        resource: { name: 'depl-b-6789', type: 'Pod' },
        addr: '1.2.3.5'
      }),
      createPeer({
        namespace: 'ns1',
        resource: { name: 'Service', type: 'scv-a' },
        addr: '1.2.3.6'
      }),
      createPeer({
        namespace: 'ns2',
        hostName: 'host1',
        owner: { name: 'depl-a', type: 'Deployment' },
        resource: { name: 'depl-a-12345', type: 'Pod' },
        addr: '1.2.3.7'
      })
    ];

    // With namespace group
    const data: NodeData = {
      nodeType: 'namespace',
      peer: createPeer({ namespace: 'ns1' })
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1], peers[2], peers[3]]);

    // With node group
    data.nodeType = 'host';
    data.peer = createPeer({ hostName: 'host1' });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1], peers[4]]);

    // With node+namespace
    data.peer = createPeer({ namespace: 'ns2', hostName: 'host1' });

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[4]]);
  });
});

describe('parseMetrics', () => {
  it('should disambiguate same names', () => {
    const metrics: RawTopologyMetrics[] = [
      {
        metric: {
          SrcK8S_Name: 'A',
          SrcK8S_Namespace: 'ns1',
          SrcK8S_Type: 'Pod',
          DstK8S_Name: 'B',
          DstK8S_Namespace: 'ns1',
          DstK8S_Type: 'Pod'
        },
        values: []
      },
      {
        metric: {
          SrcK8S_Name: 'A',
          SrcK8S_Namespace: 'ns1',
          SrcK8S_Type: 'Pod',
          DstK8S_Name: 'B',
          DstK8S_Namespace: 'ns1',
          DstK8S_Type: 'Service'
        },
        values: []
      }
    ];

    const parsed = parseMetrics(metrics, 300, 'resource', 0, true) as TopologyMetrics[];

    expect(parsed).toHaveLength(2);
    expect(parsed[0].source.getDisplayName(true, true)).toEqual('ns1.A');
    expect(parsed[0].destination.getDisplayName(true, true)).toEqual('ns1.B (pod)');
    expect(parsed[1].source.getDisplayName(true, true)).toEqual('ns1.A');
    expect(parsed[1].destination.getDisplayName(true, true)).toEqual('ns1.B (svc)');
  });
});

describe('getFormattedValue', () => {
  it('should format BPS', () => {
    expect(getFormattedValue(500, 'bytes', 'last', t)).toBe('500 Bps');
    expect(getFormattedValue(1300, 'bytes', 'avg', t)).toBe('1.3 kBps');
    expect(getFormattedValue(10500, 'bytes', 'max', t)).toBe('10.5 kBps');
    expect(getFormattedValue(1500000, 'bytes', 'avg', t)).toBe('1.5 MBps');
  });

  it('should format absolute bytes', () => {
    expect(getFormattedValue(500, 'bytes', 'sum', t)).toBe('500 B');
    expect(getFormattedValue(10500, 'bytes', 'sum', t)).toBe('10.5 kB');
  });

  it('should format packets rate', () => {
    expect(getFormattedValue(500, 'packets', 'last', t)).toBe('500 Pps');
    expect(getFormattedValue(1300, 'packets', 'avg', t)).toBe('1.3 kPps');
    expect(getFormattedValue(10500, 'packets', 'max', t)).toBe('10.5 kPps');
    expect(getFormattedValue(1500000, 'packets', 'avg', t)).toBe('1.5 MPps');
  });

  it('should format absolute packets', () => {
    expect(getFormattedValue(500, 'packets', 'sum', t)).toBe('500 P');
    expect(getFormattedValue(10500, 'packets', 'sum', t)).toBe('10.5 kP');
  });
});
