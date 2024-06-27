import { ComponentFactory, DefaultNode, ModelKind } from '@patternfly/react-topology';
import { ComponentType } from 'react';
import { GraphElementPeer } from '../../../../../model/topology';

export const shapesComponentFactory: ComponentFactory = (
  kind: ModelKind,
  type: string
): ComponentType<{ element: GraphElementPeer }> | undefined => {
  switch (type) {
    //TODO: try different shapes by Owner Kind for example
    case 'node':
      return DefaultNode;
    default:
      return undefined;
  }
};

export default shapesComponentFactory;
