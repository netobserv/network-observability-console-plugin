import type { SankeyLink } from 'd3-sankey';
import { linkHorizontal } from 'd3-shape';
import React, { useState } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function horizontalSourceO(d: any): [number, number] {
  const y = (d.source.y1 - d.source.y0) / 2 + d.source.y0;
  return [d.source.x1, y];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function horizontalTargetO(d: any): [number, number] {
  const y = (d.target.y1 - d.target.y0) / 2 + d.target.y0;
  return [d.target.x0, y];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function horizontalSource(d: any): [number, number] {
  return [d.source.x1, d.y0];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function horizontalTarget(d: any): [number, number] {
  return [d.target.x0, d.y1];
}

function sankeyLinkHorizontal() {
  return linkHorizontal().source(horizontalSource).target(horizontalTarget);
}

function sankeyLinkHorizontalO() {
  return linkHorizontal().source(horizontalSourceO).target(horizontalTargetO);
}

export type SankeyLinkProps = {
  link: SankeyLink<{}, {}>;
  color: string;
  maxWidth?: number;
};

export const SankeyLinkComponent: React.FC<SankeyLinkProps> = ({ link, color, maxWidth }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const source = link.source as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = link.target as any;

  const linkWidth = maxWidth ? (link.value / source.value) * maxWidth : link.width;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const path: string = maxWidth ? (sankeyLinkHorizontalO() as any)(link) : (sankeyLinkHorizontal() as any)(link);

  const [opacity, setOpacity] = useState(0.3);

  return (
    <path
      d={path}
      style={{
        fill: 'none',
        strokeOpacity: opacity,
        stroke: color,
        strokeWidth: linkWidth && !isNaN(linkWidth) ? linkWidth : 0
      }}
      onMouseEnter={() => setOpacity(0.8)}
      onMouseLeave={() => setOpacity(0.3)}
    >
      <title>
        {source.name} -&gt; {target.name}: {link.value}
      </title>
    </path>
  );
};

export default SankeyLinkComponent;
