import {
  EdgeAnimationSpeed,
  EdgeModel,
  EdgeStyle,
  EdgeTerminalType,
  LabelPosition,
  Model,
  NodeModel,
  NodeShape,
  NodeStatus
} from '@patternfly/react-topology';
import _ from 'lodash';
import { TopologyMetrics } from '../api/loki';
import { bytesPerSeconds } from '../utils/bytes';
import { kindToAbbr } from '../utils/label';
import { defaultTimeRange } from '../utils/router';

export enum LayoutName {
  Cola = 'Cola',
  ColaNoForce = 'ColaNoForce',
  Concentric = 'Concentric',
  Dagre = 'Dagre',
  Force = 'Force',
  Grid = 'Grid'
}

export enum TopologyGroupTypes {
  NONE = 'none',
  NAMESPACES = 'namespaces',
  OWNERS = 'owners',
  ALL = 'all'
}

export interface TopologyOptions {
  rangeInSeconds: number;
  maxEdgeValue: number;
  nodeBadges?: boolean;
  contextMenus?: boolean;
  edges?: boolean;
  edgeTags?: boolean;
  startCollapsed?: boolean;
  truncateLabels?: boolean;
  groupTypes: TopologyGroupTypes;
  lowScale: number;
  medScale: number;
}

export const DefaultOptions: TopologyOptions = {
  rangeInSeconds: defaultTimeRange,
  nodeBadges: true,
  contextMenus: false,
  edges: true,
  edgeTags: true,
  maxEdgeValue: 0,
  startCollapsed: false,
  truncateLabels: true,
  groupTypes: TopologyGroupTypes.NAMESPACES,
  lowScale: 0.3,
  medScale: 0.5
};

export const DEFAULT_NODE_TRUNCATE_LENGTH = 25;
export const DEFAULT_NODE_SIZE = 75;

export const generateNode = (
  namespace: string,
  type: string,
  name: string,
  addr: string,
  options: TopologyOptions
): NodeModel => {
  const id = `${type}.${namespace}.${name}.${addr}`;
  return {
    id,
    type: 'node',
    label: name ? name : addr,
    width: DEFAULT_NODE_SIZE,
    height: DEFAULT_NODE_SIZE,
    shape: NodeShape.ellipse,
    status: NodeStatus.default,
    style: { padding: 20 },
    data: {
      namespace,
      type,
      name,
      addr,
      labelPosition: LabelPosition.bottom,
      //TODO: get badge and color using console ResourceIcon
      badge: options.nodeBadges && type ? kindToAbbr(type) : undefined,
      //badgeColor: options.nodeBadges && type ? getModel(type)?.color : undefined,
      badgeClassName: options.nodeBadges && type ? `co-m-resource-icon co-m-resource-${type.toLowerCase()}` : undefined,
      showDecorators: true,
      secondaryLabel: [TopologyGroupTypes.OWNERS, TopologyGroupTypes.NONE].includes(options.groupTypes)
        ? namespace
        : undefined,
      showContextMenu: options.contextMenus,
      truncateLength: options.truncateLabels ? DEFAULT_NODE_TRUNCATE_LENGTH : undefined
    }
  };
};

export const getAnimationSpeed = (n: number, total: number) => {
  if (total) {
    const step = total / 5;
    if (n > step * 4) {
      return EdgeAnimationSpeed.fast;
    } else if (n > step * 3) {
      return EdgeAnimationSpeed.mediumFast;
    } else if (n > step * 2) {
      return EdgeAnimationSpeed.medium;
    } else if (n > step) {
      return EdgeAnimationSpeed.mediumSlow;
    } else {
      return EdgeAnimationSpeed.slow;
    }
  } else {
    return EdgeAnimationSpeed.none;
  }
};

export const getTagStatus = (n: number, total: number) => {
  if (total) {
    const step = total / 3;
    if (n > step * 2) {
      return NodeStatus.danger;
    } else if (n > step) {
      return NodeStatus.warning;
    } else {
      return NodeStatus.info;
    }
  } else {
    return NodeStatus.default;
  }
};

export const getEdgeStyle = (count: number) => {
  return count ? EdgeStyle.dashed : EdgeStyle.dotted;
};

export const getEdgeTag = (amount: number, options: TopologyOptions) => {
  return options.edgeTags && amount ? bytesPerSeconds(amount, options.rangeInSeconds) : undefined;
};

export const generateEdge = (
  sourceId: string,
  targetId: string,
  count: number,
  options: TopologyOptions
): EdgeModel => {
  return {
    id: `${sourceId}.${targetId}`,
    type: 'edge',
    source: sourceId,
    target: targetId,
    edgeStyle: getEdgeStyle(count),
    animationSpeed: getAnimationSpeed(count, options.maxEdgeValue),
    data: {
      sourceId,
      targetId,
      endTerminalType: EdgeTerminalType.directional,
      endTerminalStatus: NodeStatus.default,
      tag: getEdgeTag(count, options),
      tagStatus: getTagStatus(count, options.maxEdgeValue),
      count
    }
  };
};

export const generateDataModel = (
  datas: TopologyMetrics[],
  options: TopologyOptions,
  nodes: NodeModel[] = [],
  edges: EdgeModel[] = []
): Model => {
  const opts = { ...DefaultOptions, ...options };
  //ensure each child to have single parent
  const childIds: string[] = [];

  //refresh existing items
  nodes = nodes.map(node =>
    node.type === 'group'
      ? //clear group children
        { ...node, children: [] }
      : {
          ...node,
          //update options and filter indicators
          ...generateNode(node.data.namespace, node.data.type, node.data.name, node.data.addr, opts)
        }
  );
  edges = edges.map(edge => ({
    ...edge,
    //update options and reset counter
    ...generateEdge(edge.source!, edge.target!, 0, opts)
  }));

  function addGroup(name: string, type: string, parent?: NodeModel, secondaryLabelPadding = false) {
    let group = nodes.find(g => g.type === 'group' && g.data.type === type && g.data.name === name);
    if (!group) {
      group = {
        id: `${type}.${name}`,
        children: [],
        type: 'group',
        group: true,
        collapsed: options.startCollapsed,
        label: name,
        style: { padding: secondaryLabelPadding ? 35 : 10 },
        data: {
          name,
          type,
          labelPosition: LabelPosition.bottom,
          collapsible: true,
          collapsedWidth: 75,
          collapsedHeight: 75,
          truncateLength: options.truncateLabels
            ? //match node label length according to badge
              options.nodeBadges
              ? DEFAULT_NODE_TRUNCATE_LENGTH + 2
              : DEFAULT_NODE_TRUNCATE_LENGTH - 3
            : undefined
        }
      };
      nodes.push(group);
    }

    if (parent && !childIds.includes(group.id)) {
      parent.children!.push(group.id);
      childIds.push(group.id);
    }

    return group;
  }

  function addNode(namespace: string, type: string, name: string, addr: string, parent?: NodeModel) {
    let node = nodes.find(
      n => n.data.type === type && n.data.namespace === namespace && n.data.name === name && n.data.addr === addr
    );
    if (!node) {
      node = generateNode(namespace, type, name, addr, opts);
      nodes.push(node);
    }
    if (parent && !childIds.includes(node.id)) {
      parent.children!.push(node.id);
      childIds.push(node.id);
    }

    return node;
  }

  function addEdge(sourceId: string, targetId: string, count: number) {
    let edge = edges.find(e => e.data.sourceId === sourceId && e.data.targetId === targetId);
    if (edge) {
      //update style and datas
      edge.edgeStyle = getEdgeStyle(count);
      edge.animationSpeed = getAnimationSpeed(count, options.maxEdgeValue);
      edge.data = { ...edge.data, tag: getEdgeTag(count, options), count };
    } else {
      edge = generateEdge(sourceId, targetId, count, opts);
      edges.push(edge);
    }

    return edge;
  }

  function manageNode(prefix: 'Src' | 'Dst', d: TopologyMetrics) {
    const m = d.metric as never;
    const namespace = m[`${prefix}K8S_Namespace`];
    const ownerType = m[`${prefix}K8S_OwnerType`];
    const ownerName = m[`${prefix}K8S_OwnerName`];
    const type = m[`${prefix}K8S_Type`];
    const name = m[`${prefix}K8S_Name`];
    const addr = m[`${prefix}Addr`];

    const srcNamespaceGroup =
      [TopologyGroupTypes.ALL, TopologyGroupTypes.NAMESPACES].includes(options.groupTypes) && !_.isEmpty(namespace)
        ? addGroup(namespace, 'Namespace')
        : undefined;
    const srcOwnerGroup =
      [TopologyGroupTypes.ALL, TopologyGroupTypes.OWNERS].includes(options.groupTypes) &&
      !_.isEmpty(ownerType) &&
      !_.isEmpty(ownerName)
        ? addGroup(ownerName, ownerType, srcNamespaceGroup, srcNamespaceGroup === undefined)
        : undefined;
    const srcNode = addNode(namespace, type, name, addr, srcOwnerGroup ? srcOwnerGroup : srcNamespaceGroup);

    return srcNode;
  }

  datas.forEach(d => {
    const srcNode = manageNode('Src', d);
    const dstNode = manageNode('Dst', d);

    if (options.edges && srcNode && dstNode) {
      addEdge(srcNode.id, dstNode.id, d.total);
    }
  });

  //remove empty groups
  nodes = nodes.filter(n => n.type !== 'group' || (n.children && n.children.length));
  return { nodes, edges };
};
