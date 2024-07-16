import { css } from '@patternfly/react-styles';
import {
  DefaultConnectorTerminal,
  Edge,
  EdgeTerminalType,
  getEdgeAnimationDuration,
  getEdgeStyleClassModifier,
  Layer,
  NodeStatus,
  observer,
  Point,
  TOP_LAYER as topLayer,
  useHover,
  WithContextMenuProps,
  WithRemoveConnectorProps,
  WithSelectionProps,
  WithSourceDragProps,
  WithTargetDragProps
} from '@patternfly/react-topology';
import DefaultConnectorTag from '@patternfly/react-topology/dist/esm/components/edges/DefaultConnectorTag';
import { getConnectorStartPoint } from '@patternfly/react-topology/dist/esm/components/edges/terminals/terminalUtils';
import styles from '@patternfly/react-topology/src/css/topology-components';
import * as _ from 'lodash';
import * as React from 'react';

import { hoverEvent } from '../topology-content';

type BaseEdgeProps = {
  children?: React.ReactNode;
  element: Edge;
  dragging?: boolean;
  className?: string;
  animationDuration?: number;
  startTerminalType?: EdgeTerminalType;
  startTerminalClass?: string;
  startTerminalStatus?: NodeStatus;
  startTerminalSize?: number;
  endTerminalType?: EdgeTerminalType;
  endTerminalClass?: string;
  endTerminalStatus?: NodeStatus;
  endTerminalSize?: number;
  shadowed?: boolean;
  filtered?: boolean;
  drops?: number;
  highlighted?: boolean;
  isDark?: boolean;
  tag?: string;
  tagClass?: string;
  tagStatus?: NodeStatus;
} & Partial<
  WithRemoveConnectorProps & WithSourceDragProps & WithTargetDragProps & WithSelectionProps & WithContextMenuProps
>;

// BaseEdge: slightly modified from @patternfly/react-topology/src/components/edges/DefaultEdge.tsx
// to support shadow / hover behaviors

const BaseEdge: React.FC<BaseEdgeProps> = ({
  element,
  dragging,
  sourceDragRef,
  targetDragRef,
  animationDuration,
  onShowRemoveConnector,
  onHideRemoveConnector,
  startTerminalType = EdgeTerminalType.none,
  startTerminalClass,
  startTerminalStatus,
  startTerminalSize = 14,
  endTerminalType = EdgeTerminalType.directional,
  endTerminalClass,
  endTerminalStatus,
  endTerminalSize = 14,
  shadowed,
  filtered,
  drops,
  highlighted,
  isDark,
  tag,
  tagClass,
  tagStatus,
  children,
  className,
  selected,
  onSelect,
  onContextMenu
}) => {
  const [hover, hoverRef] = useHover();
  const startPoint = element.getStartPoint();
  const endPoint = element.getEndPoint();

  React.useLayoutEffect(() => {
    if (hover && !dragging) {
      onShowRemoveConnector && onShowRemoveConnector();
    } else {
      onHideRemoveConnector && onHideRemoveConnector();
    }
    element.getController().fireEvent(hoverEvent, {
      ...element.getData(),
      id: element.getId(),
      isHovered: hover
    });
  }, [hover, dragging, onShowRemoveConnector, onHideRemoveConnector, element]);

  const groupClassName = css(
    styles.topologyEdge,
    className,
    hover && 'pf-m-hover',
    dragging && 'pf-m-dragging',
    selected && 'pf-m-selected',
    'topology',
    shadowed && 'shadowed',
    filtered && 'edge-filtered',
    drops && 'edge-has-drops',
    highlighted && 'edge-highlighted',
    isDark && 'dark'
  );

  const edgeAnimationDuration = animationDuration ?? getEdgeAnimationDuration(element.getEdgeAnimationSpeed());
  const linkClassName = css(styles.topologyEdgeLink, getEdgeStyleClassModifier(element.getEdgeStyle()));

  const bendpoints = element.getBendpoints();

  const d = `M${startPoint.x} ${startPoint.y} ${bendpoints.map((b: Point) => `L${b.x} ${b.y} `).join('')}L${
    endPoint.x
  } ${endPoint.y}`;

  const bgStartPoint =
    !startTerminalType || startTerminalType === EdgeTerminalType.none
      ? [startPoint.x, startPoint.y]
      : getConnectorStartPoint(_.head(bendpoints) || endPoint, startPoint, startTerminalSize);
  const bgEndPoint =
    !endTerminalType || endTerminalType === EdgeTerminalType.none
      ? [endPoint.x, endPoint.y]
      : getConnectorStartPoint(_.last(bendpoints) || startPoint, endPoint, endTerminalSize);
  const backgroundPath = `M${bgStartPoint[0]} ${bgStartPoint[1]} ${bendpoints
    .map((b: Point) => `L${b.x} ${b.y} `)
    .join('')}L${bgEndPoint[0]} ${bgEndPoint[1]}`;

  return (
    <Layer id={dragging ? topLayer : undefined}>
      <g
        ref={hoverRef as React.LegacyRef<SVGGElement> | undefined}
        data-test-id="edge-handler"
        className={groupClassName}
        onClick={onSelect}
        onContextMenu={onContextMenu}
      >
        <path
          className={css(styles.topologyEdgeBackground)}
          d={backgroundPath}
          onMouseEnter={onShowRemoveConnector}
          onMouseLeave={onHideRemoveConnector}
        />
        <path className={linkClassName} d={d} style={{ animationDuration: `${edgeAnimationDuration}s` }} />
        {tag && (
          <DefaultConnectorTag
            className={tagClass}
            startPoint={element.getStartPoint()}
            endPoint={element.getEndPoint()}
            tag={tag}
            status={tagStatus}
          />
        )}
        <DefaultConnectorTerminal
          className={startTerminalClass}
          isTarget={false}
          edge={element}
          size={startTerminalSize}
          dragRef={sourceDragRef}
          terminalType={startTerminalType}
          status={startTerminalStatus}
          highlight={dragging || hover || highlighted}
        />
        <DefaultConnectorTerminal
          className={endTerminalClass}
          isTarget
          dragRef={targetDragRef}
          edge={element}
          size={endTerminalSize}
          terminalType={endTerminalType}
          status={endTerminalStatus}
          highlight={dragging || hover || highlighted}
        />
        {children}
      </g>
    </Layer>
  );
};

export default observer(BaseEdge);
