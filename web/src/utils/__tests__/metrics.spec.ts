import { RawTopologyMetrics, TopologyMetricPeer } from '../../api/loki';
import { NodeData } from '../../model/topology';
import { computeStepInterval } from '../datetime';
import { computeStats, matchPeer, parseMetrics } from '../metrics';

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

    const stats = computeStats(values, range);

    expect(stats.latest).toEqual(8);
    expect(stats.max).toEqual(10);
    expect(stats.avg).toEqual(7.65 /* 153/20 */);
    expect(stats.total).toEqual(2295 /* 7.65*300 */);
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

    const stats = computeStats(values, range);

    expect(stats.latest).toEqual(0);
    expect(stats.max).toEqual(10);
    expect(stats.avg).toEqual(5.25 /* 105/20 */);
    expect(stats.total).toEqual(1575 /* 5.25*300 */);
  });
});

describe('matchPeers', () => {
  it('should match namespace nodes', () => {
    const peers: TopologyMetricPeer[] = [
      {
        namespace: ''
      },
      {
        namespace: 'test',
        displayName: 'test'
      }
    ];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown'
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With test namespace
    data.nodeType = 'namespace';
    data.resourceKind = 'Namespace';
    data.name = 'test';

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);

    // With another namespace
    data.nodeType = 'namespace';
    data.resourceKind = 'Namespace';
    data.name = 'test2';

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([]);
  });

  it('should match owner nodes', () => {
    const peers: TopologyMetricPeer[] = [
      {
        namespace: ''
      },
      {
        namespace: 'ns1',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        displayName: 'depl-a (depl)'
      },
      {
        namespace: 'ns1',
        ownerName: 'depl-b',
        ownerType: 'Deployment',
        displayName: 'depl-b'
      },
      {
        namespace: 'ns1',
        ownerName: 'depl-a',
        ownerType: 'DaemonSet',
        displayName: 'depl-a (ds)'
      },
      {
        namespace: 'ns2',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        displayName: 'depl-a (depl)'
      }
    ];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown'
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With depl-a deployment
    data.nodeType = 'owner';
    data.resourceKind = 'Deployment';
    data.name = 'depl-a';
    data.namespace = 'ns1';

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);
  });

  it('should match resource nodes', () => {
    const peers: TopologyMetricPeer[] = [
      {
        namespace: ''
      },
      {
        namespace: 'ns1',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-a-12345',
        addr: '1.2.3.4',
        displayName: 'depl-a-12345'
      },
      {
        namespace: 'ns1',
        ownerName: 'depl-b',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-b-67890',
        addr: '1.2.3.5',
        displayName: 'depl-b-67890'
      },
      {
        namespace: 'ns1',
        type: 'Service',
        name: 'svc-a',
        addr: '1.2.3.6',
        displayName: 'svc-a'
      },
      {
        namespace: 'ns2',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-a-12345',
        addr: '1.2.3.7',
        displayName: 'depl-a-12345'
      }
    ];

    // With unknown
    const data: NodeData = {
      nodeType: 'unknown'
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[0]]);

    // With depl-a deployment
    data.nodeType = 'resource';
    data.resourceKind = 'Pod';
    data.name = 'depl-a';
    data.namespace = 'ns1';
    data.addr = '1.2.3.4';

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1]]);
  });

  it('should match group', () => {
    const peers: TopologyMetricPeer[] = [
      {
        namespace: ''
      },
      {
        namespace: 'ns1',
        hostName: 'host1',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-a-12345',
        addr: '1.2.3.4',
        displayName: 'depl-a-12345'
      },
      {
        namespace: 'ns1',
        hostName: 'host2',
        ownerName: 'depl-b',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-b-67890',
        addr: '1.2.3.5',
        displayName: 'depl-b-67890'
      },
      {
        namespace: 'ns1',
        type: 'Service',
        name: 'svc-a',
        addr: '1.2.3.6',
        displayName: 'svc-a'
      },
      {
        namespace: 'ns2',
        hostName: 'host1',
        ownerName: 'depl-a',
        ownerType: 'Deployment',
        type: 'Pod',
        name: 'depl-a-12345',
        addr: '1.2.3.7',
        displayName: 'depl-a-12345'
      }
    ];

    // With namespace group
    const data: NodeData = {
      nodeType: 'namespace',
      resourceKind: 'Namespace',
      name: 'ns1'
    };

    let matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1], peers[2], peers[3]]);

    // With node group
    data.nodeType = 'host';
    data.resourceKind = 'Node';
    data.name = 'host1';

    matches = peers.filter(p => matchPeer(data, p));
    expect(matches).toEqual([peers[1], peers[4]]);

    // With node+namespace
    data.parentKind = 'Namespace';
    data.parentName = 'ns2';

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

    const parsed = parseMetrics(metrics, 300, 'resource');

    expect(parsed).toHaveLength(2);
    expect(parsed[0].source.displayName).toEqual('ns1.A');
    expect(parsed[0].destination.displayName).toEqual('ns1.B (pod)');
    expect(parsed[1].source.displayName).toEqual('ns1.A');
    expect(parsed[1].destination.displayName).toEqual('ns1.B (svc)');
  });
});
