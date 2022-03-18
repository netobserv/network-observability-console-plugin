import { DEFAULT_TIME_RANGE } from '../utils/router';

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
