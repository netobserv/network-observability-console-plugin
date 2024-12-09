import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { ContextMenu, Decorator, DEFAULT_DECORATOR_RADIUS as defaultDecoratorRadius } from '@patternfly/react-topology';
import * as React from 'react';

type Reference = React.ComponentProps<typeof ContextMenu>['reference'];

type ClickableDecoratorProps = {
  pos: { x: number; y: number };
  icon: React.ReactElement;
  tooltip: string;
  isActive: boolean;
  onClick: (event: React.MouseEvent<SVGGElement, MouseEvent>) => void;
  padding?: number;
};

export const ClickableDecorator: React.FC<ClickableDecoratorProps> = ({
  pos,
  icon,
  tooltip,
  isActive,
  onClick,
  padding
}) => {
  const ref = React.useRef<SVGGElement>(null);

  return (
    <>
      <Decorator
        x={pos.x}
        y={pos.y}
        radius={defaultDecoratorRadius}
        padding={padding}
        showBackground
        icon={icon}
        className={isActive ? 'selected-decorator' : ''}
        onClick={onClick}
        innerRef={ref}
      />
      <Tooltip content={tooltip} position={TooltipPosition.right} triggerRef={ref} />
    </>
  );
};

type ContextMenuDecoratorProps = Omit<ClickableDecoratorProps, 'onClick'> & {
  menuItems: React.ReactElement[];
};

export const ContextMenuDecorator: React.FC<ContextMenuDecoratorProps> = props => {
  const [reference, setReference] = React.useState<Reference | null>(null);
  const onContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setReference({ x: e.pageX, y: e.pageY });
  }, []);

  return (
    <>
      <ClickableDecorator {...props} onClick={onContextMenu} />
      {reference ? (
        <ContextMenu reference={reference} open onRequestClose={() => setReference(null)}>
          {props.menuItems}
        </ContextMenu>
      ) : null}
    </>
  );
};
