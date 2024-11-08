import { ScopeConfigDef } from '../../model/scope';

export const ScopeDefSample: ScopeConfigDef[] = [
  {
    id: 'cluster',
    name: 'Cluster',
    shortName: 'Cl',
    description: 'Cluster name or identifier',
    labels: ['K8S_ClusterName'],
    feature: 'multiCluster'
  },
  {
    id: 'zone',
    name: 'Zone',
    shortName: 'AZ',
    description: 'Availability zone',
    labels: ['SrcK8S_Zone', 'DstK8S_Zone'],
    feature: 'zones',
    groups: ['clusters']
  },
  {
    id: 'host',
    name: 'Node',
    shortName: 'Nd',
    description: 'Node on which the resources are running',
    labels: ['SrcK8S_HostName', 'DstK8S_HostName'],
    groups: ['clusters', 'zones', 'clusters+zones']
  },
  {
    id: 'namespace',
    name: 'Namespace',
    shortName: 'NS',
    description: 'Resource namespace',
    labels: ['SrcK8S_Namespace', 'DstK8S_Namespace'],
    groups: ['clusters', 'clusters+zones', 'clusters+hosts', 'zones', 'zones+hosts', 'hosts']
  },
  {
    id: 'owner',
    name: 'Owner',
    shortName: 'Own',
    description: 'Controller owner, such as a Deployment',
    labels: [
      'SrcK8S_OwnerName',
      'SrcK8S_OwnerType',
      'DstK8S_OwnerName',
      'DstK8S_OwnerType',
      'SrcK8S_Namespace',
      'DstK8S_Namespace'
    ],
    groups: [
      'clusters',
      'clusters+zones',
      'clusters+hosts',
      'clusters+namespaces',
      'zones',
      'zones+hosts',
      'zones+namespaces',
      'hosts',
      'hosts+namespaces',
      'namespaces'
    ]
  },
  {
    id: 'resource',
    name: 'Resource',
    shortName: 'Res',
    description: 'Base resource, such as a Pod, a Service or a Node',
    labels: [
      'SrcK8S_Name',
      'SrcK8S_Type',
      'SrcK8S_OwnerName',
      'SrcK8S_OwnerType',
      'SrcK8S_Namespace',
      'SrcAddr',
      'SrcK8S_HostName',
      'DstK8S_Name',
      'DstK8S_Type',
      'DstK8S_OwnerName',
      'DstK8S_OwnerType',
      'DstK8S_Namespace',
      'DstAddr',
      'DstK8S_HostName'
    ],
    groups: [
      'clusters',
      'clusters+zones',
      'clusters+hosts',
      'clusters+namespaces',
      'clusters+owners',
      'zones',
      'zones+hosts',
      'zones+namespaces',
      'zones+owners',
      'hosts',
      'hosts+namespaces',
      'hosts+owners',
      'namespaces',
      'namespaces+owners',
      'owners'
    ]
  }
];
