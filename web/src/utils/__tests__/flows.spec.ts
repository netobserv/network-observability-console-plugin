import { Fields, Record, FlowDirection } from '../../api/ipfix';
import { mergeFlowReporters } from '../flows';

describe('mergeFlowReporters', () => {
  it('should filter flows depending on reporters', () => {
    // Flows 1 to 6 simulate in-cluster with both INGRESS and EGRESS
    // Flows 7 to 9 simulate cluster-egress
    const flows: Record[] = [
      {
        key: 1,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '10.0.0.2' } as Fields,
        labels: { FlowDirection: FlowDirection.Ingress }
      },
      {
        key: 2,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '10.0.0.2' } as Fields,
        labels: { FlowDirection: FlowDirection.Egress }
      },
      {
        key: 3,
        fields: { SrcAddr: '10.0.0.2', DstAddr: '10.0.0.1' } as Fields,
        labels: { FlowDirection: FlowDirection.Ingress }
      },
      {
        key: 4,
        fields: { SrcAddr: '10.0.0.2', DstAddr: '10.0.0.1' } as Fields,
        labels: { FlowDirection: FlowDirection.Egress }
      },
      {
        key: 5,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '10.0.0.2' } as Fields,
        labels: { FlowDirection: FlowDirection.Ingress }
      },
      {
        key: 6,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '10.0.0.2' } as Fields,
        labels: { FlowDirection: FlowDirection.Egress }
      },
      {
        key: 7,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '43.75.13.32' } as Fields,
        labels: { FlowDirection: FlowDirection.Egress }
      },
      {
        key: 8,
        fields: { SrcAddr: '43.75.13.32', DstAddr: '10.0.0.1' } as Fields,
        labels: { FlowDirection: FlowDirection.Ingress }
      },
      {
        key: 9,
        fields: { SrcAddr: '10.0.0.1', DstAddr: '43.75.13.32' } as Fields,
        labels: { FlowDirection: FlowDirection.Egress }
      }
    ];
    const merged = mergeFlowReporters(flows);
    expect(merged).toHaveLength(6);
    expect(merged.map(r => r.key)).toEqual([1, 3, 5, 7, 8, 9]);
  });
});
