import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import {
  CubeIcon,
  CubesIcon,
  FilterIcon,
  LevelDownAltIcon,
  OutlinedHddIcon,
  QuestionCircleIcon,
  ServiceIcon,
  ThumbtackIcon,
  TimesIcon,
  UsersIcon
} from '@patternfly/react-icons';
import {
  Decorator,
  DEFAULT_DECORATOR_PADDING,
  DEFAULT_DECORATOR_RADIUS,
  DEFAULT_LAYER,
  getDefaultShapeDecoratorCenter,
  Layer,
  Node,
  NodeModel,
  NodeShape,
  observer,
  ScaleDetailsLevel,
  ShapeProps,
  TopologyQuadrant,
  TOP_LAYER,
  useHover,
  WithDragNodeProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Decorated, NodeData } from '../../../model/topology';
import BaseNode from '../components/node';

export const FILTER_EVENT = 'filter';
export const STEP_INTO_EVENT = 'step_into';
export enum DataTypes {
  Default
}
const ICON_PADDING = 20;
const MEDIUM_DECORATOR_PADDING = 5;
const LARGE_DECORATOR_PADDING = 6;

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

const getTypeIconColor = (resourceKind?: string): string => {
  switch (resourceKind) {
    case 'Service':
    case 'Pod':
    case 'Namespace':
    case 'Node':
    case 'CatalogSource':
    case 'DaemonSet':
    case 'Deployment':
    case 'StatefulSet':
    case 'Job':
      return '#393F44';
    default:
      return '#c9190b';
  }
};

const renderIcon = (data: Decorated<NodeData>, element: NodePeer): React.ReactNode => {
  const { width, height } = element.getDimensions();
  const shape = element.getNodeShape();
  const iconSize =
    (shape === NodeShape.trapezoid ? width : Math.min(width, height)) -
    (shape === NodeShape.stadium ? 5 : ICON_PADDING) * 2;
  const Component = getTypeIcon(data.resourceKind);
  const color = getTypeIconColor(data.resourceKind);

  return (
    <g transform={`translate(${(width - iconSize) / 2}, ${(height - iconSize) / 2})`}>
      <Component style={{ fill: color }} width={iconSize} height={iconSize} />
    </g>
  );
};

const renderClickableDecorator = (
  t: TFunction,
  element: NodePeer,
  quadrant: TopologyQuadrant,
  icon: React.ReactNode,
  tooltip: string,
  isActive: boolean,
  onClick: (element: NodePeer) => void,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: NodePeer,
    radius?: number
  ) => {
    x: number;
    y: number;
  },
  padding?: number
): React.ReactNode => {
  const { x, y } = getShapeDecoratorCenter
    ? getShapeDecoratorCenter(quadrant, element)
    : getDefaultShapeDecoratorCenter(quadrant, element);

  return (
    <Tooltip content={tooltip} position={TooltipPosition.right}>
      <Decorator
        x={x}
        y={y}
        radius={DEFAULT_DECORATOR_RADIUS}
        padding={padding}
        showBackground
        icon={icon}
        className={isActive ? 'selected-decorator' : ''}
        onClick={() => onClick(element)}
      />
    </Tooltip>
  );
};

const renderDecorators = (
  t: TFunction,
  element: NodePeer,
  data: Decorated<NodeData>,
  isPinned: boolean,
  setPinned: (v: boolean) => void,
  isFiltered: boolean,
  setFiltered: (v: boolean) => void,
  getShapeDecoratorCenter?: (
    quadrant: TopologyQuadrant,
    node: NodePeer,
    radius?: number
  ) => {
    x: number;
    y: number;
  }
): React.ReactNode => {
  if (!data.showDecorators) {
    return null;
  }

  const onPinClick = () => {
    const updatedIsPinned = !isPinned;
    data.point = element.getPosition();
    data.isPinned = updatedIsPinned;
    //override setPosition when pinned
    if (updatedIsPinned) {
      data.setPosition = element.setPosition;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      element.setPosition = p => {
        /*nothing to do there*/
      };
    } else {
      element.setPosition = data.setPosition!;
      data.setPosition = undefined;
    }
    element.setData(data);
    setPinned(updatedIsPinned);
  };

  const onFilterClick = () => {
    const updatedIsFiltered = !isFiltered;
    element.getController().fireEvent(FILTER_EVENT, {
      ...data,
      id: element.getId(),
      isFiltered: updatedIsFiltered
    });
    setFiltered(updatedIsFiltered);
  };

  const onStepIntoClick = () => {
    element.getController().fireEvent(STEP_INTO_EVENT, {
      ...data,
      id: element.getId()
    });
  };

  return (
    <>
      {data.canStepInto &&
        renderClickableDecorator(
          t,
          element,
          TopologyQuadrant.lowerRight,
          <LevelDownAltIcon />,
          t('Step into this {{name}}', { name: data.resourceKind?.toLowerCase() }),
          false,
          onStepIntoClick,
          getShapeDecoratorCenter,
          MEDIUM_DECORATOR_PADDING
        )}
      {(data.namespace || data.name || data.addr || data.host) &&
        renderClickableDecorator(
          t,
          element,
          TopologyQuadrant.lowerLeft,
          isFiltered ? <TimesIcon /> : <FilterIcon />,
          isFiltered
            ? t('Remove {{name}} filter', { name: data.resourceKind?.toLowerCase() })
            : t('Add {{name}} filter', { name: data.resourceKind?.toLowerCase() }),
          isFiltered,
          onFilterClick,
          getShapeDecoratorCenter,
          isFiltered ? DEFAULT_DECORATOR_PADDING : LARGE_DECORATOR_PADDING
        )}
      {renderClickableDecorator(
        t,
        element,
        TopologyQuadrant.upperRight,
        <ThumbtackIcon />,
        isPinned ? t('Unpin this element') : t('Pin this element'),
        isPinned,
        onPinClick,
        getShapeDecoratorCenter,
        MEDIUM_DECORATOR_PADDING
      )}
    </>
  );
};

const StyleNode: React.FC<StyleNodeProps> = ({ element, showLabel, dragging, regrouping, ...rest }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData() as Decorated<NodeData> | undefined;
  //TODO: check if we can have intelligent pin on view change
  const [isPinned, setPinned] = React.useState<boolean>(data?.isPinned === true);
  const [isFiltered, setFiltered] = React.useState<boolean>(data?.isFiltered === true);
  const detailsLevel = useDetailsLevel();
  const [hover, hoverRef] = useHover();

  const passedData = React.useMemo(() => {
    return _.omitBy(data, _.isUndefined) as Decorated<NodeData> | undefined;
  }, [data]);

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
    <Layer id={passedData.dragging || hover || passedData.hover || passedData.highlighted ? TOP_LAYER : DEFAULT_LAYER}>
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
            (hover || detailsLevel === ScaleDetailsLevel.high) &&
            renderDecorators(
              t,
              element,
              data,
              isPinned,
              setPinned,
              isFiltered,
              setFiltered,
              rest.getShapeDecoratorCenter
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
