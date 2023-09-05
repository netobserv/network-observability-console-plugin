import { findFilter } from '../filter-definitions';
import { Filter, FilterId, FilterValue, Filters } from '../../model/filters';
import { getFlows, getTopologyMetrics } from '../../api/routes';
import { getFetchFunctions, mergeTopologyMetricsBNF } from '../back-and-forth';
import { filtersToString } from '../../model/flow-query';
import { RawTopologyMetrics, TopologyMetricsResult } from '../../api/loki';
import { parseTopologyMetrics } from '../metrics';

jest.mock('../../api/routes', () => ({
  getFlows: jest.fn(() => Promise.resolve({ records: [] })),
  getTopologyMetrics: jest.fn(() => Promise.resolve({ metrics: [] }))
}));
const getFlowsMock = getFlows as jest.Mock;
const getTopologyMock = getTopologyMetrics as jest.Mock;

const filter = (id: FilterId, values: FilterValue[], not?: boolean): Filter => {
  return {
    def: findFilter((k: string) => k, id)!,
    values: values,
    not: not
  };
};

const getEncodedFilter = (filters: Filters, matchAny: boolean) => {
  getFetchFunctions(filters, matchAny).getFlows({
    filters: filtersToString(filters.list, matchAny),
    recordType: 'flowLog',
    limit: 5,
    packetLoss: 'all'
  });
  expect(getFlowsMock).toHaveBeenCalledTimes(1);
  return getFlowsMock.mock.calls[0][0].filters;
};

const getDecodedFilter = (filters: Filters, matchAny: boolean) => {
  return decodeURIComponent(getEncodedFilter(filters, matchAny));
};

describe('Match all, flows', () => {
  beforeEach(() => {
    getFlowsMock.mockClear();
  });

  it('should encode', () => {
    const filters = getEncodedFilter(
      { list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }])], backAndForth: false },
      false
    );
    expect(filters).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate AND groups', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('src_namespace', [{ v: 'ns' }])],
        backAndForth: false
      },
      false
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&SrcK8S_Namespace=ns');
  });

  it('should generate AND groups, back and forth', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('dst_port', [{ v: '443' }])],
        backAndForth: true
      },
      false
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&DstPort=443|DstK8S_Name=test1,test2&SrcPort=443');
  });

  it('should filter for namespace to owner back and forth', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_namespace', [{ v: 'ns' }]), filter('dst_owner_name', [{ v: 'test' }])],
        backAndForth: true
      },
      false
    );
    expect(grouped).toEqual('SrcK8S_Namespace=ns&DstK8S_OwnerName=test|DstK8S_Namespace=ns&SrcK8S_OwnerName=test');
  });

  it('should generate AND groups, back and forth, mixed with non-Src/Dst', () => {
    const grouped = getDecodedFilter(
      {
        list: [
          filter('src_name', [{ v: 'test' }]),
          filter('dst_port', [{ v: '443' }]),
          filter('src_kind', [{ v: 'Pod' }]),
          filter('protocol', [{ v: '6' }])
        ],
        backAndForth: true
      },
      false
    );
    expect(grouped).toEqual(
      'SrcK8S_Name=test&DstPort=443&SrcK8S_Type=Pod&Proto=6' + '|DstK8S_Name=test&SrcPort=443&DstK8S_Type=Pod&Proto=6'
    );
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: false },
      false
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: true },
      false
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node Src/Dst K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Node.test' }])], backAndForth: true },
      false
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner Src/Dst K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'DaemonSet.ns.test' }])], backAndForth: true },
      false
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate Src/Dst K8S resource ANDed with Dst Name, back and forth', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_resource', [{ v: 'Pod.ns.test' }]), filter('dst_name', [{ v: 'peer' }])],
        backAndForth: true
      },
      false
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"&DstK8S_Name=peer' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"&SrcK8S_Name=peer'
    );
  });
});

describe('Match any, flows', () => {
  beforeEach(() => {
    getFlowsMock.mockClear();
  });

  it('should encode', () => {
    const grouped = getEncodedFilter(
      { list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }])], backAndForth: false },
      true
    );
    expect(grouped).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate OR groups', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('src_namespace', [{ v: 'ns' }])],
        backAndForth: false
      },
      true
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|SrcK8S_Namespace=ns');
  });

  it('should generate OR groups, back and forth', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('dst_port', [{ v: '443' }])],
        backAndForth: true
      },
      true
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|DstPort=443|DstK8S_Name=test1,test2|SrcPort=443');
  });

  it('should generate flat OR groups, back and forth', () => {
    const grouped = getDecodedFilter(
      {
        list: [
          filter('src_name', [{ v: 'test' }]),
          filter('src_port', [{ v: '443' }]),
          filter('src_kind', [{ v: 'Pod' }]),
          filter('protocol', [{ v: '6' }])
        ],
        backAndForth: true
      },
      true
    );
    expect(grouped).toEqual(
      'SrcK8S_Name=test|SrcPort=443|SrcK8S_Type=Pod|Proto=6|DstK8S_Name=test|DstPort=443|DstK8S_Type=Pod'
    );
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: false },
      true
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: true },
      true
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'Node.test' }])], backAndForth: true },
      true
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner K8S resource, back and forth', () => {
    const grouped = getDecodedFilter(
      { list: [filter('src_resource', [{ v: 'DaemonSet.ns.test' }])], backAndForth: true },
      true
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate K8S resource, back and forth, ORed with Name', () => {
    const grouped = getDecodedFilter(
      {
        list: [filter('src_resource', [{ v: 'Pod.ns.test' }]), filter('dst_name', [{ v: 'peer' }])],
        backAndForth: true
      },
      true
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Name=peer' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"' +
        '|SrcK8S_Name=peer'
    );
  });
});

const getTopoForFilter = (filters: Filters, matchAny: boolean) => {
  getFetchFunctions(filters, matchAny).getTopologyMetrics(
    {
      filters: filtersToString(filters.list, matchAny),
      recordType: 'flowLog',
      limit: 5,
      packetLoss: 'all'
    },
    300
  );
};

describe('Match all, topology', () => {
  beforeEach(() => {
    getTopologyMock.mockClear();
  });

  it('should encode', () => {
    getTopoForFilter({ list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }])], backAndForth: false }, false);
    expect(getTopologyMock).toHaveBeenCalledTimes(1);
    expect(getTopologyMock.mock.calls[0][0].filters).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate AND groups', () => {
    getTopoForFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('src_namespace', [{ v: 'ns' }])],
        backAndForth: false
      },
      false
    );
    expect(getTopologyMock).toHaveBeenCalledTimes(1);
    expect(decodeURIComponent(getTopologyMock.mock.calls[0][0].filters)).toEqual(
      'SrcK8S_Name=test1,test2&SrcK8S_Namespace=ns'
    );
  });

  it('should generate AND groups, back and forth', () => {
    getTopoForFilter(
      {
        list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('dst_port', [{ v: '443' }])],
        backAndForth: true
      },
      false
    );
    expect(getTopologyMock).toHaveBeenCalledTimes(3);
    expect(decodeURIComponent(getTopologyMock.mock.calls[0][0].filters)).toEqual('SrcK8S_Name=test1,test2&DstPort=443');
    expect(decodeURIComponent(getTopologyMock.mock.calls[1][0].filters)).toEqual('DstK8S_Name=test1,test2&SrcPort=443');
    expect(decodeURIComponent(getTopologyMock.mock.calls[2][0].filters)).toEqual(
      'SrcK8S_Name=test1,test2&DstPort=443&DstK8S_Name=test1,test2&SrcPort=443'
    );
  });
});

describe('Merge topology BNF', () => {
  const range = { from: 0, to: 300 };
  const genNsMetric = (
    srcns: string | undefined,
    dstns: string | undefined,
    value1stHalf: number | undefined,
    value2ndHalf: number | undefined
  ): RawTopologyMetrics => {
    const m: RawTopologyMetrics = {
      metric: { SrcK8S_Namespace: srcns, DstK8S_Namespace: dstns },
      values: []
    };
    if (value1stHalf !== undefined) {
      for (let i = 0; i < 10; i++) {
        m.values.push([i * 15, value1stHalf]);
      }
    }
    if (value2ndHalf !== undefined) {
      for (let i = 10; i < 20; i++) {
        m.values.push([i * 15, value2ndHalf]);
      }
    }
    return m;
  };

  it('should merge without overlap', () => {
    const rsOrig: TopologyMetricsResult = {
      metrics: parseTopologyMetrics(
        [
          genNsMetric('foo', 'bar', 10, 20),
          genNsMetric('foo', 'foo', 10, 5),
          genNsMetric('foo', undefined, 5, undefined)
        ],
        range,
        'bytes',
        'namespace',
        0,
        true
      ),
      stats: { limitReached: true, numQueries: 2 }
    };
    const rsSwap: TopologyMetricsResult = {
      metrics: parseTopologyMetrics(
        [genNsMetric('bar', 'foo', 1, 1), genNsMetric('foo', 'foo', 5, 5)],
        range,
        'bytes',
        'namespace',
        0,
        true
      ),
      stats: { limitReached: false, numQueries: 1 }
    };

    const merged = mergeTopologyMetricsBNF(range, rsOrig, rsSwap);
    expect(merged.metrics).toHaveLength(4);
    expect(merged.metrics[0].source.namespace).toEqual('foo');
    expect(merged.metrics[0].destination.namespace).toEqual('bar');
    expect(merged.metrics[0].stats).toEqual({
      avg: 15,
      max: 20,
      total: 4275,
      latest: 20
    });
    expect(merged.metrics[1].source.namespace).toEqual('foo');
    expect(merged.metrics[1].destination.namespace).toEqual('foo');
    expect(merged.metrics[1].stats).toEqual({
      avg: 12.5,
      max: 15,
      total: 3562,
      latest: 10
    });
    expect(merged.metrics[2].source.namespace).toEqual('foo');
    expect(merged.metrics[2].destination.namespace).toBeUndefined();
    expect(merged.metrics[2].stats).toEqual({
      avg: 2.63,
      max: 5,
      total: 710,
      latest: 0
    });
    expect(merged.metrics[3].source.namespace).toEqual('bar');
    expect(merged.metrics[3].destination.namespace).toEqual('foo');
    expect(merged.metrics[3].stats).toEqual({
      avg: 1,
      max: 1,
      total: 285,
      latest: 1
    });
    expect(merged.stats).toEqual({ limitReached: true, numQueries: 3 });
  });

  it('should merge with overlap', () => {
    const rsOrig: TopologyMetricsResult = {
      metrics: parseTopologyMetrics(
        [
          genNsMetric('foo', 'bar', 10, 20),
          genNsMetric('foo', 'foo', 10, 5),
          genNsMetric('foo', undefined, 5, undefined)
        ],
        range,
        'bytes',
        'namespace',
        0,
        true
      ),
      stats: { limitReached: true, numQueries: 2 }
    };
    const rsSwap: TopologyMetricsResult = {
      metrics: parseTopologyMetrics(
        [genNsMetric('bar', 'foo', 1, 1), genNsMetric('foo', 'foo', 5, 5)],
        range,
        'bytes',
        'namespace',
        0,
        true
      ),
      stats: { limitReached: false, numQueries: 1 }
    };
    const rsOverlap: TopologyMetricsResult = {
      metrics: parseTopologyMetrics([genNsMetric('foo', 'foo', 3, 3)], range, 'bytes', 'namespace', 0, true),
      stats: { limitReached: false, numQueries: 1 }
    };

    const merged = mergeTopologyMetricsBNF(range, rsOrig, rsSwap, rsOverlap);
    expect(merged.metrics).toHaveLength(4);
    expect(merged.metrics[0].source.namespace).toEqual('foo');
    expect(merged.metrics[0].destination.namespace).toEqual('bar');
    expect(merged.metrics[0].stats).toEqual({
      avg: 15,
      max: 20,
      total: 4275,
      latest: 20
    });
    expect(merged.metrics[1].source.namespace).toEqual('foo');
    expect(merged.metrics[1].destination.namespace).toEqual('foo');
    expect(merged.metrics[1].stats).toEqual({
      avg: 9.5,
      max: 12,
      total: 2707,
      latest: 7
    });
    expect(merged.metrics[2].source.namespace).toEqual('foo');
    expect(merged.metrics[2].destination.namespace).toBeUndefined();
    expect(merged.metrics[2].stats).toEqual({
      avg: 2.63,
      max: 5,
      total: 710,
      latest: 0
    });
    expect(merged.metrics[3].source.namespace).toEqual('bar');
    expect(merged.metrics[3].destination.namespace).toEqual('foo');
    expect(merged.metrics[3].stats).toEqual({
      avg: 1,
      max: 1,
      total: 285,
      latest: 1
    });
    expect(merged.stats).toEqual({ limitReached: true, numQueries: 4 });
  });
});
