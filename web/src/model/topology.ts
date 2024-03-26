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
import { Filter, FilterDefinition, Filters, findFromFilters } from '../model/filters';
import { defaultMetricFunction, defaultMetricType } from '../utils/router';
import { findFilter } from '../utils/filter-definitions';
import { TFunction } from 'i18next';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { getTopologyEdgeId } from '../utils/ids';
import { getStat, MetricScopeOptions } from './metrics';
import { StatFunction, FlowScope, MetricType, NodeType, MetricFunction } from './flow-query';
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
  CLUSTERS = 'clusters',
  CLUSTERS_ZONES = 'clusters+zones',
  CLUSTERS_HOSTS = 'clusters+hosts',
  CLUSTERS_NAMESPACES = 'clusters+namespaces',
  CLUSTERS_OWNERS = 'clusters+owners',
  ZONES = 'zones',
  ZONES_HOSTS = 'zones+hosts',
  ZONES_NAMESPACES = 'zones+namespaces',
  ZONES_OWNERS = 'zones+owners',
  HOSTS = 'hosts',
  HOSTS_NAMESPACES = 'hosts+namespaces',
  HOSTS_OWNERS = 'hosts+owners',
  NAMESPACES = 'namespaces',
  NAMESPACES_OWNERS = 'namespaces+owners',
  OWNERS = 'owners'
}

export const getAvailableGroups = (scope: MetricScopeOptions) => {
  switch (scope) {
    case MetricScopeOptions.CLUSTER:
      return [TopologyGroupTypes.NONE];
    case MetricScopeOptions.ZONE:
      return [TopologyGroupTypes.NONE, TopologyGroupTypes.CLUSTERS];
    case MetricScopeOptions.HOST:
      return [TopologyGroupTypes.NONE, TopologyGroupTypes.CLUSTERS, TopologyGroupTypes.ZONES];
    case MetricScopeOptions.NAMESPACE:
      return [
        TopologyGroupTypes.NONE,
        TopologyGroupTypes.CLUSTERS,
        TopologyGroupTypes.CLUSTERS_HOSTS,
        TopologyGroupTypes.ZONES,
        TopologyGroupTypes.ZONES_HOSTS,
        TopologyGroupTypes.HOSTS
      ];
    case MetricScopeOptions.OWNER:
      return [
        TopologyGroupTypes.NONE,
        TopologyGroupTypes.CLUSTERS,
        TopologyGroupTypes.CLUSTERS_ZONES,
        TopologyGroupTypes.ZONES,
        TopologyGroupTypes.ZONES_HOSTS,
        TopologyGroupTypes.ZONES_NAMESPACES,
        TopologyGroupTypes.ZONES_OWNERS,
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
  metricFunction: StatFunction;
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
  isSrcFiltered?: boolean;
  isDstFiltered?: boolean;
  isClearFilters?: boolean;
  isPinned?: boolean;
  showDecorators?: boolean;
  showStatusDecorator?: boolean;
  point?: Point;
  setPosition?: (location: Point) => void;
  canStepInto?: boolean;
};
export const decorated = <T>(t: T): Decorated<T> => t as Decorated<T>;

export type FilterDir = 'src' | 'dst';
const getDirFilterDefValue = (
  nodeType: NodeType,
  fields: Partial<TopologyMetricPeer>,
  dir: FilterDir,
  filterDefinitions: FilterDefinition[]
) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (fields.resource && fields.namespace) {
    def = findFilter(filterDefinitions, `${dir}_resource`)!;
    value = `${fields.resource.type}.${fields.namespace}.${fields.resource.name}`;
  } else if (nodeType === 'cluster' && (fields.clusterName || fields.resource)) {
    // TODO: see if clustername will become directionnal
    def = findFilter(filterDefinitions, `cluster_name`)!;
    value = `"${fields.clusterName || fields.resource?.name}"`;
  } else if (nodeType === 'zone' && (fields.zone || fields.resource)) {
    def = findFilter(filterDefinitions, `${dir}_zone`)!;
    value = `"${fields.zone || fields.resource?.name}"`;
  } else if (nodeType === 'host' && (fields.hostName || fields.resource)) {
    def = findFilter(filterDefinitions, `${dir}_host_name`)!;
    value = `"${fields.hostName || fields.resource?.name}"`;
  } else if (nodeType === 'namespace' && (fields.namespace || fields.resource)) {
    def = findFilter(filterDefinitions, `${dir}_namespace`)!;
    value = `"${fields.namespace || fields.resource?.name}"`;
  } else if (nodeType === 'resource' && fields.resource) {
    def = findFilter(filterDefinitions, `${dir}_name`)!;
    value = `"${fields.resource.name}"`;
  } else if (nodeType === 'owner' && fields.owner) {
    def = findFilter(filterDefinitions, `${dir}_owner_name`)!;
    value = `"${fields.owner.name}"`;
  } else if (fields.addr) {
    def = findFilter(filterDefinitions, `${dir}_address`)!;
    value = fields.addr!;
  }
  return def && value ? { def, value } : undefined;
};

const getFilterDefValue = (fields: Partial<TopologyMetricPeer>, filterDefinitions: FilterDefinition[]) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (fields.clusterName || fields.resource) {
    // TODO: see if clustername will become directionnal
    def = findFilter(filterDefinitions, `cluster_name`)!;
    value = `"${fields.clusterName || fields.resource?.name}"`;
  }
  return def && value ? { def, value } : undefined;
};

export const isDirElementFiltered = (
  nodeType: NodeType,
  fields: Partial<TopologyMetricPeer>,
  dir: FilterDir,
  filters: Filter[],
  filterDefinitions: FilterDefinition[]
) => {
  const defValue = getDirFilterDefValue(nodeType, fields, dir, filterDefinitions);
  if (!defValue) {
    return false;
  }
  const filter = findFromFilters(filters, { def: defValue.def });
  return filter !== undefined && filter.values.find(v => v.v === defValue.value) !== undefined;
};

export const isElementFiltered = (
  fields: Partial<TopologyMetricPeer>,
  filters: Filter[],
  filterDefinitions: FilterDefinition[]
) => {
  const defValue = getFilterDefValue(fields, filterDefinitions);
  if (!defValue) {
    return false;
  }
  const filter = findFromFilters(filters, { def: defValue.def });
  return filter !== undefined && filter.values.find(v => v.v === defValue.value) !== undefined;
};

const toggleFilter = (
  result: Filter[],
  defValue: {
    def: FilterDefinition;
    value: string;
  },
  isFiltered: boolean,
  setFilters: (filters: Filter[]) => void
) => {
  let filter = findFromFilters(result, { def: defValue.def });
  if (!filter) {
    filter = { def: defValue.def, values: [] };
    result.push(filter);
  }
  if (isFiltered) {
    // Remove
    filter!.values = filter!.values.filter(v => v.v !== defValue.value);
  } else {
    // Add, or Replace filter for kubeobject
    if (defValue.def.id === 'src_resource' || defValue.def.id === 'dst_resource') {
      filter!.values = [{ v: defValue.value! }];
    } else {
      filter!.values.push({ v: defValue.value });
    }
  }
  setFilters(result.filter(f => !_.isEmpty(f.values)));
};

export const toggleDirElementFilter = (
  nodeType: NodeType,
  fields: Partial<TopologyMetricPeer>,
  dir: FilterDir,
  isFiltered: boolean,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  filterDefinitions: FilterDefinition[]
) => {
  const result = _.cloneDeep(filters);
  const defValue = getDirFilterDefValue(nodeType, fields, dir, filterDefinitions);
  if (!defValue) {
    console.error("can't find defValue for fields", fields);
    return;
  }
  toggleFilter(result, defValue, isFiltered, setFilters);
};

export const toggleElementFilter = (
  fields: Partial<TopologyMetricPeer>,
  isFiltered: boolean,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  filterDefinitions: FilterDefinition[]
) => {
  const result = _.cloneDeep(filters);
  const defValue = getFilterDefValue(fields, filterDefinitions);
  if (!defValue) {
    console.error("can't find defValue for fields", fields);
    return;
  }
  toggleFilter(result, defValue, isFiltered, setFilters);
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
  scope: FlowScope,
  options: TopologyOptions,
  searchValue: string,
  highlightedId: string,
  filters: Filters,
  t: TFunction,
  filterDefinitions: FilterDefinition[],
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
  const isSrcFiltered = isDirElementFiltered(data.nodeType, data.peer, 'src', filters.list, filterDefinitions);
  const isDstFiltered = isDirElementFiltered(data.nodeType, data.peer, 'dst', filters.list, filterDefinitions);

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
      isSrcFiltered,
      isDstFiltered,
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

const getEdgeTag = (value: number, options: TopologyOptions, t: TFunction) => {
  if (options.edgeTags && value) {
    let metricFunction = options.metricFunction as MetricFunction;
    if (
      options.metricFunction !== 'sum' &&
      ['Bytes', 'Packets', 'PktDropBytes', 'PktDropPackets'].includes(options.metricType)
    ) {
      metricFunction = 'rate';
    }
    return getFormattedValue(value, options.metricType, metricFunction, t);
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
  metricScope: FlowScope,
  searchValue: string,
  highlightedId: string,
  filters: Filters,
  t: TFunction,
  filterDefinitions: FilterDefinition[],
  k8sModels: { [key: string]: K8sModel },
  isDark?: boolean
): Model => {
  let nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const opts = { ...DefaultOptions, ...options };

  const addGroup = (
    fields: Partial<TopologyMetricPeer>,
    scope: FlowScope,
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

  const addNode = (data: NodeData): NodeModel => {
    const parent = data.nodeType !== 'unknown' ? addPossibleGroups(data.peer) : undefined;
    let node = nodes.find(n => n.type === 'node' && n.id === data.peer.id);
    if (!node) {
      node = generateNode(
        data,
        metricScope,
        opts,
        searchValue,
        highlightedId,
        filters,
        t,
        filterDefinitions,
        k8sModels,
        isDark
      );
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
    const clusterGroup =
      [
        TopologyGroupTypes.CLUSTERS_HOSTS,
        TopologyGroupTypes.CLUSTERS_ZONES,
        TopologyGroupTypes.CLUSTERS_NAMESPACES,
        TopologyGroupTypes.CLUSTERS_OWNERS,
        TopologyGroupTypes.CLUSTERS
      ].includes(options.groupTypes) && !_.isEmpty(peer.clusterName)
        ? addGroup({ clusterName: peer.clusterName }, 'cluster', undefined, true)
        : undefined;
    const zoneGroup =
      [
        TopologyGroupTypes.CLUSTERS_ZONES,
        TopologyGroupTypes.ZONES_HOSTS,
        TopologyGroupTypes.ZONES_NAMESPACES,
        TopologyGroupTypes.ZONES_OWNERS,
        TopologyGroupTypes.ZONES
      ].includes(options.groupTypes) && !_.isEmpty(peer.zone)
        ? addGroup({ zone: peer.zone }, 'cluster', clusterGroup, true)
        : undefined;
    const hostGroup =
      [
        TopologyGroupTypes.CLUSTERS_HOSTS,
        TopologyGroupTypes.ZONES_HOSTS,
        TopologyGroupTypes.CLUSTERS_HOSTS,
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.HOSTS_OWNERS,
        TopologyGroupTypes.HOSTS
      ].includes(options.groupTypes) && !_.isEmpty(peer.hostName)
        ? addGroup({ hostName: peer.hostName }, 'host', zoneGroup || clusterGroup, true)
        : undefined;
    const namespaceGroup =
      [
        TopologyGroupTypes.ZONES_NAMESPACES,
        TopologyGroupTypes.CLUSTERS_NAMESPACES,
        TopologyGroupTypes.CLUSTERS_NAMESPACES,
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.NAMESPACES_OWNERS,
        TopologyGroupTypes.NAMESPACES
      ].includes(options.groupTypes) && !_.isEmpty(peer.namespace)
        ? addGroup({ namespace: peer.namespace }, 'namespace', hostGroup || zoneGroup || clusterGroup)
        : undefined;
    const ownerGroup =
      [
        TopologyGroupTypes.CLUSTERS_OWNERS,
        TopologyGroupTypes.ZONES_OWNERS,
        TopologyGroupTypes.CLUSTERS_OWNERS,
        TopologyGroupTypes.NAMESPACES_OWNERS,
        TopologyGroupTypes.HOSTS_OWNERS,
        TopologyGroupTypes.OWNERS
      ].includes(options.groupTypes) && peer.owner
        ? addGroup(
            { namespace: peer.namespace, owner: peer.owner },
            'owner',
            namespaceGroup || hostGroup || zoneGroup || clusterGroup,
            namespaceGroup === undefined
          )
        : undefined;

    return ownerGroup || namespaceGroup || hostGroup || zoneGroup || clusterGroup;
  };

  const peerToNodeData = (p: TopologyMetricPeer): NodeData => {
    switch (metricScope) {
      case 'cluster':
        return _.isEmpty(p.clusterName)
          ? { peer: p, nodeType: 'unknown' }
          : { peer: p, nodeType: 'cluster', canStepInto: true };
      case 'zone':
        return _.isEmpty(p.zone) ? { peer: p, nodeType: 'unknown' } : { peer: p, nodeType: 'zone', canStepInto: true };
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

  // link pods to nodes instead of external if possible as routing will duplicate flows as follow:
  // - pod -> destination
  // - node -> destination
  // the output will be pod -> node -> destination if all the metrics are present
  // else the original display will be kept
  const manageRouting = (peer: TopologyMetricPeer, opposite: TopologyMetricPeer): TopologyMetricPeer => {
    if (peer.clusterName === opposite.clusterName && opposite.resource?.type === 'Pod' && peer.resource === undefined) {
      const nodePeer =
        metrics.find(m => m.source.resource?.name === opposite.hostName && m.destination.addr === peer.addr)?.source ||
        metrics.find(m => m.destination.resource?.name === opposite.hostName && m.source.addr === peer.addr)
          ?.destination;
      return nodePeer || peer;
    }
    return peer;
  };

  metrics.forEach(m => {
    const srcNode = addNode(peerToNodeData(manageRouting(m.source, m.destination)));
    const dstNode = addNode(peerToNodeData(manageRouting(m.destination, m.source)));

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
