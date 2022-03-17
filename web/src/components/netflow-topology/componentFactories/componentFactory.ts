import {
  ComponentFactory,
  DefaultEdge,
  DefaultGroup,
  DefaultNode,
  GraphComponent,
  GraphElement,
  ModelKind
} from '@patternfly/react-topology';
import { ComponentType } from 'react';

export const componentFactory: ComponentFactory = (
  kind: ModelKind,
  type: string
): ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    case 'group':
      return DefaultGroup;
    default:
      switch (kind) {
        case ModelKind.graph:
          return GraphComponent;
        case ModelKind.node:
          return DefaultNode;
        case ModelKind.edge:
          return DefaultEdge;
        default:
          return undefined;
      }
  }
};

export default componentFactory;
