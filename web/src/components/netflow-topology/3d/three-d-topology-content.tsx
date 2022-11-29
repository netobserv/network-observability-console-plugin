/* eslint-disable @typescript-eslint/no-unused-vars */
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import React from 'react';
import { TopologyMetrics } from '../../../api/loki';
import { SearchHandle, SearchEvent } from '../../../components/search/search';
import { Filter } from '../../../model/filters';
import { MetricFunction, MetricType, MetricScope } from '../../../model/flow-query';
import { TopologyOptions, GraphElementPeer, NodeData } from '../../../model/topology';
import * as RTTopology from '@jpinsonneau/react-three-topology';
import _ from 'lodash';
import './three-d-topology-content.css';
import { BaseNode } from '@patternfly/react-topology';

export const ThreeDTopologyContent: React.FC<{
  k8sModels: { [key: string]: K8sModel };
  metricFunction: MetricFunction;
  metricType: MetricType;
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
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
      !_.isEmpty(m.source.ownerName) &&
      !srcNamespace.children.find((o: RTTopology.Item) => o.name === m.source.ownerName)
    ) {
      srcNamespace.children.push({
        name: m.source.ownerName!,
        namespace: m.source.namespace,
        type: m.source.ownerType,
        children: [],
        color: k8sModels[m.source.ownerType!]?.color || defaultColor
      });
    }

    const dstNamespace = dstNode?.children.find((ns: RTTopology.Item) => ns.name === m.destination.namespace);
    if (
      dstNamespace &&
      !_.isEmpty(m.destination.ownerName) &&
      !dstNamespace.children.find((o: RTTopology.Item) => o.name === m.destination.ownerName)
    ) {
      dstNamespace.children.push({
        name: m.destination.ownerName!,
        namespace: m.destination.namespace,
        type: m.destination.ownerType,
        children: [],
        color: k8sModels[m.destination.ownerType!]?.color || defaultColor
      });
    }

    const srcOwner = srcNamespace?.children.find((o: RTTopology.Item) => o.name === m.source.ownerName);
    if (srcOwner && !_.isEmpty(m.source.name)) {
      from = {
        name: m.source.name!,
        namespace: m.source.namespace,
        type: m.source.type,
        children: [],
        color: k8sModels[m.source.type!]?.color || defaultColor
      };
      if (!srcOwner.children.find((r: RTTopology.Item) => r.name === from!.name)) {
        srcOwner.children.push(from);
      }
    }

    const dstOwner = dstNamespace?.children.find((o: RTTopology.Item) => o.name === m.destination.ownerName);
    if (dstOwner && !_.isEmpty(m.destination.name)) {
      to = {
        name: m.destination.name!,
        namespace: m.destination.namespace,
        type: m.destination.type,
        children: [],
        color: k8sModels[m.destination.type!]?.color || defaultColor
      };
      if (!dstOwner.children.find((r: RTTopology.Item) => r.name === to!.name)) {
        dstOwner.children.push(to);
      }
    }

    if (_.isEmpty(m.source.type)) {
      from = { name: m.source.addr!, children: [] };
      if (!externals.find(e => e.name === m.source.addr)) {
        externals.push(from);
      }
    } else if (m.source.type === 'Service') {
      from = {
        name: m.source.name!,
        namespace: m.source.namespace,
        type: m.source.type,
        children: [],
        color: k8sModels['Service']?.color || defaultColor
      };
      if (!services.find(s => s.name === from!.name)) {
        services.push(from);
      }
    }

    if (_.isEmpty(m.destination.type)) {
      to = { name: m.destination.addr!, children: [] };
      if (!externals.find(e => e.name === to!.name)) {
        externals.push({ name: m.destination.addr!, children: [] });
      }
    } else if (m.destination.type === 'Service') {
      to = {
        name: m.destination.name!,
        namespace: m.destination.namespace,
        type: m.destination.type,
        children: [],
        color: k8sModels['Service']?.color || defaultColor
      };
      if (!services.find(s => s.name === m.destination.name)) {
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

        let host = i.parent;
        while (host !== undefined && host!.type !== 'Node') {
          host = host!.parent;
        }

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
          resourceKind: i.type,
          namespace: i.namespace,
          name: i.name,
          parentKind: i.parent?.type,
          parentName: i.parent?.name,
          host: host?.name
        } as NodeData);
        onSelect(selectedNode);
      }}
    />
  );
};

export default ThreeDTopologyContent;
