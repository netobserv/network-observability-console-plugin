import * as React from 'react';
import {
  DefaultGroup,
  Node,
  observer,
  ScaleDetailsLevel,
  ShapeProps,
  WithContextMenuProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import { CubesIcon } from '@patternfly/react-icons';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';

const ICON_PADDING = 20;

export enum DataTypes {
  Default
}

type StyleGroupProps = {
  element: Node;
  collapsible: boolean;
  collapsedWidth?: number;
  collapsedHeight?: number;
  onCollapseChange?: (group: Node, collapsed: boolean) => void;
  getCollapsedShape?: (node: Node) => React.FC<ShapeProps>;
  collapsedShadowOffset?: number; // defaults to 10
} & WithContextMenuProps &
  WithSelectionProps;

const StyleGroup: React.FC<StyleGroupProps> = ({
  element,
  onContextMenu,
  contextMenuOpen,
  collapsedWidth = 75,
  collapsedHeight = 75,
  ...rest
}) => {
  const data = element.getData();
  const detailsLevel = useDetailsLevel();

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach(key => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  const renderIcon = (): React.ReactNode => {
    const iconSize = Math.min(collapsedWidth, collapsedHeight) - ICON_PADDING * 2;
    const Component = CubesIcon;

    return (
      <g transform={`translate(${(collapsedWidth - iconSize) / 2}, ${(collapsedHeight - iconSize) / 2})`}>
        <Component style={{ color: '#393F44' }} width={iconSize} height={iconSize} />
      </g>
    );
  };

  return (
    <DefaultGroup
      onContextMenu={data.showContextMenu ? onContextMenu : undefined}
      contextMenuOpen={contextMenuOpen}
      element={element}
      collapsedWidth={collapsedWidth}
      collapsedHeight={collapsedHeight}
      showLabel={[ScaleDetailsLevel.medium, ScaleDetailsLevel.high].includes(detailsLevel)}
      {...rest}
      {...passedData}
    >
      {element.isCollapsed() ? renderIcon() : null}
    </DefaultGroup>
  );
};

export default observer(StyleGroup);
