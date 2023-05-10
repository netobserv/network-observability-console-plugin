import {
  EdgeAnimationSpeed,
  EdgeModel,
  EdgeStyle,
  EdgeTerminalType,
  ElementModel,
  GraphElement,
  LabelPosition,
  Model,
  NodeModel,
  NodeShape,
  NodeStatus,
  Point
} from '@patternfly/react-topology';
import _ from 'lodash';
import { MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { Filter, FilterDefinition, findFromFilters } from '../model/filters';
import { defaultMetricFunction, defaultMetricType } from '../utils/router';
import { findFilter } from '../utils/filter-definitions';
import { TFunction } from 'i18next';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { getTopologyEdgeId } from '../utils/ids';
import { MetricScopeOptions } from './metrics';
import { MetricFunction, MetricScope, MetricType, NodeType } from './flow-query';
import { createPeer, getFormattedValue } from '../utils/metrics';
import { TruncateLength } from '../components/dropdowns/truncate-dropdown';

export enum LayoutName {
  ThreeD = '3d',
  BreadthFirst = 'BreadthFirst',
  Cola = 'Cola',
  ColaNoForce = 'ColaNoForce',
  Concentric = 'Concentric',
  Dagre = 'Dagre',
  Force = 'Force',
  Grid = 'Grid',
  ColaGroups = 'ColaGroups'
}

export enum TopologyGroupTypes {
  NONE = 'none',
  HOSTS = 'hosts',
  HOSTS_NAMESPACES = 'hosts+namespaces',
  HOSTS_OWNERS = 'hosts+owners',
  NAMESPACES = 'namespaces',
  NAMESPACES_OWNERS = 'namespaces+owners',
  OWNERS = 'owners'
}

export const getAvailableGroups = (scope: MetricScopeOptions) => {
  switch (scope) {
    case MetricScopeOptions.HOST:
      return [TopologyGroupTypes.NONE];
    case MetricScopeOptions.NAMESPACE:
      return [TopologyGroupTypes.NONE, TopologyGroupTypes.HOSTS];
    case MetricScopeOptions.OWNER:
      return [
        TopologyGroupTypes.NONE,
        TopologyGroupTypes.HOSTS,
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.NAMESPACES
      ];
    case MetricScopeOptions.RESOURCE:
    default:
      return Object.values(TopologyGroupTypes);
  }
};

export interface TopologyOptions {
  maxEdgeStat: number;
  nodeBadges?: boolean;
  edges?: boolean;
  edgeTags?: boolean;
  startCollapsed?: boolean;
  truncateLength: TruncateLength;
  layout: LayoutName;
  groupTypes: TopologyGroupTypes;
  lowScale: number;
  medScale: number;
  metricFunction: MetricFunction;
  metricType: MetricType;
}

export const DefaultOptions: TopologyOptions = {
  nodeBadges: true,
  edges: true,
  edgeTags: true,
  maxEdgeStat: 0,
  startCollapsed: false,
  truncateLength: TruncateLength.M,
  layout: LayoutName.ColaNoForce,
  groupTypes: TopologyGroupTypes.NONE,
  lowScale: 0.3,
  medScale: 0.5,
  metricFunction: defaultMetricFunction,
  metricType: defaultMetricType
};

export type GraphElementPeer = GraphElement<ElementModel, NodeData>;
export type ElementData = Partial<NodeData>;
export type Decorated<T> = T & {
  id: string;
  isHovered?: boolean;
  hover?: boolean;
  dragging?: boolean;
  highlighted?: boolean;
  isFiltered?: boolean;
  isClearFilters?: boolean;
  isPinned?: boolean;
  showDecorators?: boolean;
  showStatusDecorator?: boolean;
  point?: Point;
  setPosition?: (location: Point) => void;
  canStepInto?: boolean;
};
export const decorated = <T>(t: T): Decorated<T> => t as Decorated<T>;

export type FilterDir = 'src' | 'dst' | 'any';
const getFilterDefValue = (nodeType: NodeType, fields: Partial<TopologyMetricPeer>, dir: FilterDir, t: TFunction) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (fields.resource && fields.namespace) {
    def = findFilter(t, dir === 'src' ? 'src_resource' : dir === 'dst' ? 'dst_resource' : 'resource')!;
    value = `${fields.resource.type}.${fields.namespace}.${fields.resource.name}`;
  } else if (nodeType === 'host' && (fields.hostName || fields.resource)) {
    def = findFilter(t, dir === 'src' ? 'src_host_name' : dir === 'dst' ? 'dst_host_name' : 'host_name')!;
    value = `"${fields.hostName || fields.resource?.name}"`;
  } else if (nodeType === 'namespace' && (fields.namespace || fields.resource)) {
    def = findFilter(t, dir === 'src' ? 'src_namespace' : dir === 'dst' ? 'dst_namespace' : 'namespace')!;
    value = `"${fields.namespace || fields.resource?.name}"`;
  } else if (nodeType === 'resource' && fields.resource) {
    def = findFilter(t, dir === 'src' ? 'src_name' : dir === 'dst' ? 'dst_name' : 'name')!;
    value = `"${fields.resource.name}"`;
  } else if (nodeType === 'owner' && fields.owner) {
    def = findFilter(t, dir === 'src' ? 'src_owner_name' : dir === 'dst' ? 'dst_owner_name' : 'owner_name')!;
    value = `"${fields.owner.name}"`;
  } else if (fields.addr) {
    def = findFilter(t, dir === 'src' ? 'src_address' : dir === 'dst' ? 'dst_address' : 'address')!;
    value = fields.addr!;
  }
  return def && value ? { def, value } : undefined;
};

export const isElementFiltered = (
  nodeType: NodeType,
  fields: Partial<TopologyMetricPeer>,
  dir: FilterDir,
  filters: Filter[],
  t: TFunction
) => {
  const defValue = getFilterDefValue(nodeType, fields, dir, t);
  if (!defValue) {
    return false;
  }
  const filter = findFromFilters(filters, { def: defValue.def });
  return filter !== undefined && filter.values.find(v => v.v === defValue.value) !== undefined;
};

export const toggleElementFilter = (
  nodeType: NodeType,
  fields: Partial<TopologyMetricPeer>,
  dir: FilterDir,
  isFiltered: boolean,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  t: TFunction
) => {
  const result = _.cloneDeep(filters);
  const defValue = getFilterDefValue(nodeType, fields, dir, t);
  if (!defValue) {
    console.error("can't find defValue for fields", fields);
    return;
  }
  let filter = findFromFilters(result, { def: defValue.def });
  if (!filter) {
    filter = { def: defValue.def, values: [] };
    result.push(filter);
  }

  if (!isFiltered) {
    //replace filter for kubeobject
    if (defValue.def.id === 'resource') {
      filter!.values = [{ v: defValue.value! }];
    } else {
      filter!.values.push({ v: defValue.value });
    }
  } else {
    filter!.values = filter!.values.filter(v => v.v !== defValue.value);
  }
  setFilters(result.filter(f => !_.isEmpty(f.values)));
};

export const DEFAULT_NODE_TRUNCATE_LENGTH = 25;
export const DEFAULT_NODE_SIZE = 75;

export type NodeData = {
  nodeType: NodeType;
  peer: TopologyMetricPeer;
  canStepInto?: boolean;
  badgeColor?: string;
};

const generateNode = (
  data: NodeData,
  scope: MetricScope,
  options: TopologyOptions,
  searchValue: string,
  highlightedId: string,
  filters: Filter[],
  t: TFunction,
  k8sModels: { [key: string]: K8sModel },
  isDark?: boolean
): NodeModel => {
  const label = data.peer.getDisplayName(false, false) || (scope === 'host' ? t('External') : t('Unknown'))!;
  const resourceKind = data.peer.resourceKind;
  const secondaryLabel =
    data.nodeType !== 'namespace' &&
    ![
      TopologyGroupTypes.NAMESPACES,
      TopologyGroupTypes.NAMESPACES_OWNERS,
      TopologyGroupTypes.HOSTS_NAMESPACES
    ].includes(options.groupTypes)
      ? data.peer.namespace
      : undefined;
  const shadowed = !_.isEmpty(searchValue) && !(label.includes(searchValue) || secondaryLabel?.includes(searchValue));
  const filtered = !_.isEmpty(searchValue) && !shadowed;
  const highlighted = !shadowed && !_.isEmpty(highlightedId) && highlightedId.includes(data.peer.id);
  const k8sModel = options.nodeBadges && resourceKind ? k8sModels[resourceKind] : undefined;
  return {
    id: data.peer.id,
    type: 'node',
    label,
    width: DEFAULT_NODE_SIZE,
    height: DEFAULT_NODE_SIZE,
    shape: k8sModel ? NodeShape.ellipse : NodeShape.rect,
    status: NodeStatus.default,
    style: { padding: 20 },
    data: {
      ...data,
      shadowed,
      filtered,
      highlighted,
      isDark,
      isFiltered: isElementFiltered(data.nodeType, data.peer, 'any', filters, t),
      labelPosition: LabelPosition.bottom,
      badge: k8sModel?.abbr,
      badgeColor: k8sModel?.color ? k8sModel.color : '#2b9af3',
      badgeClassName: 'topology-icon',
      showDecorators: true,
      secondaryLabel,
      truncateLength: options.truncateLength !== TruncateLength.OFF ? options.truncateLength : undefined
    }
  };
};

const getAnimationSpeed = (n: number, total: number) => {
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

const getTagStatus = (n: number, total: number) => {
  if (total) {
    const step = total / 5;
    if (n > step * 3) {
      return NodeStatus.warning;
    } else if (n > step * 2) {
      return NodeStatus.info;
    } else {
      return NodeStatus.default;
    }
  } else {
    return NodeStatus.default;
  }
};

const getEdgeStyle = (count: number) => {
  return count ? EdgeStyle.dashed : EdgeStyle.dotted;
};

export const getStat = (stats: MetricStats, mf: MetricFunction): number => {
  return mf === 'avg' ? stats.avg : mf === 'max' ? stats.max : mf === 'last' ? stats.latest : stats.total;
};

const getEdgeTag = (value: number, options: TopologyOptions, t: TFunction) => {
  if (options.edgeTags && value) {
    return getFormattedValue(value, options.metricType, options.metricFunction, t);
  }
  return undefined;
};

const generateEdge = (
  sourceId: string,
  targetId: string,
  stat: number,
  droppedStat: number,
  options: TopologyOptions,
  shadowed = false,
  filtered = false,
  highlightedId: string,
  t: TFunction,
  isDark?: boolean
): EdgeModel => {
  const id = `${sourceId}.${targetId}`;

  const highlighted = !shadowed && !_.isEmpty(highlightedId) && id.includes(highlightedId);
  return {
    id: getTopologyEdgeId(sourceId, targetId),
    type: 'edge',
    source: sourceId,
    target: targetId,
    edgeStyle: getEdgeStyle(stat),
    animationSpeed: getAnimationSpeed(stat, options.maxEdgeStat),
    data: {
      sourceId,
      targetId,
      shadowed,
      filtered,
      highlighted,
      isDark,
      //edges are directed from src to dst. It will become bidirectionnal if inverted pair is found
      startTerminalType: EdgeTerminalType.none,
      startTerminalStatus: NodeStatus.default,
      endTerminalType: stat > 0 ? EdgeTerminalType.directional : EdgeTerminalType.none,
      endTerminalStatus: NodeStatus.default,
      tag: getEdgeTag(stat, options, t),
      tagStatus: getTagStatus(stat, options.maxEdgeStat),
      bps: stat,
      drops: droppedStat
    }
  };
};

export const generateDataModel = (
  metrics: TopologyMetrics[],
  droppedMetrics: TopologyMetrics[],
  options: TopologyOptions,
  metricScope: MetricScope,
  searchValue: string,
  highlightedId: string,
  filters: Filter[],
  t: TFunction,
  k8sModels: { [key: string]: K8sModel },
  isDark?: boolean
): Model => {
  let nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const opts = { ...DefaultOptions, ...options };

  const addGroup = (
    fields: Partial<TopologyMetricPeer>,
    scope: MetricScope,
    parent?: NodeModel,
    secondaryLabelPadding = false
  ): NodeModel => {
    const groupDef = createPeer(fields);
    const groupName = groupDef.getDisplayName(false, false);
    let group = nodes.find(g => g.type === 'group' && g.id === groupDef.id);
    if (!group) {
      const data: NodeData = {
        nodeType: scope,
        peer: groupDef
      };
      group = {
        id: groupDef.id,
        children: [],
        type: 'group',
        group: true,
        collapsed: options.startCollapsed,
        label: groupName,
        style: { padding: secondaryLabelPadding ? 35 : 10 },
        data: {
          ...data,
          name: groupName,
          isDark,
          labelPosition: LabelPosition.bottom,
          collapsible: true,
          collapsedWidth: 75,
          collapsedHeight: 75,
          truncateLength:
            options.truncateLength !== TruncateLength.OFF
              ? //match node label length according to badge
                options.nodeBadges
                ? options.truncateLength + 2
                : options.truncateLength - 3
              : undefined
        }
      };
      nodes.push(group);
    }

    if (parent) {
      if (parent.id == group.id) {
        console.error('addGroup parent === group', parent, group);
      } else if (!parent.children!.includes(group.id)) {
        parent.children!.push(group.id);
      }
    }

    return group;
  };

  const addNode = (data: NodeData, scope: MetricScope): NodeModel => {
    const parent = data.nodeType !== 'unknown' ? addPossibleGroups(data.peer) : undefined;
    let node = nodes.find(n => n.type === 'node' && n.id === data.peer.id);
    if (!node) {
      node = generateNode(data, scope, opts, searchValue, highlightedId, filters, t, k8sModels, isDark);
      nodes.push(node);
    }

    if (parent) {
      if (parent.id == node.id) {
        console.error('addNode parent === node', parent, node);
      } else if (!parent.children!.includes(node.id)) {
        parent.children!.push(node.id);
      }
    }

    return node;
  };

  const addEdge = (
    sourceId: string,
    targetId: string,
    stats: MetricStats,
    droppedStats: MetricStats | undefined,
    shadowed = false,
    filtered = false,
    t: TFunction
  ): EdgeModel => {
    const stat = getStat(stats, options.metricFunction);
    const droppedStat = droppedStats ? getStat(droppedStats, options.metricFunction) : 0;
    let edge = edges.find(
      e =>
        (e.data.sourceId === sourceId && e.data.targetId === targetId) ||
        (e.data.sourceId === targetId && e.data.targetId === sourceId)
    );
    if (edge) {
      //update style and datas
      edge.edgeStyle = getEdgeStyle(stat);
      edge.animationSpeed = getAnimationSpeed(stat, options.maxEdgeStat);
      edge.data = {
        ...edge.data,
        shadowed,
        filtered,
        isDark,
        //edges are directed from src to dst. It will become bidirectionnal if inverted pair is found
        startTerminalType: edge.data.sourceId !== sourceId ? EdgeTerminalType.directional : edge.data.startTerminalType,
        tag: getEdgeTag(stat, options, t),
        tagStatus: getTagStatus(stat, options.maxEdgeStat),
        bps: stat,
        drops: droppedStat
      };
    } else {
      edge = generateEdge(sourceId, targetId, stat, droppedStat, opts, shadowed, filtered, highlightedId, t, isDark);
      edges.push(edge);
    }

    return edge;
  };

  // addPossibleGroups adds peer to one or more groups when relevant, and returns the smallest one
  const addPossibleGroups = (peer: TopologyMetricPeer): NodeModel | undefined => {
    const hostGroup =
      [TopologyGroupTypes.HOSTS_NAMESPACES, TopologyGroupTypes.HOSTS_OWNERS, TopologyGroupTypes.HOSTS].includes(
        options.groupTypes
      ) && !_.isEmpty(peer.hostName)
        ? addGroup({ hostName: peer.hostName }, 'host', undefined, true)
        : undefined;
    const namespaceGroup =
      [
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.NAMESPACES_OWNERS,
        TopologyGroupTypes.NAMESPACES
      ].includes(options.groupTypes) && !_.isEmpty(peer.namespace)
        ? addGroup({ namespace: peer.namespace }, 'namespace', hostGroup)
        : undefined;
    const ownerGroup =
      [TopologyGroupTypes.NAMESPACES_OWNERS, TopologyGroupTypes.HOSTS_OWNERS, TopologyGroupTypes.OWNERS].includes(
        options.groupTypes
      ) && peer.owner
        ? addGroup(
            { namespace: peer.namespace, owner: peer.owner },
            'owner',
            namespaceGroup || hostGroup,
            namespaceGroup === undefined
          )
        : undefined;

    return ownerGroup || namespaceGroup || hostGroup;
  };

  const peerToNodeData = (p: TopologyMetricPeer): NodeData => {
    switch (metricScope) {
      case 'host':
        return _.isEmpty(p.hostName)
          ? { peer: p, nodeType: 'unknown' }
          : { peer: p, nodeType: 'host', canStepInto: true };
      case 'namespace':
        return _.isEmpty(p.namespace)
          ? { peer: p, nodeType: 'unknown' }
          : { peer: p, nodeType: 'namespace', canStepInto: true };
      case 'owner':
        return p.owner ? { peer: p, nodeType: 'owner', canStepInto: true } : { peer: p, nodeType: 'unknown' };
      case 'resource':
      default:
        return { peer: p, nodeType: 'resource' };
    }
  };

  metrics.forEach(m => {
    const srcNode = addNode(peerToNodeData(m.source), metricScope);
    const dstNode = addNode(peerToNodeData(m.destination), metricScope);

    if (options.edges && srcNode && dstNode && srcNode.id !== dstNode.id) {
      const drops = droppedMetrics.find(dm => dm.source.id === m.source.id && dm.destination.id === m.destination.id);
      addEdge(
        srcNode.id,
        dstNode.id,
        m.stats,
        drops?.stats,
        srcNode.data.shadowed || dstNode.data.shadowed,
        srcNode.data.filtered || dstNode.data.filtered,
        t
      );
    }
  });

  //remove empty groups
  nodes = nodes.filter(n => n.type !== 'group' || (n.children && n.children.length));
  return { nodes, edges };
};
