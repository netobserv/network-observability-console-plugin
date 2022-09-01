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
import { elementPerMinText, roundTwoDigits } from '../utils/count';
import { TopologyMetrics } from '../api/loki';
import { Filter, FilterDefinition } from '../model/filters';
import { bytesPerSeconds, humanFileSize } from '../utils/bytes';
import { defaultTimeRange } from '../utils/router';
import { findFilter } from '../utils/filter-definitions';
import { TFunction } from 'i18next';
import { K8sModel } from '@openshift-console/dynamic-plugin-sdk';
import { MetricScopeOptions, MetricFunctionOptions, MetricTypeOptions } from './metrics';
import { MetricScope } from './flow-query';

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
  HOSTS = 'hosts',
  HOSTS_NAMESPACES = 'hosts+namespaces',
  HOSTS_OWNERS = 'hosts+owners',
  NAMESPACES = 'namespaces',
  NAMESPACES_OWNERS = 'namespaces+owners',
  OWNERS = 'owners'
}

export enum TopologyTruncateLength {
  OFF = 0,
  XS = 10,
  S = 20,
  M = 25,
  L = 30,
  XL = 40
}

export interface TopologyOptions {
  rangeInSeconds: number;
  maxEdgeValue: number;
  nodeBadges?: boolean;
  edges?: boolean;
  edgeTags?: boolean;
  startCollapsed?: boolean;
  truncateLength: TopologyTruncateLength;
  layout: LayoutName;
  groupTypes: TopologyGroupTypes;
  lowScale: number;
  medScale: number;
  metricFunction: MetricFunctionOptions;
  metricType: MetricTypeOptions;
}

export const DefaultOptions: TopologyOptions = {
  rangeInSeconds: defaultTimeRange,
  nodeBadges: true,
  edges: true,
  edgeTags: true,
  maxEdgeValue: 0,
  startCollapsed: false,
  truncateLength: TopologyTruncateLength.M,
  layout: LayoutName.ColaNoForce,
  groupTypes: TopologyGroupTypes.NONE,
  lowScale: 0.3,
  medScale: 0.5,
  metricFunction: MetricFunctionOptions.AVG,
  metricType: MetricTypeOptions.BYTES
};

export type ElementData = {
  type?: string;
  namespace?: string;
  name?: string;
  addr?: string;
  host?: string;
};

export const getFilterDefValue = (d: ElementData, t: TFunction) => {
  let def: FilterDefinition | undefined;
  let value: string | undefined;
  if (d.type && d.namespace && d.name) {
    def = findFilter(t, 'resource')!;
    value = `${d.type}.${d.namespace}.${d.name}`;
  } else if (d.type === 'Node' && (d.host || d.name)) {
    def = findFilter(t, 'host_name')!;
    value = `"${d.host ? d.host! : d.name!}"`;
  } else if (d.type === 'Namespace' && (d.namespace || d.name)) {
    def = findFilter(t, 'namespace')!;
    value = `"${d.namespace ? d.namespace! : d.name!}"`;
  } else if (d.type && d.name) {
    if (['Service', 'Pod'].includes(d.type)) {
      def = findFilter(t, 'name')!;
    } else {
      def = findFilter(t, 'owner_name')!;
    }
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
  const filter = filters.find(f => f.def.id === defValue.def.id);
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
  let filter = result.find(f => f.def.id === defValue.def.id);
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
  namespace?: string;
  type?: string;
  name?: string;
  displayName?: string;
  addr?: string;
  host?: string;
  canStepInto?: boolean;
};

export const generateNode = (
  data: NodeData,
  options: TopologyOptions,
  searchValue: string,
  highlightedId: string,
  filters: Filter[],
  t: TFunction,
  k8sModels: { [key: string]: K8sModel }
): NodeModel => {
  const id = `${data.type}.${data.namespace}.${data.name}.${data.addr}.${data.host}`;
  const label = data.name
    ? data.name
    : data.addr
    ? data.addr
    : data.namespace
    ? data.namespace
    : data.host
    ? data.host
    : data.displayName
    ? data.displayName
    : '';
  const secondaryLabel =
    data.type !== 'Namespace' &&
    ![
      TopologyGroupTypes.NAMESPACES,
      TopologyGroupTypes.NAMESPACES_OWNERS,
      TopologyGroupTypes.HOSTS_NAMESPACES
    ].includes(options.groupTypes)
      ? data.namespace
      : undefined;
  const shadowed = !_.isEmpty(searchValue) && !(label.includes(searchValue) || secondaryLabel?.includes(searchValue));
  const highlighted = !shadowed && !_.isEmpty(highlightedId) && highlightedId.includes(id);
  const k8sModel = options.nodeBadges && data.type ? k8sModels[data.type] : undefined;
  return {
    id,
    type: 'node',
    label,
    width: DEFAULT_NODE_SIZE,
    height: DEFAULT_NODE_SIZE,
    shape: NodeShape.ellipse,
    status: NodeStatus.default,
    style: { padding: 20 },
    data: {
      ...data,
      shadowed,
      highlighted,
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

export const getEdgeTag = (count: number, options: TopologyOptions) => {
  const roundCount = roundTwoDigits(count);
  if (options.edgeTags && roundCount) {
    if (options.metricFunction === MetricFunctionOptions.RATE) {
      return `${roundCount}%`;
    } else {
      switch (options.metricType) {
        case MetricTypeOptions.BYTES:
          if (options.metricFunction === MetricFunctionOptions.SUM) {
            return humanFileSize(count, true, 0);
          } else {
            //get speed using default step = 60s
            return bytesPerSeconds(count, 60);
          }

        case MetricTypeOptions.PACKETS:
        default:
          switch (options.metricFunction) {
            case MetricFunctionOptions.MAX:
            case MetricFunctionOptions.AVG:
              return elementPerMinText(count);
            default:
              return roundCount;
          }
      }
    }
  } else {
    return undefined;
  }
};

export const generateEdge = (
  sourceId: string,
  targetId: string,
  count: number,
  options: TopologyOptions,
  shadowed = false,
  highlightedId: string
): EdgeModel => {
  const id = `${sourceId}.${targetId}`;
  const highlighted = !shadowed && !_.isEmpty(highlightedId) && id.includes(highlightedId);
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
      shadowed,
      highlighted,
      //edges are directed from src to dst. It will become bidirectionnal if inverted pair is found
      startTerminalType: EdgeTerminalType.none,
      startTerminalStatus: NodeStatus.default,
      endTerminalType: count > 0 ? EdgeTerminalType.directional : EdgeTerminalType.none,
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
  metricScope: MetricScope,
  searchValue: string,
  highlightedId: string,
  filters: Filter[],
  t: TFunction,
  k8sModels: { [key: string]: K8sModel }
): Model => {
  let nodes: NodeModel[] = [];
  const edges: EdgeModel[] = [];
  const opts = { ...DefaultOptions, ...options };
  //ensure each child to have single parent
  const childIds: string[] = [];

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

    if (parent && !childIds.includes(group.id)) {
      parent.children!.push(group.id);
      childIds.push(group.id);
    }

    return group;
  }

  function addNode(data: NodeData, parent?: NodeModel) {
    let node = nodes.find(
      n =>
        n.data.type === data.type &&
        n.data.namespace === data.namespace &&
        n.data.name === data.name &&
        n.data.addr === data.addr &&
        n.data.host === data.host
    );
    if (!node) {
      node = generateNode(data, opts, searchValue, highlightedId, filters, t, k8sModels);
      nodes.push(node);
    }

    if (parent && !childIds.includes(node.id)) {
      parent.children!.push(node.id);
      childIds.push(node.id);
    }

    return node;
  }

  function addEdge(sourceId: string, targetId: string, count: number, shadowed = false) {
    let edge = edges.find(
      e =>
        (e.data.sourceId === sourceId && e.data.targetId === targetId) ||
        (e.data.sourceId === targetId && e.data.targetId === sourceId)
    );
    if (edge) {
      //update style and datas
      const totalCount = edge.data.count + count;
      edge.edgeStyle = getEdgeStyle(totalCount);
      edge.animationSpeed = getAnimationSpeed(totalCount, options.maxEdgeValue);
      edge.data = {
        ...edge.data,
        shadowed,
        //edges are directed from src to dst. It will become bidirectionnal if inverted pair is found
        startTerminalType: edge.data.sourceId !== sourceId ? EdgeTerminalType.directional : edge.data.startTerminalType,
        tag: getEdgeTag(totalCount, options),
        tagStatus: getTagStatus(totalCount, options.maxEdgeValue),
        count: totalCount
      };
    } else {
      edge = generateEdge(sourceId, targetId, count, opts, shadowed, highlightedId);
      edges.push(edge);
    }

    return edge;
  }

  function manageNode(prefix: 'Src' | 'Dst', d: TopologyMetrics) {
    const m = d.metric as never;

    const namespace = m[`${prefix}K8S_Namespace`];
    const ownerType = m[`${prefix}K8S_OwnerType`];
    const ownerName = m[`${prefix}K8S_OwnerName`];
    const host = m[`${prefix}K8S_HostName`];
    const type = m[`${prefix}K8S_Type`];
    const name = m[`${prefix}K8S_Name`];
    const addr = m[`${prefix}Addr`];

    const hostGroup =
      [TopologyGroupTypes.HOSTS_NAMESPACES, TopologyGroupTypes.HOSTS_OWNERS, TopologyGroupTypes.HOSTS].includes(
        options.groupTypes
      ) && !_.isEmpty(host)
        ? addGroup(host, 'Node', undefined, true)
        : undefined;
    const namespaceGroup =
      [TopologyGroupTypes.NAMESPACES_OWNERS, TopologyGroupTypes.NAMESPACES].includes(options.groupTypes) &&
      !_.isEmpty(namespace)
        ? addGroup(namespace, 'Namespace', hostGroup)
        : undefined;
    const ownerGroup =
      [
        TopologyGroupTypes.NAMESPACES_OWNERS,
        TopologyGroupTypes.HOSTS_NAMESPACES,
        TopologyGroupTypes.HOSTS_OWNERS,
        TopologyGroupTypes.OWNERS
      ].includes(options.groupTypes) &&
      !_.isEmpty(ownerType) &&
      !_.isEmpty(ownerName)
        ? addGroup(
            ownerName,
            `${ownerType}.${ownerName}`,
            namespaceGroup ? namespaceGroup : hostGroup,
            namespaceGroup === undefined
          )
        : undefined;

    const parent = ownerGroup ? ownerGroup : namespaceGroup ? namespaceGroup : hostGroup;
    switch (metricScope) {
      case MetricScopeOptions.HOST:
        return addNode(
          _.isEmpty(host)
            ? //metrics without host will be grouped as 'External'
              { displayName: t('External') }
            : //valid metrics will be Nodes with ips
              { type: 'Node', name: host, canStepInto: true },
          parent
        );
      case MetricScopeOptions.NAMESPACE:
        return addNode(
          _.isEmpty(namespace)
            ? //metrics without namespace will be grouped as 'Unknown'
              { displayName: t('Unknown') }
            : //valid metrics will be Namespaces with namespace as name + host infos
              { type: 'Namespace', name: namespace, host, canStepInto: true },
          parent
        );
      case MetricScopeOptions.OWNER:
        return addNode(
          _.isEmpty(ownerName)
            ? //metrics without owner name will be grouped as 'Unknown'
              { displayName: t('Unknown') }
            : //valid metrics will be owner type & name + namespace & host infos
              { namespace, type: ownerType, name: ownerName, host, canStepInto: true },
          parent
        );
      case MetricScopeOptions.RESOURCE:
      default:
        return addNode(
          {
            namespace,
            type,
            name,
            addr,
            host
          },
          parent
        );
    }
  }

  datas.forEach(d => {
    const srcNode = manageNode('Src', d);
    const dstNode = manageNode('Dst', d);

    if (options.edges && srcNode && dstNode && srcNode.id !== dstNode.id) {
      addEdge(srcNode.id, dstNode.id, d.total, srcNode.data.shadowed || dstNode.data.shadowed);
    }
  });

  //remove empty groups
  nodes = nodes.filter(n => n.type !== 'group' || (n.children && n.children.length));
  return { nodes, edges };
};
