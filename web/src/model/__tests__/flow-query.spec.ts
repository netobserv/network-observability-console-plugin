import { findFilter } from '../../utils/filter-definitions';
import { Filter, FilterId, FilterValue } from '../filters';
import { groupFilters } from '../flow-query';

const filter = (id: FilterId, values: FilterValue[], not?: boolean): Filter => {
  return {
    def: findFilter((k: string) => k, id)!,
    values: values,
    not: not
  };
};

describe('groupFiltersMatchAll', () => {
  it('should encode', () => {
    const grouped = groupFilters(
      { list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }])], backAndForth: false },
      false
    );
    expect(grouped).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate AND groups', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('src_namespace', [{ v: 'ns' }])],
          backAndForth: false
        },
        false
      )
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&SrcK8S_Namespace=ns');
  });

  it('should generate AND groups, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('dst_port', [{ v: '443' }])],
          backAndForth: true
        },
        false
      )
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2&DstPort=443|DstK8S_Name=test1,test2&SrcPort=443');
  });

  it('should generate AND groups, back and forth, accounting for overlap', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_namespace', [{ v: 'test1' }, { v: 'test2' }]), filter('src_port', [{ v: '443' }])],
          backAndForth: true
        },
        false
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Namespace=test1,test2&SrcPort=443|DstK8S_Namespace=test1,test2&DstPort=443&SrcK8S_Namespace!=test1,test2'
    );
  });

  it('should not swap and correct overlap on fully symetric parts', () => {
    // For explanations see comments in function "determineOverlap"
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_namespace', [{ v: 'infra*' }], true), filter('dst_namespace', [{ v: 'infra*' }], true)],
          backAndForth: true
        },
        false
      )
    );
    expect(grouped).toEqual('SrcK8S_Namespace!=infra*&DstK8S_Namespace!=infra*');
  });

  it('should not correct overlap on partial symetric parts', () => {
    // For explanations see comments in function "determineOverlap"
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [
            filter('src_namespace', [{ v: 'infra*' }], true),
            filter('src_port', [{ v: '443' }]),
            filter('dst_namespace', [{ v: 'infra*' }], true)
          ],
          backAndForth: true
        },
        false
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Namespace!=infra*&SrcPort=443&DstK8S_Namespace!=infra*|DstK8S_Namespace!=infra*&DstPort=443&SrcK8S_Namespace!=infra*'
    );
  });

  it('should generate AND groups, back and forth, mixed with non-Src/Dst', () => {
    const grouped = decodeURIComponent(
      groupFilters(
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
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Name=test&DstPort=443&SrcK8S_Type=Pod&Proto=6' + '|DstK8S_Name=test&SrcPort=443&DstK8S_Type=Pod&Proto=6'
    );
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: false }, false)
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: true }, false)
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node Src/Dst K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Node.test' }])], backAndForth: true }, false)
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner Src/Dst K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'DaemonSet.ns.test' }])], backAndForth: true }, false)
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate Src/Dst K8S resource ANDed with Dst Name, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_resource', [{ v: 'Pod.ns.test' }]), filter('dst_name', [{ v: 'peer' }])],
          backAndForth: true
        },
        false
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"&DstK8S_Name=peer' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"&SrcK8S_Name=peer'
    );
  });
});

describe('groupFiltersMatchAny', () => {
  it('should encode', () => {
    const grouped = groupFilters(
      { list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }])], backAndForth: false },
      true
    );
    expect(grouped).toEqual('SrcK8S_Name%3Dtest1%2Ctest2');
  });

  it('should generate OR groups', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('src_namespace', [{ v: 'ns' }])],
          backAndForth: false
        },
        true
      )
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|SrcK8S_Namespace=ns');
  });

  it('should generate OR groups, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_name', [{ v: 'test1' }, { v: 'test2' }]), filter('dst_port', [{ v: '443' }])],
          backAndForth: true
        },
        true
      )
    );
    expect(grouped).toEqual('SrcK8S_Name=test1,test2|DstPort=443|DstK8S_Name=test1,test2|SrcPort=443');
  });

  it('should generate flat OR groups, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters(
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
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Name=test|SrcPort=443|SrcK8S_Type=Pod|Proto=6|DstK8S_Name=test|DstPort=443|DstK8S_Type=Pod'
    );
  });

  it('should generate simple Src K8S resource', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: false }, true)
    );
    expect(grouped).toEqual('SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"');
  });

  it('should generate K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Pod.ns.test' }])], backAndForth: true }, true)
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"'
    );
  });

  it('should generate Node K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'Node.test' }])], backAndForth: true }, true)
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Node"&SrcK8S_Namespace=""&SrcK8S_Name="test"' +
        '|DstK8S_Type="Node"&DstK8S_Namespace=""&DstK8S_Name="test"'
    );
  });

  it('should generate Owner K8S resource, back and forth', () => {
    const grouped = decodeURIComponent(
      groupFilters({ list: [filter('src_resource', [{ v: 'DaemonSet.ns.test' }])], backAndForth: true }, true)
    );
    expect(grouped).toEqual(
      'SrcK8S_OwnerType="DaemonSet"&SrcK8S_Namespace="ns"&SrcK8S_OwnerName="test"' +
        '|DstK8S_OwnerType="DaemonSet"&DstK8S_Namespace="ns"&DstK8S_OwnerName="test"'
    );
  });

  it('should generate K8S resource, back and forth, ORed with Name', () => {
    const grouped = decodeURIComponent(
      groupFilters(
        {
          list: [filter('src_resource', [{ v: 'Pod.ns.test' }]), filter('dst_name', [{ v: 'peer' }])],
          backAndForth: true
        },
        true
      )
    );
    expect(grouped).toEqual(
      'SrcK8S_Type="Pod"&SrcK8S_Namespace="ns"&SrcK8S_Name="test"' +
        '|DstK8S_Name=peer' +
        '|DstK8S_Type="Pod"&DstK8S_Namespace="ns"&DstK8S_Name="test"' +
        '|SrcK8S_Name=peer'
    );
  });
});
