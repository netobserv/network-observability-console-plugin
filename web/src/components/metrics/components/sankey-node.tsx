import type { sankey, SankeyGraph, SankeyNode } from 'd3-sankey';
import React from 'react';
import { CustomSankeyLink, CustomSankeyNode } from '../sankey-chart';

export type SankeyNodeProps = {
  link: SankeyNode<{}, {}>;
  color: string;
  name: string;
  width?: number;
  height?: number;
  graph?: SankeyGraph<CustomSankeyNode, CustomSankeyLink>;
  sankey?: typeof sankey;
};

export const SankeyNodeComponent: React.FC<SankeyNodeProps> = ({
  link: { x0, x1, y0, y1 },
  color,
  name,
  width,
  height
}) => {
  const defaultWidth = x1! - x0!;
  const defaultHeight = y1! - y0!;
  const nodeWidth = width ? width : defaultWidth;
  const nodeHeight = height ? height : defaultHeight;
  const nodeY = height ? y0! + defaultHeight / 2 - height / 2 : y0;
  const textY = height ? nodeY! + height / 2 + 6 : y0! + nodeHeight / 2 + 6;
  return (
    <g style={{ pointerEvents: 'all' }} onClick={() => console.log()}>
      <rect x={x0} y={nodeY} width={nodeWidth} height={nodeHeight} fill={color}>
        <title>{name}</title>
      </rect>
      <text x={x0! + 5} y={textY} fill="black" style={{ userSelect: 'none', overflowX: 'hidden' }}>
        {name}
      </text>
    </g>
  );
};

export default SankeyNodeComponent;
