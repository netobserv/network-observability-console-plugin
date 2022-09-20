import { TFunction } from 'i18next';

export type OverviewPanelType =
  | 'overview'
  | 'top_bar'
  | 'top_donut'
  | 'top_sankey'
  | 'total_timeseries'
  | 'top_timeseries'
  | 'packets_dropped'
  | 'inbound_flows_region';

export type OverviewPanel = {
  id: OverviewPanelType;
  isSelected: boolean;
};

export const getDefaultOverviewPanels = () => {
  return [
    'overview',
    'total_timeseries',
    'top_bar',
    'top_donut',
    'top_sankey',
    'top_timeseries',
    'packets_dropped',
    'inbound_flows_region'
  ].map(id => {
    return { id, isSelected: true } as OverviewPanel;
  });
};

export const getOverviewPanelTitle = (t: TFunction, type: OverviewPanelType, limit = 'X') => {
  switch (type) {
    case 'overview':
      return t('Network overview');
    case 'top_bar':
      return t('Top {{limit}} flows bar chart', { limit });
    case 'top_donut':
      return t('Top {{limit}} flows donut chart', { limit });
    case 'top_sankey':
      return t('Top {{limit}} flows sankey chart', { limit });
    case 'total_timeseries':
      return t('Total flows time series');
    case 'top_timeseries':
      return t('Network traffic over time');
    case 'packets_dropped':
      return t('Packets dropped');
    case 'inbound_flows_region':
      return t('Inbound flows by region');
    default:
      return t('Error: Unknown panel type');
  }
};
