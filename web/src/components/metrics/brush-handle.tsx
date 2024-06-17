import * as React from 'react';

export interface BrushHandleComponentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  isDark?: boolean;
}

export const BrushHandleComponent: React.FC<BrushHandleComponentProps> = ({ x, y, width, height, isDark }) => {
  if (x === undefined || y === undefined || width === undefined || height === undefined) {
    return null;
  }

  const triangleSize = 6;
  const color = isDark ? '#D2D2D2' : '#0066CC';
  return (
    <g>
      <line x1={x} x2={x} y1={y} y2={height + y} style={{ stroke: color, strokeDasharray: '5 3' }} />
      <polygon
        points={`${x},${y} ${x - triangleSize},${y - triangleSize} ${x + triangleSize},${y - triangleSize}`}
        style={{ fill: color }}
      />
    </g>
  );
};

export default BrushHandleComponent;
