import { DefaultLinkObject, linkHorizontal } from 'd3-shape';
import React, { useState } from 'react';
import { CustomSankeyLink, CustomSankeyNode } from '../sankey-chart';

export const DEFAULT_OPACITY = 0.3;
export const HOVER_OPACITY = 0.8;

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
  link: CustomSankeyLink;
  color: string;
  maxWidth?: number;
};

export const SankeyLinkComponent: React.FC<SankeyLinkProps> = ({ link, color, maxWidth }) => {
  const source = link.source as CustomSankeyNode;
  const target = link.target as CustomSankeyNode;
  const linkWidth = maxWidth && source.value ? (link.value / source.value) * maxWidth : link.width;
  const defaultLink = link as unknown as DefaultLinkObject;
  const path = maxWidth ? sankeyLinkHorizontalO()(defaultLink) : sankeyLinkHorizontal()(defaultLink);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  return (
    <path
      d={path!}
      style={{
        fill: 'none',
        strokeOpacity: opacity,
        stroke: color,
        strokeWidth: linkWidth && !isNaN(linkWidth) ? linkWidth : 0
      }}
      onMouseEnter={() => setOpacity(HOVER_OPACITY)}
      onMouseLeave={() => setOpacity(DEFAULT_OPACITY)}
    >
      <title>
        {source.name} -&gt; {target.name}: {link.value}
      </title>
    </path>
  );
};

export default SankeyLinkComponent;
