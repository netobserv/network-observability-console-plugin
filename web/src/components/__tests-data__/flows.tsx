import { ParsedStream } from '../../api/loki';

export const FlowsSample: ParsedStream[] = [
  {
    labels: {
      SrcNamespace: 'default',
      DstNamespace: 'default'
    },
    key: '1',
    timestamp: 1639058287000,
    ipfix: {
      SrcAddr: '10.244.0.6',
      DstAddr: '10.244.0.7',
      SrcPod: 'loki-promtail-7bpg8',
      DstPod: 'loki-0',
      SrcPort: 60354,
      DstPort: 3100,
      Packets: 400,
      Proto: 6,
      Bytes: 76800
    }
  },
  {
    labels: {
      SrcNamespace: 'openshift-console',
      DstNamespace: 'netowrk-observability'
    },
    key: '2',
    timestamp: 1639058286000,
    ipfix: {
      SrcAddr: '10.244.0.2',
      DstAddr: '10.244.0.3',
      SrcPod: undefined,
      DstPod: undefined,
      SrcPort: 60350,
      DstPort: 3000,
      Packets: 300,
      Proto: 6,
      Bytes: 7800
    }
  },
  {
    labels: {
      SrcNamespace: 'kube-system',
      DstNamespace: 'default'
    },
    key: '3',
    timestamp: 1639058288000,
    ipfix: {
      SrcAddr: '10.244.0.9',
      DstAddr: '10.244.0.2',
      SrcPod: 'coredns-74ff55c5b-dfbff',
      DstPod: 'loki-1',
      SrcPort: 60354,
      DstPort: 3100,
      Packets: 400,
      Proto: 6,
      Bytes: 76800
    }
  }
];
