import { TFunction } from 'i18next';
import { Feature, isAllowed } from './features-gate';

export type OverviewPanelId =
  | 'overview'
  | 'top_bar'
  | 'top_bar_total'
  | 'top_avg_donut'
  | 'top_latest_donut'
  | 'top_dropped_state_donut'
  | 'top_dropped_cause_donut'
  | 'top_sankey'
  | 'total_line'
  | 'top_lines'
  | 'top_dropped_bar'
  | 'total_dropped_line'
  | 'top_dropped_bar_total'
  | 'inbound_region';

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
    { id: 'top_lines', isSelected: true },
    { id: 'top_dropped_bar', isSelected: false },
    { id: 'total_dropped_line', isSelected: false },
    { id: 'top_dropped_state_donut', isSelected: false },
    { id: 'top_dropped_cause_donut', isSelected: true },
    { id: 'top_dropped_bar_total', isSelected: true }
  ]);
  if (isAllowed(Feature.Overview)) {
    panels.unshift({ id: 'overview', isSelected: true });

    panels = panels.concat([
      { id: 'top_sankey', isSelected: true },
      { id: 'inbound_region', isSelected: true }
    ]);
  }

  return panels;
};

export const getOverviewPanelInfo = (
  t: TFunction,
  id: OverviewPanelId,
  limit: string | number = 'X',
  type: string
): OverviewPanelInfo => {
  switch (id) {
    case 'overview':
      return { title: t('Network overview') };
    case 'top_bar':
      return { title: t('Top {{limit}} {{type}} rates stacked', { limit, type }), chartType: t('bars') };
    case 'top_bar_total':
      return {
        title: t('Top {{limit}} {{type}} rates stacked with total', { limit, type }),
        chartType: t('bars'),
        tooltip: t('The top rates as bar compared to total as line over the selected interval')
      };
    case 'top_lines':
      return { title: t('Top {{limit}} {{type}} rates', { limit, type }), chartType: t('lines') };
    case 'top_avg_donut':
      return {
        title: t('Top {{limit}} average rates', { limit }),
        chartType: t('donut'),
        tooltip: t('The average rate over the selected interval')
      };
    case 'top_latest_donut':
      return {
        title: t('Top {{limit}} latest rates', { limit }),
        chartType: t('donut'),
        tooltip: t('The last measured rate from the selected interval')
      };
    case 'top_sankey':
      return { title: t('Top {{limit}} {{type}} distribution', { limit, type }), chartType: t('sankey') };
    case 'total_line':
      return { title: t('Total rate'), chartType: t('line') };
    case 'top_dropped_bar':
      return { title: t('Top {{limit}} {{type}} dropped rates stacked', { limit, type }), chartType: t('bars') };
    case 'total_dropped_line':
      return { title: t('Total dropped rate'), chartType: t('line') };
    case 'top_dropped_state_donut':
      return {
        title: t('Top {{limit}} dropped state', { limit }),
        chartType: t('donut'),
        tooltip: t('The top dropped states over the selected interval')
      };
    case 'top_dropped_cause_donut':
      return {
        title: t('Top {{limit}} dropped cause', { limit }),
        chartType: t('donut'),
        tooltip: t('The top drop causes over the selected interval')
      };
    case 'top_dropped_bar_total':
      return {
        title: t('Top {{limit}} {{type}} dropped rates stacked with total', { limit, type }),
        chartType: t('bars'),
        tooltip: t('The top dropped rates as bar compared to total as line over the selected interval')
      };
    case 'inbound_region':
      return { title: t('Inbound {{type}} by region', { type }) };
  }
};
