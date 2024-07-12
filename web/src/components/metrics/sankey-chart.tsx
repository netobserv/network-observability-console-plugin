import chroma from 'chroma-js';
import * as d3 from 'd3';
import type { SankeyGraph, SankeyLink, SankeyNode } from 'd3-sankey';
import { sankey as d3sankey } from 'd3-sankey';
import React from 'react';
import { MetricStats, NamedMetric } from '../../api/loki';
import { getStat } from '../../model/metrics';
import { localStorageOverviewSankeyDimensionKey, useLocalStorage } from '../../utils/local-storage-hook';
import { defaultDimensions, Dimensions, observeDimensions } from '../../utils/metrics-helper';
import { SankeyLinkComponent } from './components/sankey-link';
import { SankeyNodeComponent } from './components/sankey-node';

export type ExtraNodeProperties = {
  name: string;
  displayName: string;
  origin?: string;
  description?: string;
  type: string;
};
export type ExtraLinkProperties = {};
export type CustomSankeyNode = SankeyNode<ExtraNodeProperties, ExtraLinkProperties>;
export type CustomSankeyLink = SankeyLink<ExtraNodeProperties, ExtraLinkProperties>;
export type CustomSankeyGraph = SankeyGraph<CustomSankeyNode, CustomSankeyLink>;

export type SankeyChartProps = {
  id: string;
  isDark?: boolean;
  showLast?: boolean;
  showLegend?: boolean;
  metrics: NamedMetric[];
  limit: number;
};

export const SankeyChart: React.FC<SankeyChartProps> = ({ id, isDark, showLast, showLegend, metrics, limit }) => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [dimensions, setDimensions] = useLocalStorage<Dimensions>(
    `${localStorageOverviewSankeyDimensionKey}${showLegend ? '-legend' : ''}`,
    defaultDimensions
  );

  React.useEffect(() => {
    observeDimensions(containerRef, dimensions, setDimensions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, dimensions]);

  const getStats = React.useCallback(
    (stats: MetricStats) => {
      return getStat(stats, showLast ? 'last' : 'avg');
    },
    [showLast]
  );

  const getSankeySVG = React.useCallback(() => {
    const filteredMetrics = metrics.slice(0, limit);
    if (filteredMetrics.length) {
      const data: CustomSankeyGraph = {
        nodes: [],
        links: []
      };

      filteredMetrics.forEach(m => {
        data.links.push({
          source:
            data.nodes.find(n => n.name === m.srcName && n.type === 'source') ||
            data.nodes.push({ name: m.srcName, displayName: showLegend ? m.srcName : '', type: 'source' }) - 1,
          target:
            data.nodes.find(n => n.name === m.dstName && n.type === 'destination') ||
            data.nodes.push({ name: m.dstName, displayName: showLegend ? m.dstName : '', type: 'destination' }) - 1,
          value: getStats(m.stats)
        });
      });

      const margin = dimensions.width / 20;
      const graph = d3sankey<CustomSankeyNode, CustomSankeyLink>()
        .nodeWidth(dimensions.width / 3)
        .nodePadding(dimensions.width / 10)
        .extent([
          [margin, margin],
          [dimensions.width - margin, dimensions.height - margin]
        ])(data);
      const color = chroma.scale('Set2').classes(graph.nodes.length);
      const colorScale = d3.scaleLinear().domain([0, graph.nodes.length]).range([0, 1]);
      return (
        <svg width={dimensions.width} height={dimensions.height}>
          <g>
            {graph.links.map((link, i) => (
              <SankeyLinkComponent
                key={`sankey-link-${i}`}
                link={link}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                color={color(colorScale((link.source as any).index)).hex()}
                maxWidth={dimensions.width / 50}
              />
            ))}
            {graph.nodes.map((node, i) => (
              <SankeyNodeComponent
                key={`sankey-node-${i}`}
                link={node}
                color={color(colorScale(i)).hex()}
                name={node.displayName}
                height={dimensions.height / 20}
                graph={graph}
              />
            ))}
          </g>
        </svg>
      );
    }

    return <g />;
  }, [metrics, limit, dimensions.width, dimensions.height, showLegend, getStats]);

  return (
    <div
      id={`chart-${id}`}
      className={`metrics-content-div ${isDark ? 'dark' : 'light'}`}
      ref={containerRef}
      data-test-metrics={metrics.length}
    >
      {getSankeySVG()}
    </div>
  );
};
