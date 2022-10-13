import { TFunction } from 'i18next';

export type OverviewPanelId =
  | 'overview'
  | 'top_bar'
  | 'top_bar_total'
  | 'top_avg_donut'
  | 'top_latest_donut'
  | 'top_sankey'
  | 'total_timeseries'
  | 'top_timeseries'
  | 'packets_dropped'
  | 'inbound_flows_region';

export type OverviewPanel = {
  id: OverviewPanelId;
  isSelected: boolean;
};

export const getDefaultOverviewPanels = (): OverviewPanel[] => {
  return [
    { id: 'overview', isSelected: true },
    { id: 'top_avg_donut', isSelected: true },
    { id: 'top_latest_donut', isSelected: true },
    { id: 'top_bar', isSelected: true },
    { id: 'total_timeseries', isSelected: true },
    { id: 'top_bar_total', isSelected: true },
    { id: 'top_timeseries', isSelected: true },
    { id: 'top_sankey', isSelected: true },
    { id: 'packets_dropped', isSelected: true },
    { id: 'inbound_flows_region', isSelected: true }
  ];
};

export const getOverviewPanelTitle = (t: TFunction, id: OverviewPanelId, limit: string | number = 'X'): string => {
  switch (id) {
    case 'overview':
      return t('Network overview');
    case 'top_bar':
      return t('Top {{limit}} flow rates', { limit });
    case 'top_bar_total':
      return t('Top {{limit}} flow rates with total', { limit });
    case 'top_timeseries':
      return t('Network traffic over time');
    case 'top_avg_donut':
      return t('Top {{limit}} average rates', { limit });
    case 'top_latest_donut':
      return t('Top {{limit}} latest rates', { limit });
    case 'top_sankey':
      return t('Top {{limit}} flows distribution', { limit });
    case 'total_timeseries':
      return t('Total flows time series');
    case 'packets_dropped':
      return t('Packets dropped');
    case 'inbound_flows_region':
      return t('Inbound flows by region');
  }
};
