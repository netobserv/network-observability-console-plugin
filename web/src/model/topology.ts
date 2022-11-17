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
import { getTopologyEdgeId, getTopologyGroupId, getTopologyNodeId } from '../utils/ids';
import { MetricScopeOptions } from './metrics';
import { MetricFunction, MetricScope, MetricType, NodeType } from './flow-query';
import { getFormattedValue } from '../utils/metrics';

export enum LayoutName {
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

export enum TopologyTruncateLength {
  OFF = 0,
  XS = 10,
  S = 20,
  M = 25,
  L = 30,
  XL = 40
}

export interface TopologyOptions {
  maxEdgeStat: number;
  nodeBadges?: boolean;
  edges?: boolean;
  edgeTags?: boolean;
  startCollapsed?: boolean;
  truncateLength: TopologyTruncateLength;
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
  truncateLength: TopologyTruncateLength.M,
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

export const getFilterDefValue = (d: ElementData, t: TFunction) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (d.resourceKind && d.namespace && d.name) {
    def = findFilter(t, 'resource')!;
    value = `${d.resourceKind}.${d.namespace}.${d.name}`;
  } else if (d.nodeType === 'host' && (d.host || d.name)) {
    def = findFilter(t, 'host_name')!;
    value = `"${d.host || d.name}"`;
  } else if (d.nodeType === 'namespace' && (d.namespace || d.name)) {
    def = findFilter(t, 'namespace')!;
    value = `"${d.namespace || d.name}"`;
  } else if (d.nodeType === 'resource' && d.name) {
    def = findFilter(t, 'name')!;
    value = `"${d.name}"`;
  } else if (d.nodeType === 'owner' && d.name) {
    def = findFilter(t, 'owner_name')!;
    value = `"${d.name}"`;
  } else if (d.addr) {
    def = findFilter(t, 'address')!;
    value = d.addr!;
  }
  return def && value ? { def, value } : undefined;
};

export const isElementFiltered = (d: ElementData, filters: Filter[], t: TFunction) => {
  const defValue = getFilterDefValue(d, t);
  if (!defValue) {
    return false;
  }
  const filter = findFromFilters(filters, { def: defValue.def });
  return filter !== undefined && filter.values.find(v => v.v === defValue.value) !== undefined;
};

export const toggleElementFilter = (
  d: ElementData,
  isFiltered: boolean,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
  t: TFunction
) => {
  if (!setFilters) {
    return;
  }

  const result = _.cloneDeep(filters);
  const defValue = getFilterDefValue(d, t);
  if (!defValue) {
    console.error("can't find defValue for elementData", d);
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
  resourceKind?: string;
  namespace?: string;
  name?: string;
  displayName?: string;
  addr?: string;
  host?: string;
  canStepInto?: boolean;
  parentKind?: string;
  parentName?: string;
  badgeColor?: string;
};

export const generateNode = (
  data: NodeData,
  options: TopologyOptions,
  searchValue: string,
  highlightedId: string,
  filters: Filter[],
  t: TFunction,
  k8sModels: { [key: string]: K8sModel },
  isDark?: boolean
): NodeModel => {
  const id = getTopologyNodeId(data.resourceKind, data.namespace, data.name, data.addr, data.host);
  const label = data.displayName || data.name || data.addr || ''; // should never be empty
  const secondaryLabel =
    data.nodeType !== 'namespace' &&
    ![
      TopologyGroupTypes.NAMESPACES,
      TopologyGroupTypes.NAMESPACES_OWNERS,
      TopologyGroupTypes.HOSTS_NAMESPACES
    ].includes(options.groupTypes)
      ? data.namespace
      : undefined;
  const shadowed = !_.isEmpty(searchValue) && !(label.includes(searchValue) || secondaryLabel?.includes(searchValue));
  const filtered = !_.isEmpty(searchValue) && !shadowed;
  const highlighted = !shadowed && !_.isEmpty(highlightedId) && highlightedId.includes(id);
  const k8sModel = options.nodeBadges && data.resourceKind ? k8sModels[data.resourceKind] : undefined;
  return {
    id,
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
      isFiltered: isElementFiltered(data, filters, t),
      labelPosition: LabelPosition.bottom,
      badge: k8sModel?.abbr,
      badgeColor: k8sModel?.color ? k8sModel.color : '#2b9af3',
      badgeClassName: 'topology-icon',
      showDecorators: true,
      secondaryLabel,
      truncateLength: options.truncateLength !== TopologyTruncateLength.OFF ? options.truncateLength : undefined
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

export const getEdgeStyle = (count: number) => {
  return count ? EdgeStyle.dashed : EdgeStyle.dotted;
};

export const getStat = (stats: MetricStats, mf: MetricFunction): number => {
  return mf === 'avg' ? stats.avg : mf === 'max' ? stats.max : mf === 'last' ? stats.latest : stats.total;
};

export const getEdgeTag = (value: number, options: TopologyOptions) => {
  if (options.edgeTags && value) {
    return getFormattedValue(value, options.metricType, options.metricFunction);
  }
  return undefined;
};

export const generateEdge = (
  sourceId: string,
  targetId: string,
  stat: number,
  options: TopologyOptions,
  shadowed = false,
  filtered = false,
  highlightedId: string,
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
      tag: getEdgeTag(stat, options),
      tagStatus: getTagStatus(stat, options.maxEdgeStat),
      bps: stat
    }
  };
};

export const generateDataModel = (
  datas: TopologyMetrics[],
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

  function addGroup(
    name: string,
    nodeType: NodeType,
    resourceKind: string,
    parent?: NodeModel,
    secondaryLabelPadding = false
  ) {
    const id = getTopologyGroupId(resourceKind, name, parent ? parent.id : undefined);
    let group = nodes.find(g => g.type === 'group' && g.id === id);
    const parentData = parent?.data as NodeData | undefined;
    if (!group) {
      group = {
        id,
        children: [],
        type: 'group',
        group: true,
        collapsed: options.startCollapsed,
        label: name,
        style: { padding: secondaryLabelPadding ? 35 : 10 },
        data: {
          name,
          nodeType,
          resourceKind,
          isDark,
          parentKind: parentData?.resourceKind,
          parentName: parentData?.name,
          labelPosition: LabelPosition.bottom,
          collapsible: true,
          collapsedWidth: 75,
          collapsedHeight: 75,
          truncateLength:
            options.truncateLength !== TopologyTruncateLength.OFF
              ? //match node label length according to badge
                options.nodeBadges
                ? options.truncateLength + 2
                : options.truncateLength - 3
              : undefined
        }
      };
      nodes.push(group);
    }

    if (parent && !parent.children!.includes(group.id)) {
      parent.children!.push(group.id);
    }

    return group;
  }

  function addNode(data: NodeData, parent?: NodeModel) {
    let node = nodes.find(
      n =>
        n.data.nodeType === data.nodeType &&
        n.data.resourceKind === data.resourceKind &&
        n.data.namespace === data.namespace &&
        n.data.name === data.name &&
        n.data.addr === data.addr &&
        n.data.host === data.host
    );
    if (!node) {
      node = generateNode(data, opts, searchValue, highlightedId, filters, t, k8sModels, isDark);
      nodes.push(node);
    }

    if (parent && !parent.children!.includes(node.id)) {
      parent.children!.push(node.id);
    }

    return node;
  }

  function addEdge(sourceId: string, targetId: string, stats: MetricStats, shadowed = false, filtered = false) {
    const stat = getStat(stats, options.metricFunction);
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
        tag: getEdgeTag(stat, options),
        tagStatus: getTagStatus(stat, options.maxEdgeStat),
        bps: stat
      };
    } else {
      edge = generateEdge(sourceId, targetId, stat, opts, shadowed, filtered, highlightedId, isDark);
      edges.push(edge);
    }

    return edge;
  }

  function manageNode(peer: TopologyMetricPeer) {
    const hostGroup =
      [TopologyGroupTypes.HOSTS_NAMESPACES, TopologyGroupTypes.HOSTS_OWNERS, TopologyGroupTypes.HOSTS].includes(
        options.groupTypes
      ) && !_.isEmpty(peer.hostName)
        ? addGroup(peer.hostName!, 'host', 'Node', undefined, true)
        : undefined;
    const namespaceGroup =
      [
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.NAMESPACES_OWNERS,
        TopologyGroupTypes.NAMESPACES
      ].includes(options.groupTypes) && !_.isEmpty(peer.namespace)
        ? addGroup(peer.namespace!, 'namespace', 'Namespace', hostGroup)
        : undefined;
    const ownerGroup =
      [TopologyGroupTypes.NAMESPACES_OWNERS, TopologyGroupTypes.HOSTS_OWNERS, TopologyGroupTypes.OWNERS].includes(
        options.groupTypes
      ) &&
      !_.isEmpty(peer.ownerType) &&
      !_.isEmpty(peer.ownerName)
        ? addGroup(
            peer.ownerName!,
            'owner',
            peer.ownerType!,
            namespaceGroup ? namespaceGroup : hostGroup,
            namespaceGroup === undefined
          )
        : undefined;

    const parent = ownerGroup ? ownerGroup : namespaceGroup ? namespaceGroup : hostGroup;
    switch (metricScope) {
      case MetricScopeOptions.HOST:
        return addNode(
          _.isEmpty(peer.hostName)
            ? //metrics without host will be grouped as 'External'
              { nodeType: 'unknown', displayName: t('External') }
            : //valid metrics will be Nodes with ips
              { nodeType: 'host', resourceKind: 'Node', name: peer.hostName, canStepInto: true },
          parent
        );
      case MetricScopeOptions.NAMESPACE:
        return addNode(
          _.isEmpty(peer.namespace)
            ? //metrics without namespace will be grouped as 'Unknown'
              { nodeType: 'unknown', displayName: t('Unknown') }
            : //valid metrics will be Namespaces with namespace as name + host infos
              {
                nodeType: 'namespace',
                resourceKind: 'Namespace',
                name: peer.namespace,
                host: peer.hostName,
                canStepInto: true
              },
          parent
        );
      case MetricScopeOptions.OWNER:
        return addNode(
          _.isEmpty(peer.ownerName)
            ? //metrics without owner name will be grouped as 'Unknown'
              { nodeType: 'unknown', displayName: t('Unknown') }
            : //valid metrics will be owner type & name + namespace & host infos
              {
                namespace: peer.namespace,
                nodeType: 'owner',
                resourceKind: peer.ownerType,
                name: peer.ownerName,
                host: peer.hostName,
                canStepInto: true
              },
          parent
        );
      case MetricScopeOptions.RESOURCE:
      default:
        return addNode(
          {
            namespace: peer.namespace,
            nodeType: 'resource',
            resourceKind: peer.type,
            name: peer.name,
            addr: peer.addr,
            host: peer.hostName
          },
          parent
        );
    }
  }

  datas.forEach(d => {
    const srcNode = manageNode(d.source);
    const dstNode = manageNode(d.destination);

    if (options.edges && srcNode && dstNode && srcNode.id !== dstNode.id) {
      addEdge(
        srcNode.id,
        dstNode.id,
        d.stats,
        srcNode.data.shadowed || dstNode.data.shadowed,
        srcNode.data.filtered || dstNode.data.filtered
      );
    }
  });

  //remove empty groups
  nodes = nodes.filter(n => n.type !== 'group' || (n.children && n.children.length));
  return { nodes, edges };
};
