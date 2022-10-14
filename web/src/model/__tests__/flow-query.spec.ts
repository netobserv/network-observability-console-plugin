import { findFilter } from '../../utils/filter-definitions';
import { groupFiltersMatchAll, groupFiltersMatchAny } from '../flow-query';

const t = (k: string) => k;

describe('groupFiltersMatchAll', () => {
  it('should encode', () => {
    const grouped = groupFiltersMatchAll([
      {
        def: findFilter(t, 'src_name')!,
        values: [{ v: 'test1' }, { v: 'test2' }]
      }
    ]);
    expect(grouped).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate AND groups', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'src_name')!,
          values: [{ v: 'test1' }, { v: 'test2' }]
        },
        {
          def: findFilter(t, 'src_namespace')!,
          values: [{ v: 'ns' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&SrcK8S_Namespace=ns');
  });

  it('should generate AND groups, ORed by Src/Dst', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'test1' }, { v: 'test2' }]
        },
        {
          def: findFilter(t, 'port')!,
          values: [{ v: '443' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&SrcPort=443|DstK8S_Name=test1,test2&DstPort=443');
  });

  it('should generate AND groups, ORed by Src/Dst&!Src', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'namespace')!,
          values: [{ v: 'test1' }, { v: 'test2' }]
        },
        {
          def: findFilter(t, 'port')!,
          values: [{ v: '443' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Namespace=test1,test2&SrcPort=443|DstK8S_Namespace=test1,test2&SrcK8S_Namespace!=test1,test2&DstPort=443'
    );
  });

  it('should generate AND groups, ORed by Src/Dst, mixed with non-Src/Dst grouped', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'test' }]
        },
        {
          def: findFilter(t, 'port')!,
          values: [{ v: '443' }]
        },
        {
          def: findFilter(t, 'src_kind')!,
          values: [{ v: 'Pod' }]
        },
        {
          def: findFilter(t, 'protocol')!,
          values: [{ v: '6' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Name=test&SrcPort=443&SrcK8S_Type=Pod&Proto=6' + '|DstK8S_Name=test&DstPort=443&SrcK8S_Type=Pod&Proto=6'
    );
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'src_resource')!,
          values: [{ v: 'Pod.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Pod.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Node.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'DaemonSet.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate Src/Dst K8S resource ANDed with Name', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAll([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Pod.ns.test' }]
        },
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'nomatch' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"&SrcK8S_Name=nomatch' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"&DstK8S_Name=nomatch'
    );
  });
});

describe('groupFiltersMatchAny', () => {
  it('should encode', () => {
    const grouped = groupFiltersMatchAny([
      {
        def: findFilter(t, 'src_name')!,
        values: [{ v: 'test1' }, { v: 'test2' }]
      }
    ]);
    expect(grouped).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate OR groups', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'src_name')!,
          values: [{ v: 'test1' }, { v: 'test2' }]
        },
        {
          def: findFilter(t, 'src_namespace')!,
          values: [{ v: 'ns' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|SrcK8S_Namespace=ns');
  });

  it('should generate OR groups, including for Src/Dst', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'test1' }, { v: 'test2' }]
        },
        {
          def: findFilter(t, 'port')!,
          values: [{ v: '443' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|DstK8S_Name=test1,test2|SrcPort=443|DstPort=443');
  });

  it('should generate flat OR groups, including for Src/Dst', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'test' }]
        },
        {
          def: findFilter(t, 'port')!,
          values: [{ v: '443' }]
        },
        {
          def: findFilter(t, 'src_kind')!,
          values: [{ v: 'Pod' }]
        },
        {
          def: findFilter(t, 'protocol')!,
          values: [{ v: '6' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Name=test|DstK8S_Name=test|SrcPort=443|DstPort=443|SrcK8S_Type=Pod|Proto=6');
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'src_resource')!,
          values: [{ v: 'Pod.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Pod.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Node.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner Src/Dst K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'DaemonSet.ns.test' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate Src/Dst K8S resource ORed with Name', () => {
    const grouped = decodeURIComponent(
      groupFiltersMatchAny([
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: 'Pod.ns.test' }]
        },
        {
          def: findFilter(t, 'name')!,
          values: [{ v: 'nomatch' }]
        }
      ])
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"' +
        '|SrcK8S_Name=nomatch|DstK8S_Name=nomatch'
    );
  });
});
