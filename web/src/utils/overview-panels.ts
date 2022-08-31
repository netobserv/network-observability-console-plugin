import { TFunction } from 'i18next';

export type OverviewPanelType = 'overview' | 'bar' | 'donut' | 'sankey' | 'total_timeseries' | 'top_timeseries';

export type OverviewPanel = {
  id: OverviewPanelType;
  title: string;
  isSelected: boolean;
};

export const getDefaultOverviewPanels = (t: TFunction) => {
  return ['overview', 'total_timeseries', 'bar', 'donut', 'sankey', 'top_timeseries'].map(id => {
    return { id, title: getOverviewPanelTitle(t, id as OverviewPanelType), isSelected: true } as OverviewPanel;
  });
};

export const getOverviewPanelTitle = (t: TFunction, type: OverviewPanelType) => {
  switch (type) {
    case 'overview':
      return t('Network overview');
    case 'bar':
      return t('Top flows bar chart');
    case 'donut':
      return t('Top flows donut chart');
    case 'sankey':
      return t('Top flows sankey chart');
    case 'total_timeseries':
      return t('Total flows time series');
    case 'top_timeseries':
      return t('Network traffic over time');
    default:
      return t('Error: Unknown panel type');
  }
};
