import { TFunction } from 'i18next';
import { Feature, isAllowed } from './features-gate';

export type OverviewPanelId =
  | 'overview'
  | 'top_bar'
  | 'top_bar_total'
  | 'top_avg_donut'
  | 'top_latest_donut'
  | 'top_sankey'
  | 'total_line'
  | 'top_lines'
  | 'packets_dropped'
  | 'inbound_flows_region';

export type OverviewPanel = {
  id: OverviewPanelId;
  isSelected: boolean;
};

export type OverviewPanelInfo = {
  title: string;
  chartType?: string;
  tooltip?: string;
};

export const getDefaultOverviewPanels = (): OverviewPanel[] => {
  let panels: OverviewPanel[] = [];

  panels = panels.concat([
    { id: 'top_avg_donut', isSelected: true },
    { id: 'top_latest_donut', isSelected: true },
    { id: 'top_bar', isSelected: false },
    { id: 'total_line', isSelected: false },
    { id: 'top_bar_total', isSelected: true },
    { id: 'top_lines', isSelected: true }
  ]);
  if (isAllowed(Feature.Overview)) {
    panels.unshift({ id: 'overview', isSelected: true });

    panels = panels.concat([
      { id: 'top_sankey', isSelected: true },
      { id: 'packets_dropped', isSelected: true },
      { id: 'inbound_flows_region', isSelected: true }
    ]);
  }

  return panels;
};

export const getOverviewPanelInfo = (
  t: TFunction,
  id: OverviewPanelId,
  limit: string | number = 'X'
): OverviewPanelInfo => {
  switch (id) {
    case 'overview':
      return { title: t('Network overview') };
    case 'top_bar':
      return { title: t('Top {{limit}} flow rates stacked', { limit }), chartType: t('bars') };
    case 'top_bar_total':
      return { title: t('Top {{limit}} flow rates stacked with total', { limit }), chartType: t('bars') };
    case 'top_lines':
      return { title: t('Top {{limit}} flow rates', { limit }), chartType: t('lines') };
    case 'top_avg_donut':
      return {
        title: t('Top {{limit}} average rates', { limit }),
        chartType: t('donut'),
        tooltip: t('This is the average rate over the selected interval')
      };
    case 'top_latest_donut':
      return {
        title: t('Top {{limit}} latest rates', { limit }),
        chartType: t('donut'),
        tooltip: t('This is the last measured rate from the selected interval')
      };
    case 'top_sankey':
      return { title: t('Top {{limit}} flows distribution', { limit }), chartType: t('sankey') };
    case 'total_line':
      return { title: t('Total rate'), chartType: t('line') };
    case 'packets_dropped':
      return { title: t('Packets dropped') };
    case 'inbound_flows_region':
      return { title: t('Inbound flows by region') };
  }
};
