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
import { TFunction } from 'i18next';
import _ from 'lodash';
import { bytesPerSeconds } from '../utils/bytes';
import { kindToAbbr } from '../utils/label';
import { DEFAULT_TIME_RANGE } from '../utils/router';
import { TopologyMetrics } from '../api/loki';

export enum LayoutName {
  Cola = 'Cola',
  ColaNoForce = 'ColaNoForce',
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
  groupTypes: TopologyGroupTypes;
}

export const DefaultOptions: TopologyOptions = {
  rangeInSeconds: DEFAULT_TIME_RANGE,
  nodeBadges: true,
  contextMenus: false,
  edges: true,
  edgeTags: true,
  maxEdgeValue: 0,
  startCollapsed: false,
  groupTypes: TopologyGroupTypes.NAMESPACES
};

export const DEFAULT_NODE_SIZE = 75;

export const generateNode = (namespace: string, type: string, name: string, options: TopologyOptions): NodeModel => {
  return {
    id: `${namespace}.${name}`,
    type: 'node',
    label: name,
    width: DEFAULT_NODE_SIZE,
    height: DEFAULT_NODE_SIZE,
    shape: NodeShape.ellipse,
    status: NodeStatus.default,
    data: {
      dataType: 'Default',
      namespace,
      type,
      name,
      labelPosition: LabelPosition.bottom,
      //TODO: get badge and color using console ResourceIcon
      badge: options.nodeBadges && type ? kindToAbbr(type) : undefined,
      /*badgeColor: options.nodeBadges && type ? getModel(type)?.color : undefined,
      badgeClassName: options.nodeBadges && type ? 
      `co-m-resource-icon co-m-resource-${type.toLowerCase()}` : undefined,*/
      showDecorators: true,
      secondaryLabel: [TopologyGroupTypes.OWNERS, TopologyGroupTypes.NONE].includes(options.groupTypes)
        ? namespace
        : undefined,
      showContextMenu: options.contextMenus
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

export const getEdgeStyle = (bytes: number) => {
  return bytes ? EdgeStyle.dashed : EdgeStyle.dotted;
};

export const getEdgeTag = (bytes: number, options: TopologyOptions) => {
  return options.edgeTags && bytes ? bytesPerSeconds(bytes, options.rangeInSeconds) : undefined;
};

export const generateEdge = (
  sourceId: string,
  targetId: string,
  bytes: number,
  options: TopologyOptions
): EdgeModel => {
  return {
    id: `${sourceId}-${targetId}`,
    type: 'edge',
    source: sourceId,
    target: targetId,
    edgeStyle: getEdgeStyle(bytes),
    animationSpeed: getAnimationSpeed(bytes, options.maxEdgeValue),
    data: {
      sourceId,
      targetId,
      endTerminalType: EdgeTerminalType.directional,
      endTerminalStatus: NodeStatus.default,
      tag: getEdgeTag(bytes, options),
      tagStatus: getTagStatus(bytes, options.maxEdgeValue),
      bytes
    }
  };
};

export const generateDataModel = (
  datas: TopologyMetrics[],
  options: TopologyOptions,
  t: TFunction,
  nodes: NodeModel[] = [],
  edges: EdgeModel[] = []
): Model => {
  const emptyText = t('n/a');
  const opts = { ...DefaultOptions, ...options };

  //refresh existing items
  nodes = nodes.map(node => {
    if (node.group) {
      //nothing to update on groups
      return node;
    }
    return {
      ...node,
      ...generateNode(node.data.namespace, node.data.type, node.data.name, opts) //update options
    };
  });
  edges = edges.map(edge => ({
    ...edge,
    ...generateEdge(edge.source!, edge.target!, 0, opts) //update options and reset bytes
  }));

  function addGroup(name: string, parent?: NodeModel) {
    let group = nodes.find(g => g.type === 'group' && g.data.name === name);
    if (!group) {
      group = {
        id: name,
        children: [],
        type: 'group',
        group: true,
        collapsed: options.startCollapsed,
        label: name,
        data: {
          name,
          labelPosition: LabelPosition.bottom,
          collapsible: true
        }
      };
      nodes.push(group);
    }

    if (parent) {
      parent.children!.push(group.id);
    }

    return group;
  }

  function addNode(namespace: string, type: string, name: string, parent?: NodeModel) {
    let node = nodes.find(n => n.data.namespace === namespace && n.data.name === name);
    if (!node) {
      node = generateNode(namespace, type, name, opts);
      nodes.push(node);
    }
    if (parent && !parent.children?.find(n => n === node!.id)) {
      parent.children!.push(node.id);
    }

    return node;
  }

  function addEdge(sourceId: string, targetId: string, bytes: number, options: TopologyOptions) {
    let edge = edges.find(e => e.data.sourceId === sourceId && e.data.targetId === targetId);
    if (edge) {
      //update style and datas
      edge.edgeStyle = getEdgeStyle(bytes);
      edge.animationSpeed = getAnimationSpeed(bytes, options.maxEdgeValue);
      edge.data = { ...edge.data, tag: getEdgeTag(bytes, options), bytes };
    } else {
      edge = generateEdge(sourceId, targetId, bytes, options);
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
        ? addGroup(namespace)
        : undefined;
    const srcOwnerGroup =
      [TopologyGroupTypes.ALL, TopologyGroupTypes.OWNERS].includes(options.groupTypes) &&
      !_.isEmpty(ownerType) &&
      !_.isEmpty(ownerName)
        ? addGroup(`${ownerType}.${ownerName}`, srcNamespaceGroup)
        : undefined;
    const srcNode = addNode(
      namespace,
      type,
      _.isEmpty(name) ? (_.isEmpty(addr) ? emptyText : addr) : name,
      srcOwnerGroup ? srcOwnerGroup : srcNamespaceGroup
    );

    return srcNode;
  }

  datas.forEach(d => {
    const srcNode = manageNode('Src', d);
    const dstNode = manageNode('Dst', d);

    if (options.edges && srcNode && dstNode) {
      addEdge(srcNode.id, dstNode.id, d.total, opts);
    }
  });

  return { nodes, edges };
};
