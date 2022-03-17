import {
  ComponentFactory,
  ContextMenuItem,
  GraphComponent,
  graphDropTargetSpec,
  GraphElement,
  groupDropTargetSpec,
  ModelKind,
  nodeDragSourceSpec,
  NODE_DRAG_TYPE,
  withContextMenu,
  withDndDrop,
  withDragNode,
  withPanZoom,
  withSelection
} from '@patternfly/react-topology';
import * as React from 'react';
import { StyleEdge } from '../styles/styleEdge';
import { StyleGroup } from '../styles/styleGroup';
import { StyleNode } from '../styles/styleNode';

const contextMenuItem = (label: string): React.ReactElement => {
  return (
    <ContextMenuItem key={label} onClick={() => alert(`Selected: ${label}`)}>
      {label}
    </ContextMenuItem>
  );
};

const createContextMenuItems = (...labels: string[]): React.ReactElement[] => labels.map(contextMenuItem);

//TODO: implement context menu
const defaultMenu = createContextMenuItems('TODO');

export const stylesComponentFactory: ComponentFactory = (
  kind: ModelKind,
  type: string
): React.ComponentType<{ element: GraphElement }> | undefined => {
  if (kind === ModelKind.graph) {
    return withDndDrop(graphDropTargetSpec([NODE_DRAG_TYPE]))(withPanZoom()(GraphComponent));
  }
  switch (type) {
    case 'node':
      return withContextMenu(() => defaultMenu)(
        withDragNode(nodeDragSourceSpec('node', true, true))(withSelection()(StyleNode))
      );
    case 'group':
      return withDndDrop(groupDropTargetSpec)(withContextMenu(() => defaultMenu)(withSelection()(StyleGroup)));
    case 'edge':
      return withContextMenu(() => defaultMenu)(withSelection()(StyleEdge));
    default:
      return undefined;
  }
};

export default stylesComponentFactory;
