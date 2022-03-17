import * as React from 'react';
import { observer, DefaultEdge, Edge, WithContextMenuProps, WithSelectionProps } from '@patternfly/react-topology';

type StyleEdgeProps = {
  element: Edge;
} & WithContextMenuProps &
  WithSelectionProps;

export const StyleEdge: React.FC<StyleEdgeProps> = ({ element, onContextMenu, contextMenuOpen, ...rest }) => {
  const data = element.getData();

  return (
    <DefaultEdge
      element={element}
      {...rest}
      {...data}
      onContextMenu={data?.showContextMenu ? onContextMenu : undefined}
      contextMenuOpen={contextMenuOpen}
    />
  );
};

export default observer(StyleEdge);
