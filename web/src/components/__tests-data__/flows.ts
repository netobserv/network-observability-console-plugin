import { parseStream, RecordsResult, StreamResult } from '../../api/loki';
import { FlowDirection, Record } from '../../api/ipfix';
import flowsJson from '../../../../mocks/loki/flows.json';

export const FlowsMock: Record[] = (flowsJson.data.result as StreamResult[]).flatMap(r => parseStream(r));

export const FlowsResultMock: RecordsResult = {
  records: FlowsMock,
  stats: {
    limitReached: FlowsMock.length >= 100,
    numQueries: 1
  }
};

export const FlowsSample: Record[] = [
  {
    labels: {
      _RecordType: 'flowLog',
      FlowDirection: FlowDirection.Egress,
      SrcK8S_Namespace: 'default',
      DstK8S_Namespace: 'default'
    },
    key: 1,
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
      DstMac: '0a:58:0a:80:00:17',
      TimeFlowEndMs: 1639058287000,
      TimeFlowStartMs: 1639058286000,
      TimeReceived: 1639058290
    }
  },
  {
    labels: {
      _RecordType: 'flowLog',
      FlowDirection: FlowDirection.Ingress,
      SrcK8S_Namespace: 'openshift-console',
      DstK8S_Namespace: 'netowrk-observability'
    },
    key: 2,
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
      DstMac: '0a:58:0a:80:00:17',
      TimeFlowEndMs: 1639058286000,
      TimeFlowStartMs: 1639058285000,
      TimeReceived: 1639058290
    }
  },
  {
    labels: {
      _RecordType: 'flowLog',
      FlowDirection: FlowDirection.Ingress,
      SrcK8S_Namespace: 'kube-system',
      DstK8S_Namespace: 'default'
    },
    key: 3,
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
      DstMac: '0a:58:0a:80:00:17',
      TimeFlowEndMs: 1639058288000,
      TimeFlowStartMs: 1639058286000,
      TimeReceived: 1639058291,
      DnsId: 123,
      DnsLatencyMs: 0
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
