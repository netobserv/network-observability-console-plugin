import {
  Graph,
  Layout,
  LayoutFactory,
  ForceLayout,
  ColaLayout,
  DagreLayout,
  GridLayout
} from '@patternfly/react-topology';
import { LayoutName } from '../../../model/topology';

export const layoutFactory: LayoutFactory = (type: LayoutName, graph: Graph): Layout | undefined => {
  switch (type) {
    case 'ColaNoForce':
      return new ColaLayout(graph, { layoutOnDrag: false });
    case 'Dagre':
      return new DagreLayout(graph);
    case 'Force':
      return new ForceLayout(graph);
    case 'Grid':
      return new GridLayout(graph);
    default:
      return new ColaLayout(graph, { layoutOnDrag: false });
  }
};

export default layoutFactory;
