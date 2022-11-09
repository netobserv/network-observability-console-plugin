import { TFunction } from 'i18next';
import { Feature, isAllowed } from './features-gate';

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
  let panels: OverviewPanel[] = [];

  panels = panels.concat([
    { id: 'top_avg_donut', isSelected: true },
    { id: 'top_latest_donut', isSelected: true },
    { id: 'top_bar', isSelected: true },
    { id: 'total_timeseries', isSelected: true },
    { id: 'top_bar_total', isSelected: true },
    { id: 'top_timeseries', isSelected: true }
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

export const getOverviewPanelTitleAndTooltip = (
  t: TFunction,
  id: OverviewPanelId,
  limit: string | number = 'X'
): [string, string?] => {
  switch (id) {
    case 'overview':
      return [t('Network overview')];
    case 'top_bar':
      return [t('Top {{limit}} flow rates', { limit })];
    case 'top_bar_total':
      return [t('Top {{limit}} flow rates with total', { limit })];
    case 'top_timeseries':
      return [t('Network traffic over time')];
    case 'top_avg_donut':
      return [t('Top {{limit}} average rates', { limit }), t('This is the average rate over the selected interval')];
    case 'top_latest_donut':
      return [
        t('Top {{limit}} latest rates', { limit }),
        t('This is the last measured rate from the selected interval')
      ];
    case 'top_sankey':
      return [t('Top {{limit}} flows distribution', { limit })];
    case 'total_timeseries':
      return [t('Total flows time series')];
    case 'packets_dropped':
      return [t('Packets dropped')];
    case 'inbound_flows_region':
      return [t('Inbound flows by region')];
  }
};
