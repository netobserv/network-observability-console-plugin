import * as React from 'react';
import {
  DefaultEdge,
  Edge,
  WithContextMenuProps,
  WithSelectionProps,
  observer,
  ScaleDetailsLevel
} from '@patternfly/react-topology';
import useDetailsLevel from '@patternfly/react-topology/dist/esm/hooks/useDetailsLevel';

type StyleEdgeProps = {
  element: Edge;
} & WithContextMenuProps &
  WithSelectionProps;

const StyleEdge: React.FC<StyleEdgeProps> = ({ element, onContextMenu, contextMenuOpen, ...rest }) => {
  const data = element.getData();
  const detailsLevel = useDetailsLevel();

  const passedData = React.useMemo(() => {
    const newData = { ...data };
    if (detailsLevel !== ScaleDetailsLevel.high) {
      newData.tag = undefined;
    }
    Object.keys(newData).forEach(key => {
      if (newData[key] === undefined) {
        delete newData[key];
      }
    });
    return newData;
  }, [data, detailsLevel]);

  return (
    <DefaultEdge
      element={element}
      {...rest}
      {...passedData}
      onContextMenu={data?.showContextMenu ? onContextMenu : undefined}
      contextMenuOpen={contextMenuOpen}
    />
  );
};

export default observer(StyleEdge);
