import {
  DefaultGroup,
  Node,
  observer,
  ScaleDetailsLevel,
  ShapeProps,
  WithDragNodeProps,
  WithSelectionProps
} from '@patternfly/react-topology';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';
import * as React from 'react';
import { TopologyGroupIcon } from '../../../../icons';

const iconPadding = 20;

export enum DataTypes {
  Default,
  Alternate
}

type StyleGroupProps = {
  element: Node;
  collapsedWidth?: number;
  collapsedHeight?: number;
  onCollapseChange?: (group: Node, collapsed: boolean) => void;
  getCollapsedShape?: (node: Node) => React.FC<ShapeProps>;
  collapsedShadowOffset?: number; // defaults to 10
} & WithDragNodeProps &
  WithSelectionProps;

const StyleGroup: React.FunctionComponent<StyleGroupProps> = ({
  element,
  collapsedWidth = 75,
  collapsedHeight = 75,
  ...rest
}) => {
  const data = element.getData();
  const detailsLevel = useDetailsLevel();

  const renderIcon = (): React.ReactNode => {
    const iconSize = Math.min(collapsedWidth, collapsedHeight) - iconPadding * 2;

    return (
      <g transform={`translate(${(collapsedWidth - iconSize) / 2}, ${(collapsedHeight - iconSize) / 2})`}>
        <TopologyGroupIcon size={iconSize} style={{ color: '#393F44' }} />
      </g>
    );
  };

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    Object.keys(newData).forEach(key => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data]);

  return (
    <DefaultGroup
      className="netobserv"
      element={element}
      collapsible
      collapsedWidth={collapsedWidth}
      collapsedHeight={collapsedHeight}
      showLabel={detailsLevel === ScaleDetailsLevel.high}
      {...rest}
      {...passedData}
    >
      {element.isCollapsed() ? renderIcon() : null}
    </DefaultGroup>
  );
};

export default observer(StyleGroup);
