import { TopologyMetrics } from '../../api/loki';

export const metric1: TopologyMetrics = {
  metric: {
    DstAddr: '172.30.139.153',
    DstK8S_Name: 'loki',
    DstK8S_Namespace: 'network-observability',
    DstK8S_OwnerName: 'loki',
    DstK8S_OwnerType: 'Service',
    DstK8S_Type: 'Service',
    DstK8S_HostName: 'ip-10-0-142-22.ec2.internal',
    SrcAddr: '10.131.0.14',
    SrcK8S_HostName: 'ip-10-0-142-24.ec2.internal',
    SrcK8S_Name: 'flowlogs-pipeline-tskw2',
    SrcK8S_Namespace: 'network-observability',
    SrcK8S_OwnerName: 'flowlogs-pipeline',
    SrcK8S_OwnerType: 'DaemonSet',
    SrcK8S_Type: 'Pod'
  },
  values: [
    [1653989806.227, '3182578'],
    [1653989866.227, '2500000'],
    [1653989926.227, '1234000'],
    [1653989986.227, '5678000'],
    [1653990046.227, '9999999']
  ],
  total: 22594577
};

export const metric2: TopologyMetrics = {
  metric: {
    DstAddr: '172.30.139.153',
    DstK8S_Name: 'loki',
    DstK8S_Namespace: 'network-observability',
    DstK8S_OwnerName: 'loki',
    DstK8S_OwnerType: 'Service',
    DstK8S_Type: 'Service',
    DstK8S_HostName: 'ip-10-0-142-22.ec2.internal',
    SrcAddr: '10.131.0.13',
    SrcK8S_HostName: 'ip-10-0-142-24.ec2.internal',
    SrcK8S_Name: 'flowlogs-pipeline-ahkq',
    SrcK8S_Namespace: 'network-observability',
    SrcK8S_OwnerName: 'flowlogs-pipeline',
    SrcK8S_OwnerType: 'DaemonSet',
    SrcK8S_Type: 'Pod'
  },
  values: [
    [1653989806.227, '1234000'],
    [1653989866.227, '5678000'],
    [1653989926.227, '0'],
    [1653989986.227, '0'],
    [1653990046.227, '0']
  ],
  total: 6912000
};

export const metric3: TopologyMetrics = {
  metric: {
    DstAddr: '172.30.139.100',
    DstK8S_Name: 'pod 2',
    DstK8S_Namespace: 'network-observability',
    DstK8S_OwnerName: 'deployment',
    DstK8S_OwnerType: 'Deployment',
    DstK8S_Type: 'Pod',
    DstK8S_HostName: 'ip-10-0-142-22.ec2.internal',
    SrcAddr: '172.30.139.101',
    SrcK8S_HostName: 'ip-10-0-142-24.ec2.internal',
    SrcK8S_Name: 'pod 1',
    SrcK8S_Namespace: 'network-observability',
    SrcK8S_OwnerName: 'deployment',
    SrcK8S_OwnerType: 'Deployment',
    SrcK8S_Type: 'Pod'
  },
  values: [
    [1653989806.227, '1245923'],
    [1653989866.227, '5682144'],
    [1653989926.227, '9813321'],
    [1653989986.227, '1234567'],
    [1653990046.227, '1234567']
  ],
  total: 19210522
};

export const metrics: TopologyMetrics[] = [metric1, metric2, metric3];
