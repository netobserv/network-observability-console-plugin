import {
  Graph,
  Layout,
  LayoutFactory,
  ForceLayout,
  ColaLayout,
  DagreLayout,
  GridLayout,
  ConcentricLayout
} from '@patternfly/react-topology';
import { LayoutName } from '../../../model/topology';

const layoutFactory: LayoutFactory = (type: LayoutName, graph: Graph): Layout | undefined => {
  switch (type) {
    case 'Cola':
      return new ColaLayout(graph);
    case 'ColaNoForce':
      return new ColaLayout(graph, { layoutOnDrag: false });
    case 'Concentric':
      return new ConcentricLayout(graph);
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
