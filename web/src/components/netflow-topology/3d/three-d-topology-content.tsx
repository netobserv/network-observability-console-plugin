/* eslint-disable @typescript-eslint/no-unused-vars */
import * as RTTopology from '@jpinsonneau/react-three-topology';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { BaseNode } from '@patternfly/react-topology';
import _ from 'lodash';
import React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { SearchEvent, SearchHandle } from '../../../components/search/search';
import { Filter } from '../../../model/filters';
import { FlowScope, MetricType, StatFunction } from '../../../model/flow-query';
import { GraphElementPeer, NodeData, TopologyOptions } from '../../../model/topology';
import { createPeer } from '../../../utils/metrics';
import './three-d-topology-content.css';

export const ThreeDTopologyContent: React.FC<{
  k8sModels: { [key: string]: K8sModel };
  metricFunction: StatFunction;
  metricType: MetricType;
  metricScope: FlowScope;
  setMetricScope: (ms: FlowScope) => void;
  metrics: TopologyMetrics[];
  options: TopologyOptions;
  setOptions: (o: TopologyOptions) => void;
  filters: Filter[];
  setFilters: (v: Filter[]) => void;
  selected: GraphElementPeer | undefined;
  onSelect: (e: GraphElementPeer | undefined) => void;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  isDark?: boolean;
}> = ({
  k8sModels,
  metricFunction,
  metricType,
  metricScope,
  setMetricScope,
  metrics,
  options,
  setOptions,
  filters,
  setFilters,
  selected,
  onSelect,
  searchHandle,
  searchEvent,
  isDark
}) => {
  //const { t } = useTranslation('plugin__network-observability-plugin');
  const defaultColor = '#2b9af3';

  let allNamespaces: string[] = [];
  const externals: RTTopology.Item[] = [];
  const services: RTTopology.Item[] = [];
  const nodes: RTTopology.Item[] = [];
  const edges: RTTopology.Edge[] = [];
  metrics.forEach(m => {
    let from: RTTopology.Item | undefined;
    let to: RTTopology.Item | undefined;

    if (!_.isEmpty(m.source.namespace) && !allNamespaces.includes(m.source.namespace!)) {
      allNamespaces.push(m.source.namespace!);
    }

    if (!_.isEmpty(m.destination.namespace) && !allNamespaces.includes(m.destination.namespace!)) {
      allNamespaces.push(m.destination.namespace!);
    }

    if (!_.isEmpty(m.source.hostName)) {
      from = {
        name: m.source.hostName!,
        type: 'Node',
        children: [],
        color: k8sModels['Node']?.color || defaultColor
      };
      if (!nodes.find(n => n.name === from!.name)) {
        nodes.push(from);
      }
    }

    if (!_.isEmpty(m.destination.hostName)) {
      to = {
        name: m.destination.hostName!,
        type: 'Node',
        children: [],
        color: k8sModels['Node']?.color || defaultColor
      };
      if (!nodes.find(n => n.name === to!.name)) {
        nodes.push(to);
      }
    }

    const srcNode = nodes.find(n => n.name === m.source.hostName);
    if (srcNode && !_.isEmpty(m.source.namespace)) {
      from = {
        name: m.source.namespace!,
        type: 'Namespace',
        children: [],
        color: k8sModels['Namespace']?.color || defaultColor
      };
      if (!srcNode.children.find((ns: RTTopology.Item) => ns.name === from!.name)) {
        srcNode.children.push(from);
      }
    }

    const dstNode = nodes.find((n: RTTopology.Item) => n.name === m.destination.hostName);
    if (dstNode && !_.isEmpty(m.destination.namespace)) {
      to = {
        name: m.destination.namespace!,
        type: 'Namespace',
        children: [],
        color: k8sModels['Namespace']?.color || defaultColor
      };
      if (!dstNode.children.find((ns: RTTopology.Item) => ns.name === to!.name)) {
        dstNode.children.push(to);
      }
    }

    const srcNamespace = srcNode?.children.find((ns: RTTopology.Item) => ns.name === m.source.namespace);
    if (
      srcNamespace &&
      !_.isEmpty(m.source.owner?.name) &&
      !srcNamespace.children.find((o: RTTopology.Item) => o.name === m.source.owner?.name)
    ) {
      srcNamespace.children.push({
        name: m.source.owner!.name!,
        namespace: m.source.namespace,
        type: m.source.owner!.type,
        children: [],
        color: k8sModels[m.source.owner!.type!]?.color || defaultColor
      });
    }

    const dstNamespace = dstNode?.children.find((ns: RTTopology.Item) => ns.name === m.destination.namespace);
    if (
      dstNamespace &&
      !_.isEmpty(m.destination.owner?.name) &&
      !dstNamespace.children.find((o: RTTopology.Item) => o.name === m.destination.owner?.name)
    ) {
      dstNamespace.children.push({
        name: m.destination.owner!.name!,
        namespace: m.destination.namespace,
        type: m.destination.owner!.type,
        children: [],
        color: k8sModels[m.destination.owner!.type!]?.color || defaultColor
      });
    }

    const srcOwner = srcNamespace?.children.find((o: RTTopology.Item) => o.name === m.source.owner?.name);
    if (srcOwner && !_.isEmpty(m.source.resource?.name)) {
      from = {
        name: m.source.resource!.name!,
        namespace: m.source.namespace,
        type: m.source.resource!.type,
        children: [],
        color: k8sModels[m.source.resource!.type!]?.color || defaultColor
      };
      if (!srcOwner.children.find((r: RTTopology.Item) => r.name === from!.name)) {
        srcOwner.children.push(from);
      }
    }

    const dstOwner = dstNamespace?.children.find((o: RTTopology.Item) => o.name === m.destination.owner?.name);
    if (dstOwner && !_.isEmpty(m.destination.resource?.name)) {
      to = {
        name: m.destination.resource!.name!,
        namespace: m.destination.namespace,
        type: m.destination.resource!.type,
        children: [],
        color: k8sModels[m.destination.resource!.type!]?.color || defaultColor
      };
      if (!dstOwner.children.find((r: RTTopology.Item) => r.name === to!.name)) {
        dstOwner.children.push(to);
      }
    }

    if (_.isEmpty(m.source.resource?.type)) {
      from = { name: m.source.addr!, children: [] };
      if (!externals.find(e => e.name === m.source.addr)) {
        externals.push(from);
      }
    } else if (m.source.resource?.type === 'Service') {
      from = {
        name: m.source.resource!.name!,
        namespace: m.source.namespace,
        type: m.source.resource!.type,
        children: [],
        color: k8sModels['Service']?.color || defaultColor
      };
      if (!services.find(s => s.name === from!.name)) {
        services.push(from);
      }
    }

    if (_.isEmpty(m.destination.resource?.type)) {
      to = { name: m.destination.addr!, children: [] };
      if (!externals.find(e => e.name === to!.name)) {
        externals.push({ name: m.destination.addr!, children: [] });
      }
    } else if (m.destination.resource?.type === 'Service') {
      to = {
        name: m.destination.resource!.name!,
        namespace: m.destination.namespace,
        type: m.destination.resource!.type,
        children: [],
        color: k8sModels['Service']?.color || defaultColor
      };
      if (!services.find(s => s.name === to!.name)) {
        services.push(to);
      }
    }

    if (from && to) {
      const existing = edges.find(
        e =>
          (e.from.name === from!.name && e.to.name === to!.name) ||
          (e.from.name === to!.name && e.to.name === from!.name)
      );
      if (existing) {
        existing.size += m.stats.total;
      } else {
        edges.push({ from, to, size: m.stats.total });
      }
    }
  });

  allNamespaces = allNamespaces.sort((a, b) => a.localeCompare(b));

  const opts: RTTopology.Options = {
    edges: options.edges,
    resourceHTML: options.nodeBadges
  };

  return (
    <RTTopology.TopologyCanvas
      allNamespaces={allNamespaces}
      externals={externals}
      services={services}
      nodes={nodes}
      edges={edges}
      options={opts}
      isDark={isDark}
      onClick={(i: RTTopology.Item) => {
        const selectedNode = new BaseNode();

        let host: RTTopology.Item | undefined = i.parent;
        while (host !== undefined && host!.type !== 'Node') {
          host = host!.parent;
        }

        let owner: RTTopology.Item | undefined = i;
        do {
          owner = owner.parent;
        } while (owner !== undefined && owner.parent?.type !== 'Namespace');

        let nodeType = undefined;
        switch (i.type) {
          case 'Node':
            nodeType = 'host';
            break;
          case 'Pod':
          case 'Service':
            nodeType = 'resource';
            break;
          case 'Namespace':
            nodeType = 'namespace';
            break;
          default:
            nodeType = 'Owner';
            break;
        }

        selectedNode.setData({
          nodeType,
          peer: createPeer({
            addr: '',
            resource: {
              name: i.name,
              type: i.type!
            },
            namespace: i.namespace,
            owner: owner
              ? {
                  name: owner.name,
                  type: owner.type!
                }
              : undefined,
            hostName: host?.name
          })
        } as NodeData);
        onSelect(selectedNode);
      }}
    />
  );
};

export default ThreeDTopologyContent;
