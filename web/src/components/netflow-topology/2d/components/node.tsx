import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import CheckCircleIcon from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import ExclamationTriangleIcon from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { css } from '@patternfly/react-styles';
import {
  BadgeLocation,
  createSvgIdUrl,
  Decorator,
  DEFAULT_DECORATOR_RADIUS as defaultDecoratorRadius,
  getDefaultShapeDecoratorCenter,
  getShapeComponent,
  LabelPosition,
  Node,
  NodeLabel,
  NodeShadows,
  NodeStatus,
  observer,
  ShapeProps,
  StatusModifier,
  TopologyQuadrant,
  useHover,
  WithContextMenuProps,
  WithCreateConnectorProps,
  WithDndDragProps,
  WithDndDropProps,
  WithDragNodeProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import {
  NODE_SHADOW_FILTER_ID_DANGER as nodeShadowFilterIdDanger,
  NODE_SHADOW_FILTER_ID_HOVER as nodeShadowFilterIdHover
} from '@patternfly/react-topology/dist/esm/components/nodes/NodeShadows';
import styles from '@patternfly/react-topology/src/css/topology-components';
import * as React from 'react';
import { GraphElementPeer } from '../../../../model/topology';
import { hoverEvent } from '../topology-content';

const StatusQuadrant = TopologyQuadrant.upperLeft;

const getStatusIcon = (status: NodeStatus) => {
  switch (status) {
    case NodeStatus.danger:
      return <ExclamationCircleIcon className="pf-m-danger" />;
    case NodeStatus.warning:
      return <ExclamationTriangleIcon className="pf-m-warning" />;
    case NodeStatus.success:
      return <CheckCircleIcon className="pf-m-success" />;
    default:
      return null;
  }
};

type BaseNodeProps = {
  children?: React.ReactNode;
  className?: string;
  element: Node;
  droppable?: boolean;
  hover?: boolean;
  canDrop?: boolean;
  dragging?: boolean;
  edgeDragging?: boolean;
  dropTarget?: boolean;
  scaleNode?: boolean; // Whether or not to scale the node, best on hover of node at lowest scale level
  shadowed?: boolean;
  filtered?: boolean;
  highlighted?: boolean;
  isDark?: boolean;
  label?: string; // Defaults to element.getLabel()
  secondaryLabel?: string;
  showLabel?: boolean; // Defaults to true
  labelClassName?: string;
  scaleLabel?: boolean; // Whether or not to scale the label, best at lower scale levels
  labelPosition?: LabelPosition; // Defaults to element.getLabelPosition()
  truncateLength?: number; // Defaults to 13
  labelIconClass?: string; // Icon to show in label
  labelIcon?: React.ReactNode;
  labelIconPadding?: number;
  regrouping?: boolean;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  badgeBorderColor?: string;
  badgeClassName?: string;
  badgeLocation?: BadgeLocation;
  attachments?: React.ReactNode; // ie. decorators
  nodeStatus?: NodeStatus; // Defaults to element.getNodeStatus()
  showStatusBackground?: boolean;
  showStatusDecorator?: boolean;
  statusDecoratorTooltip?: React.ReactNode;
  onStatusDecoratorClick?: (event: React.MouseEvent<SVGGElement, MouseEvent>, element: GraphElementPeer) => void;
  getCustomShape?: (node: Node) => React.FC<ShapeProps>;
  getShapeDecoratorCenter?: (quadrant: TopologyQuadrant, node: Node) => { x: number; y: number };
} & Partial<
  WithSelectionProps &
    WithDragNodeProps &
    WithDndDragProps &
    WithDndDropProps &
    WithCreateConnectorProps &
    WithContextMenuProps
>;

const scaleUpTime = 200;

// BaseNode: slightly modified from @patternfly/react-topology/src/components/nodes/DefaultNode.tsx
// to support shadow / hover behaviors

const BaseNode: React.FunctionComponent<BaseNodeProps> = ({
  className,
  element,
  selected,
  hover,
  scaleNode,
  showLabel = true,
  label,
  shadowed,
  filtered,
  highlighted,
  isDark,
  secondaryLabel,
  labelClassName,
  labelPosition,
  scaleLabel,
  truncateLength,
  labelIconClass,
  labelIcon,
  labelIconPadding,
  nodeStatus,
  showStatusBackground,
  showStatusDecorator = false,
  statusDecoratorTooltip,
  getCustomShape,
  getShapeDecoratorCenter,
  onStatusDecoratorClick,
  badge,
  badgeColor,
  badgeTextColor,
  badgeBorderColor,
  badgeClassName,
  badgeLocation,
  onSelect,
  children,
  attachments,
  dragNodeRef,
  dragging,
  edgeDragging,
  canDrop,
  dropTarget,
  dndDropRef,
  onHideCreateConnector,
  onShowCreateConnector,
  onContextMenu,
  contextMenuOpen
}) => {
  const [hovered, hoverRef] = useHover();
  const status = nodeStatus || element.getNodeStatus();
  const { width, height } = element.getDimensions();
  const isHover = hover !== undefined ? hover : hovered;
  const [nodeScale, setNodeScale] = React.useState<number>(1);

  const statusDecorator = React.useMemo(() => {
    if (!status || !showStatusDecorator) {
      return null;
    }

    const icon = getStatusIcon(status);
    if (!icon) {
      return null;
    }

    const { x, y } = getShapeDecoratorCenter
      ? getShapeDecoratorCenter(StatusQuadrant, element)
      : getDefaultShapeDecoratorCenter(StatusQuadrant, element);

    const decorator = (
      <Decorator
        x={x}
        y={y}
        radius={defaultDecoratorRadius}
        showBackground={false}
        onClick={e => onStatusDecoratorClick && onStatusDecoratorClick(e, element)}
        icon={<g className={css(styles.topologyNodeDecoratorStatus)}>{icon}</g>}
      />
    );

    if (statusDecoratorTooltip) {
      return (
        <Tooltip content={statusDecoratorTooltip} position={TooltipPosition.left}>
          {decorator}
        </Tooltip>
      );
    }

    return decorator;
  }, [showStatusDecorator, status, getShapeDecoratorCenter, element, statusDecoratorTooltip, onStatusDecoratorClick]);

  React.useEffect(() => {
    if (isHover) {
      onShowCreateConnector && onShowCreateConnector();
    } else {
      onHideCreateConnector && onHideCreateConnector();
    }
    element.getController().fireEvent(hoverEvent, {
      ...element.getData(),
      id: element.getId(),
      isHovered: isHover
    });
  }, [isHover, onShowCreateConnector, onHideCreateConnector, element]);

  const ShapeComponent = (getCustomShape && getCustomShape(element)) || getShapeComponent(element);

  const groupClassName = css(
    styles.topologyNode,
    className,
    isHover && 'pf-m-hover',
    (dragging || edgeDragging) && 'pf-m-dragging',
    canDrop && 'pf-m-highlight',
    canDrop && dropTarget && 'pf-m-drop-target',
    selected && 'pf-m-selected',
    StatusModifier[status],
    'topology',
    shadowed && 'shadowed',
    filtered && 'node-filtered',
    highlighted && 'node-highlighted',
    isDark && 'dark'
  );

  const backgroundClassName = css(
    styles.topologyNodeBackground,
    showStatusBackground && StatusModifier[status],
    showStatusBackground && selected && 'pf-m-selected'
  );

  let filter;
  if (status === 'danger') {
    filter = createSvgIdUrl(nodeShadowFilterIdDanger);
  } else if (isHover || dragging || edgeDragging || dropTarget) {
    filter = createSvgIdUrl(nodeShadowFilterIdHover);
  }

  const nodeLabelPosition = labelPosition || element.getLabelPosition();
  const scale = element.getGraph().getScale();

  const animationRef = React.useRef<number>();
  const scaleGoal = React.useRef<number>(1);
  const nodeScaled = React.useRef<boolean>(false);

  React.useEffect(() => {
    if (!scaleNode || scale >= 1) {
      setNodeScale(1);
      nodeScaled.current = false;
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    } else {
      scaleGoal.current = 1 / scale;
      const scaleDelta = scaleGoal.current - scale;
      const initTime = performance.now();

      const bumpScale = (bumpTime: number) => {
        const scalePercent = (bumpTime - initTime) / scaleUpTime;
        const nextScale = Math.min(scale + scaleDelta * scalePercent, scaleGoal.current);
        setNodeScale(nextScale);
        if (nextScale < scaleGoal.current) {
          animationRef.current = window.requestAnimationFrame(bumpScale);
        } else {
          nodeScaled.current = true;
          animationRef.current = 0;
        }
      };

      if (nodeScaled.current) {
        setNodeScale(scaleGoal.current);
      } else if (!animationRef.current) {
        animationRef.current = window.requestAnimationFrame(bumpScale);
      }
    }
    return () => {
      if (animationRef.current) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = 0;
      }
    };
  }, [scale, scaleNode]);

  const labelScale = scaleLabel && !scaleNode ? Math.max(1, 1 / scale) : 1;
  const labelPositionScale = scaleLabel && !scaleNode ? Math.min(1, scale) : 1;

  const { translateX, translateY } = React.useMemo(() => {
    if (!scaleNode) {
      return { translateX: 0, translateY: 0 };
    }
    const bounds = element.getBounds();
    const translateX = bounds.width / 2 - (bounds.width / 2) * nodeScale;
    const translateY = bounds.height / 2 - (bounds.height / 2) * nodeScale;

    return { translateX, translateY };
  }, [element, nodeScale, scaleNode]);

  return (
    <g
      ref={hoverRef as React.LegacyRef<SVGGElement> | undefined}
      className={groupClassName}
      transform={`${scaleNode ? `translate(${translateX}, ${translateY})` : ''} scale(${nodeScale})`}
    >
      <NodeShadows />
      <g ref={dragNodeRef} onClick={onSelect} onContextMenu={onContextMenu}>
        {ShapeComponent && (
          <ShapeComponent
            className={backgroundClassName}
            element={element}
            width={width}
            height={height}
            dndDropRef={dndDropRef}
            filter={filter}
          />
        )}
        {showLabel && (label || element.getLabel()) && (
          <g transform={`scale(${labelScale})`}>
            <NodeLabel
              className={css(styles.topologyNodeLabel, labelClassName)}
              x={(nodeLabelPosition === LabelPosition.right ? width + 8 : width / 2) * labelPositionScale}
              y={(nodeLabelPosition === LabelPosition.right ? height / 2 : height + 6) * labelPositionScale}
              position={nodeLabelPosition}
              paddingX={8}
              paddingY={4}
              secondaryLabel={secondaryLabel}
              truncateLength={truncateLength}
              status={status}
              badge={badge}
              badgeColor={badgeColor}
              badgeTextColor={badgeTextColor}
              badgeBorderColor={badgeBorderColor}
              badgeClassName={badgeClassName}
              badgeLocation={badgeLocation}
              onContextMenu={onContextMenu}
              contextMenuOpen={contextMenuOpen}
              hover={isHover}
              labelIconClass={labelIconClass}
              labelIcon={labelIcon}
              labelIconPadding={labelIconPadding}
            >
              {label || element.getLabel()}
            </NodeLabel>
          </g>
        )}
        {children}
      </g>
      {statusDecorator}
      {
        //isHover &&
        attachments
      }
    </g>
  );
};

export default observer(BaseNode);
