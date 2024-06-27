import {
  ClusterIcon,
  CubeIcon,
  CubesIcon,
  OutlinedHddIcon,
  QuestionCircleIcon,
  ServiceIcon,
  UsersIcon,
  ZoneIcon
} from '@patternfly/react-icons';
import {
  DEFAULT_LAYER as defaultLayer,
  Layer,
  Node,
  NodeModel,
  NodeShape,
  observer,
  ScaleDetailsLevel,
  ShapeProps,
  TopologyQuadrant,
  TOP_LAYER as topLayer,
  useHover,
  WithDragNodeProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import * as _ from 'lodash';
import * as React from 'react';
import { Decorated, NodeData } from '../../../../model/topology';
import BaseNode from '../components/node';
import { NodeDecorators } from './styleDecorators';

export enum DataTypes {
  Default
}
const iconPadding = 20;

type NodePeer = Node<NodeModel, Decorated<NodeData>>;

type StyleNodeProps = {
  element: NodePeer;
  getCustomShape?: (node: Node) => React.FC<ShapeProps>;
  getShapeDecoratorCenter?: (quadrant: TopologyQuadrant, node: NodePeer, radius?: number) => { x: number; y: number };
  showLabel?: boolean;
  showStatusDecorator?: boolean;
  regrouping?: boolean;
  dragging?: boolean;
} & WithDragNodeProps &
  WithSelectionProps;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTypeIcon = (resourceKind?: string): React.ComponentClass<any, any> => {
  switch (resourceKind) {
    case 'Service':
      return ServiceIcon;
    case 'Pod':
      return CubeIcon;
    case 'Namespace':
      return UsersIcon;
    case 'Node':
      return OutlinedHddIcon;
    case 'Cluster':
      return ClusterIcon;
    case 'Zone':
      return ZoneIcon;
    case 'CatalogSource':
    case 'DaemonSet':
    case 'Deployment':
    case 'StatefulSet':
    case 'Job':
      return CubesIcon;
    default:
      return QuestionCircleIcon;
  }
};

const renderIcon = (data: Decorated<NodeData>, element: NodePeer): React.ReactNode => {
  const { width, height } = element.getDimensions();
  const shape = element.getNodeShape();
  const iconSize =
    (shape === NodeShape.trapezoid ? width : Math.min(width, height)) -
    (shape === NodeShape.stadium ? 5 : iconPadding) * 2;
  const Component = getTypeIcon(data.peer.resourceKind);

  return (
    <g transform={`translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2})`}>
      <Component width={iconSize} height={iconSize} />
    </g>
  );
};

const StyleNode: React.FC<StyleNodeProps> = ({
  element,
  showLabel,
  dragging,
  regrouping,
  getShapeDecoratorCenter,
  ...rest
}) => {
  const data = element.getData() as Decorated<NodeData> | undefined;
  //TODO: check if we can have intelligent pin on view change
  const [isPinned, setPinned] = React.useState<boolean>(data?.isPinned === true);
  const [isSrcFiltered, setSrcFiltered] = React.useState<boolean>(data?.isSrcFiltered === true);
  const [isDstFiltered, setDstFiltered] = React.useState<boolean>(data?.isDstFiltered === true);
  const detailsLevel = useDetailsLevel();
  const [hover, hoverRef] = useHover();

  const passedData = React.useMemo(() => {
    return _.omitBy(data, _.isUndefined) as Decorated<NodeData> | undefined;
  }, [data]);

  React.useEffect(() => {
    setSrcFiltered(data?.isSrcFiltered === true);
    setDstFiltered(data?.isDstFiltered === true);
  }, [data?.isSrcFiltered, data?.isDstFiltered]);

  if (!data || !passedData) {
    return null;
  }

  const updatedRest = { ...rest };
  if (isPinned) {
    //check if position has changed = controller reset element and is not pinned anymore
    if (element.getPosition() !== data.point) {
      setPinned(false);
    } else {
      updatedRest.dragNodeRef = undefined;
    }
  }

  return (
    <Layer id={passedData.dragging ? topLayer : defaultLayer}>
      <g ref={hoverRef as never}>
        <BaseNode
          className="netobserv"
          element={element}
          scaleLabel={detailsLevel !== ScaleDetailsLevel.high}
          scaleNode={hover && detailsLevel === ScaleDetailsLevel.low}
          {...updatedRest}
          {...passedData}
          dragging={isPinned ? false : dragging}
          regrouping={isPinned ? false : regrouping}
          showLabel={hover || (detailsLevel === ScaleDetailsLevel.high && showLabel)}
          showStatusBackground={detailsLevel === ScaleDetailsLevel.low}
          showStatusDecorator={detailsLevel === ScaleDetailsLevel.high && passedData.showStatusDecorator}
          attachments={
            (hover || detailsLevel === ScaleDetailsLevel.high) && (
              <NodeDecorators
                element={element}
                data={data}
                isPinned={isPinned}
                setPinned={setPinned}
                isSrcFiltered={isSrcFiltered}
                setSrcFiltered={setSrcFiltered}
                isDstFiltered={isDstFiltered}
                setDstFiltered={setDstFiltered}
                getShapeDecoratorCenter={getShapeDecoratorCenter}
              />
            )
          }
        >
          {(hover || detailsLevel !== ScaleDetailsLevel.low) && renderIcon(passedData, element)}
        </BaseNode>
      </g>
    </Layer>
  );
};

export default observer(StyleNode);
