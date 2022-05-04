import { RecordsResult } from '../../api/loki';
import { FlowDirection, Record } from '../../api/ipfix';

export const FlowsSample: Record[] = [
  {
    labels: {
      FlowDirection: FlowDirection.Egress,
      SrcK8S_Namespace: 'default',
      DstK8S_Namespace: 'default'
    },
    key: 1,
    timestamp: 1639058287000,
    fields: {
      SrcAddr: '10.244.0.6',
      DstAddr: '10.244.0.7',
      SrcK8S_Name: 'loki-promtail-7bpg8',
      DstK8S_Name: 'loki-0',
      SrcPort: 60354,
      DstPort: 3100,
      Packets: 400,
      Proto: 6,
      Bytes: 76800,
      SrcMac: '8a:f6:69:6b:1a:cc',
      DstMac: '0a:58:0a:80:00:17'
    }
  },
  {
    labels: {
      FlowDirection: FlowDirection.Ingress,
      SrcK8S_Namespace: 'openshift-console',
      DstK8S_Namespace: 'netowrk-observability'
    },
    key: 2,
    timestamp: 1639058286000,
    fields: {
      SrcAddr: '10.244.0.2',
      DstAddr: '10.244.0.3',
      SrcK8S_Name: undefined,
      DstK8S_Name: undefined,
      SrcPort: 60350,
      DstPort: 3000,
      Packets: 300,
      Proto: 6,
      Bytes: 7800,
      SrcMac: '8a:f6:69:6b:1a:cc',
      DstMac: '0a:58:0a:80:00:17'
    }
  },
  {
    labels: {
      FlowDirection: FlowDirection.Ingress,
      SrcK8S_Namespace: 'kube-system',
      DstK8S_Namespace: 'default'
    },
    key: 3,
    timestamp: 1639058288000,
    fields: {
      SrcAddr: '10.244.0.9',
      DstAddr: '10.244.0.2',
      SrcK8S_Name: 'coredns-74ff55c5b-dfbff',
      DstK8S_Name: 'loki-1',
      SrcPort: 60354,
      DstPort: 3100,
      Packets: 400,
      Proto: 6,
      Bytes: 76800,
      SrcMac: '8a:f6:69:6b:1a:cc',
      DstMac: '0a:58:0a:80:00:17'
    }
  }
];

export const FlowsResultSample: RecordsResult = {
  records: FlowsSample,
  stats: {
    limitReached: false,
    numQueries: 1
  }
};
