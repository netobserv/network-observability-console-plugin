import { AlertSeverity, K8sModel, PrometheusLabels } from '@openshift-console/dynamic-plugin-sdk';
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
import { TFunction } from 'i18next';
import _ from 'lodash';
import { MetricStats, TopologyMetricPeer, TopologyMetrics } from '../api/loki';
import { TruncateLength } from '../components/dropdowns/truncate-dropdown';
import { HealthStat } from '../components/health/health-helper';
import { Filter, FilterCompare, FilterDefinition, FilterId, Filters, findFromFilters } from '../model/filters';
import { ContextSingleton } from '../utils/context';
import { findFilter } from '../utils/filter-definitions';
import { getTopologyEdgeId } from '../utils/ids';
import { createPeer, getFormattedValue } from '../utils/metrics';
import { defaultMetricFunction, defaultMetricType } from '../utils/router';
import { FlowScope, Groups, Match, MetricFunction, MetricType, NodeType, StatFunction } from './flow-query';
import { getStat } from './metrics';
import { getStepInto, isDirectionnal, resolveGroupTypes, ScopeConfigDef } from './scope';

export enum LayoutName {
  threeD = '3d',
  breadthFirst = 'BreadthFirst',
  cola = 'Cola',
  colaNoForce = 'ColaNoForce',
  colaGroups = 'ColaGroups',
  concentric = 'Concentric',
  dagre = 'Dagre',
  dagreGroup = 'DagreGroup',
  force = 'Force',
  grid = 'Grid'
}

export type TopologyGroupTypes = 'none' | 'auto' | Groups;

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
  showEmpty?: boolean;
}

export const DefaultOptions: TopologyOptions = {
  nodeBadges: true,
  edges: true,
  edgeTags: true,
  maxEdgeStat: 0,
  startCollapsed: false,
  truncateLength: TruncateLength.M,
  layout: LayoutName.colaNoForce,
  groupTypes: 'auto',
  lowScale: 0.3,
  medScale: 0.5,
  metricFunction: defaultMetricFunction,
  metricType: defaultMetricType,
  showEmpty: false
};

export type GraphElementPeer = GraphElement<ElementModel, NodeData>;
export type ElementData = Partial<NodeData>;
export type Decorated<T> = T & {
  id: string;
  isHovered?: boolean;
  hover?: boolean;
  dragging?: boolean;
  highlighted?: boolean;
  match: Match;
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

  // always look for resource + namespace first
  if (fields.resource && fields.namespace) {
    def = findFilter(filterDefinitions, `${dir}_resource`)!;
    value = `${fields.resource.type}.${fields.namespace}.${fields.resource.name}`;
  } else if (nodeType === 'owner' && fields.owner) {
    def = findFilter(filterDefinitions, `${dir}_owner_name`)!;
    value = `"${fields.owner.name}"`;
  } else {
    // try by scope definitions
    ContextSingleton.getScopes().forEach(sc => {
      if (!def && nodeType === sc.id && (fields[sc.id] || fields.resource)) {
        if (isDirectionnal(sc)) {
          def = findFilter(filterDefinitions, sc.filters!.find(f => f.includes(dir)) as FilterId)!;
          value = `"${fields[sc.id] || fields.resource?.name}"`;
        } else {
          def = findFilter(filterDefinitions, sc.filter! as FilterId)!;
          value = `"${fields[sc.id] || fields.resource?.name}"`;
        }
      }
    });
  }

  // fallback on addr and/or subnet label if not found
  if (!def) {
    if (fields.subnetLabel) {
      def = findFilter(filterDefinitions, `${dir}_subnet_label`)!;
      value = fields.subnetLabel!;
    } else if (fields.addr) {
      def = findFilter(filterDefinitions, `${dir}_address`)!;
      value = fields.addr!;
    }
  }
  return def && value ? { def, value } : undefined;
};

const getFilterDefValue = (fields: Partial<TopologyMetricPeer>, filterDefinitions: FilterDefinition[]) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (fields.cluster || fields.resource) {
    // TODO: see if clustername will become directionnal
    def = findFilter(filterDefinitions, `cluster_name`)!;
    value = `"${fields.cluster || fields.resource?.name}"`;
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
  const filter = findFromFilters(filters, { def: defValue.def, compare: FilterCompare.equal });
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
  const filter = findFromFilters(filters, { def: defValue.def, compare: FilterCompare.equal });
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
  let filter = findFromFilters(result, { def: defValue.def, compare: FilterCompare.equal });
  if (!filter) {
    filter = { def: defValue.def, compare: FilterCompare.equal, values: [] };
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
    console.error("can't find directional filter definition and value for fields", fields);
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
    console.error("can't find filter definition and value for fields", fields);
    return;
  }
  toggleFilter(result, defValue, isFiltered, setFilters);
};

export const defaultNodeTruncateLength = 25;
export const defaultNodeSize = 75;

export type NodeData = {
  nodeType: NodeType;
  peer: TopologyMetricPeer;
  alerts?: HealthStat[];
  canStepInto?: boolean;
  badgeColor?: string;
  noMetrics?: boolean;
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
  isDark?: boolean,
  alerts?: HealthStat[]
): NodeModel => {
  const label = data.peer.getDisplayName(false, false) || (scope === 'host' ? t('External') : t('Unknown'))!;
  const resourceKind = data.peer.resourceKind;
  const secondaryLabel =
    data.nodeType !== 'namespace' && !options.groupTypes.includes('namespaces') ? data.peer.namespace : undefined;
  const shadowed = !_.isEmpty(searchValue) && !(label.includes(searchValue) || secondaryLabel?.includes(searchValue));
  const filtered = !_.isEmpty(searchValue) && !shadowed;
  const highlighted = !shadowed && !_.isEmpty(highlightedId) && highlightedId.includes(data.peer.id);
  const k8sModel = options.nodeBadges && resourceKind ? k8sModels[resourceKind] : undefined;
  const isSrcFiltered = isDirElementFiltered(data.nodeType, data.peer, 'src', filters.list, filterDefinitions);
  const isDstFiltered = isDirElementFiltered(data.nodeType, data.peer, 'dst', filters.list, filterDefinitions);
  const status = getResourceStatus(data.peer, alerts);

  return {
    id: data.peer.id,
    type: 'node',
    label,
    width: defaultNodeSize,
    height: defaultNodeSize,
    shape: k8sModel ? NodeShape.ellipse : NodeShape.rect,
    status: status || NodeStatus.default,
    style: { padding: 20 },
    data: {
      ...data,
      shadowed,
      filtered,
      highlighted,
      isDark,
      match: filters.match,
      isSrcFiltered,
      isDstFiltered,
      labelPosition: LabelPosition.bottom,
      badge: k8sModel?.abbr,
      badgeColor: k8sModel?.color ? k8sModel.color : '#2b9af3',
      badgeClassName: 'topology-icon',
      showDecorators: true,
      showStatusDecorator: status !== undefined,
      secondaryLabel,
      truncateLength: options.truncateLength !== TruncateLength.OFF ? options.truncateLength : undefined,
      alerts
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
      //edges are directed from src to dst. It will become bidirectional if inverted pair is found
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

type AlertLabel = PrometheusLabels & {
  alertname: string;
  severity?: AlertSeverity | string;
};

// Helper to extract source fields from alert labels
const extractSourceFields = (labels: AlertLabel): Partial<TopologyMetricPeer> => {
  return extractFields(labels, 'Src');
};

// Helper to extract destination fields from alert labels
const extractDestinationFields = (labels: AlertLabel): Partial<TopologyMetricPeer> => {
  return extractFields(labels, 'Dst');
};

// Helper to extract fields from alert labels
const extractFields = (labels: AlertLabel, prefix: 'Src' | 'Dst'): Partial<TopologyMetricPeer> => {
  const fields: Partial<TopologyMetricPeer> = {};
  let foundPrefixedFields = false;
  let ownerName: string | undefined;
  let ownerType: string | undefined;

  Object.entries(labels).forEach(([key, value]) => {
    if (key.startsWith(prefix)) {
      foundPrefixedFields = true;
      const fieldName = key.replace(prefix, '').replace('K8S_', '').toLowerCase();
      if (fieldName === 'hostname' || fieldName === 'node') {
        fields.host = value as string;
      } else if (fieldName === 'namespace') {
        fields.namespace = value as string;
      } else if (fieldName === 'workload') {
        ownerName = value as string;
      } else if (fieldName === 'kind') {
        ownerType = value as string;
      } else if (fieldName === 'clustername') {
        fields.cluster = value as string;
      } else {
        fields[fieldName] = value;
      }
    }
  });

  // Set owner if we have both name and type
  if (ownerName && ownerType) {
    fields.owner = { name: ownerName, type: ownerType };
  }

  // If no prefixed fields found, try to extract from direct dimension labels
  // This handles aggregated alerts that have labels like 'namespace', 'node', etc.
  if (!foundPrefixedFields) {
    if (labels.namespace) {
      fields.namespace = labels.namespace as string;
    }
    if (labels.node) {
      fields.host = labels.node as string;
    }
    if (labels.instance) {
      fields.host = labels.instance as string;
    }
    if (labels.workload && labels.kind) {
      fields.owner = {
        name: labels.workload as string,
        type: labels.kind as string
      };
    }
  }

  return fields;
};

const getResourceAlerts = (
  peer: TopologyMetricPeer,
  nodeType: NodeType,
  resourceStats?: HealthStat[]
): HealthStat[] | undefined => {
  if (!resourceStats || resourceStats.length === 0) {
    return undefined;
  }

  const alerts: HealthStat[] = [];
  // Check all resource stats for this peer
  for (const resource of resourceStats) {
    // First, check if the resource name matches this peer's dimension (namespace, node, or workload based on nodeType)
    if (!resourceMatchesPeer(peer, resource.name, nodeType)) {
      continue;
    }

    const matchedResource: HealthStat = {
      name: resource.name,
      score: resource.score,
      critical: { firing: [], pending: [], silenced: [], inactive: [] },
      warning: { firing: [], pending: [], silenced: [], inactive: [] },
      other: { firing: [], pending: [], silenced: [], inactive: [] }
    };
    let hasAlerts = false;

    // Check in priority order: critical > warning > info (other)
    for (const severity of ['critical', 'warning', 'other'] as const) {
      if (resource[severity].firing.length > 0) {
        for (const alert of resource[severity].firing) {
          if (matchesAlert(peer, alert.labels)) {
            matchedResource[severity].firing.push(alert);
            hasAlerts = true;
          }
        }
      }

      // skip pending, silenced and inactive alerts since those are not relevant in topology view
    }

    if (hasAlerts) {
      alerts.push(matchedResource);
    }
  }

  return alerts.length > 0 ? alerts : undefined;
};

// Helper function to check if a resource name matches a peer for a given scope/dimension
// Only matches if the resource belongs to the same dimension as nodeType
const resourceMatchesPeer = (peer: TopologyMetricPeer, resourceName: string, nodeType: NodeType): boolean => {
  // Global alerts have empty resource name - only match if nodeType is a direct dimension
  if (!resourceName) {
    return true;
  }

  // Match based on the current scope being viewed
  switch (nodeType) {
    case 'namespace':
      return peer.namespace === resourceName;
    case 'host':
      return peer.host === resourceName;
    case 'owner':
      return peer.owner?.name === resourceName;
    default:
      // For other scopes, try to match by the scope name
      return (peer as never)[nodeType] === resourceName;
  }
};

// Helper function to check if two peers are the same by comparing identifying fields
// Ignores non-identifying fields like subnetLabel
const peersMatch = (peer1: TopologyMetricPeer, peer2: TopologyMetricPeer): boolean => {
  // Compare owner
  if (peer1.owner && peer2.owner) {
    return peer1.owner.name === peer2.owner.name && peer1.owner.type === peer2.owner.type;
  }
  if ((peer1.owner === undefined) !== (peer2.owner === undefined)) {
    return false;
  }

  // Compare resource
  if (peer1.resource && peer2.resource) {
    return peer1.resource.name === peer2.resource.name && peer1.resource.type === peer2.resource.type;
  }
  if ((peer1.resource === undefined) !== (peer2.resource === undefined)) {
    return false;
  }

  // Compare host
  if (peer1.host !== peer2.host) {
    return false;
  }

  // Compare namespace
  if (peer1.namespace !== peer2.namespace) {
    return false;
  }

  // Compare cluster
  if (peer1.cluster !== peer2.cluster) {
    return false;
  }

  // Compare address (if no other identifying info)
  if (!peer1.owner && !peer1.resource && peer1.addr !== peer2.addr) {
    return false;
  }

  return true;
};

// Helper function to check if an alert matches a peer
const matchesAlert = (peer: TopologyMetricPeer, labels: AlertLabel): boolean => {
  const srcPeer = createPeer(extractSourceFields(labels));
  const dstPeer = createPeer(extractDestinationFields(labels));

  // For aggregated alerts (those without explicit Src/Dst labels),
  // srcPeer and dstPeer will have the same values from dimension labels
  if (peersMatch(srcPeer, peer) || peersMatch(dstPeer, peer)) {
    return true;
  }

  return false;
};

// Find alert status for a specific peer by comparing alert labels to peer fields
const getResourceStatus = (peer: TopologyMetricPeer, alerts?: HealthStat[]): NodeStatus => {
  if (!alerts || alerts.length === 0) {
    return NodeStatus.default;
  }

  // Check in priority order: critical > warning > info (other)
  for (const resource of alerts) {
    if (resource.critical.firing.length > 0) {
      for (const alert of resource.critical.firing) {
        if (matchesAlert(peer, alert.labels)) {
          return NodeStatus.danger;
        }
      }
    }
    if (resource.warning.firing.length > 0) {
      for (const alert of resource.warning.firing) {
        if (matchesAlert(peer, alert.labels)) {
          return NodeStatus.warning;
        }
      }
    }
    if (resource.other.firing.length > 0) {
      for (const alert of resource.other.firing) {
        if (matchesAlert(peer, alert.labels)) {
          return NodeStatus.info;
        }
      }
    }
  }

  return NodeStatus.default;
};

export const generateDataModel = (
  metrics: TopologyMetrics[],
  droppedMetrics: TopologyMetrics[],
  options: TopologyOptions,
  metricScope: FlowScope,
  scopes: ScopeConfigDef[],
  searchValue: string,
  highlightedId: string,
  filters: Filters,
  t: TFunction,
  filterDefinitions: FilterDefinition[],
  k8sModels: { [key: string]: K8sModel },
  expectedNodes: string[],
  isDark?: boolean,
  resourceStats?: HealthStat[]
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
      const alerts = getResourceAlerts(data.peer, data.nodeType, resourceStats);
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
        isDark,
        alerts
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
        //edges are directed from src to dst. It will become bidirectional if inverted pair is found
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
    // groups are all possible scopes except last one
    const parentScopes = ContextSingleton.getScopes().slice(0, -1);
    const resolvedGroups = resolveGroupTypes(options.groupTypes, metricScope, scopes);

    // build parent tree from biggest to smallest group
    let parent: NodeModel | undefined = undefined;
    parentScopes.forEach(sc => {
      if (resolvedGroups.includes(`${sc.id}s`) && !_.isEmpty(peer[sc.id])) {
        parent = addGroup(
          { [sc.id]: peer[sc.id], namespace: ['namespace', 'owner'].includes(sc.id) ? peer.namespace : undefined },
          sc.id,
          parent,
          true
        );
      }
    });

    // return smallest parent set
    return parent;
  };

  const peerToNodeData = (p: TopologyMetricPeer): NodeData => {
    const canStepInto =
      getStepInto(
        metricScope,
        scopes.map(sc => sc.id)
      ) !== undefined;
    switch (metricScope) {
      case 'owner':
        return p.owner ? { peer: p, nodeType: 'owner', canStepInto } : { peer: p, nodeType: 'unknown' };
      case 'resource':
        return { peer: p, nodeType: 'resource' };
      default:
        const value = (p as never)[metricScope] as string;
        return _.isEmpty(value) ? { peer: p, nodeType: 'unknown' } : { peer: p, nodeType: metricScope, canStepInto };
    }
  };

  // link pods to nodes instead of external if possible as routing will duplicate flows as follow:
  // - pod -> destination
  // - node -> destination
  // the output will be pod -> node -> destination if all the metrics are present
  // else the original display will be kept
  const manageRouting = (peer: TopologyMetricPeer, opposite: TopologyMetricPeer): TopologyMetricPeer => {
    if (peer.cluster === opposite.cluster && opposite.resource?.type === 'Pod' && peer.resource === undefined) {
      const nodePeer =
        metrics.find(m => m.source.resource?.name === opposite.host && m.destination.addr === peer.addr)?.source ||
        metrics.find(m => m.destination.resource?.name === opposite.host && m.source.addr === peer.addr)?.destination;
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

  // add missing nodes to the view if available
  if (!_.isEmpty(expectedNodes)) {
    const currentNodes = nodes.map(n => n.label);
    const missingNodes = expectedNodes.filter(n => !currentNodes.includes(n));
    missingNodes.forEach(n => {
      const fields: Partial<TopologyMetricPeer> = { id: n };
      fields[metricScope] = n;
      addNode({ peer: createPeer(fields), nodeType: metricScope, canStepInto: false, noMetrics: true });
    });
  }

  return { nodes, edges };
};
