import { ComponentType } from 'react';
import { GraphElement, ComponentFactory, ModelKind, DefaultNode } from '@patternfly/react-topology';

const shapesComponentFactory: ComponentFactory = (
  kind: ModelKind,
  type: string
): ComponentType<{ element: GraphElement }> | undefined => {
  switch (type) {
    //TODO: try different shapes by Owner Kind for example
    case 'node':
      return DefaultNode;
    default:
      return undefined;
  }
};

export default shapesComponentFactory;
