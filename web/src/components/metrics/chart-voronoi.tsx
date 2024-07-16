import { ChartLegendTooltip, createContainer } from '@patternfly/react-charts';
import React from 'react';
import { ChartDataPoint, LegendDataItem } from '../../utils/metrics-helper';

export const chartVoronoi = (legendData: LegendDataItem[], f: (v: number) => string) => {
  const CursorVoronoiContainer = createContainer('voronoi', 'cursor');
  const tooltipData = legendData.map(item => ({ ...item, name: item.tooltipName || item.name }));
  return (
    <CursorVoronoiContainer
      cursorDimension="x"
      labels={(dp: { datum: ChartDataPoint }) => {
        return dp.datum.y || dp.datum.y === 0 ? f(dp.datum.y) : 'n/a';
      }}
      labelComponent={<ChartLegendTooltip legendData={tooltipData} title={(datum: ChartDataPoint) => datum.date} />}
      mouseFollowTooltips
      voronoiDimension="x"
      voronoiPadding={50}
    />
  );
};
