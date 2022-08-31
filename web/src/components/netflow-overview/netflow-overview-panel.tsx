import { Bullseye, Divider, Panel, PanelHeader, PanelMain, PanelMainBody, Spinner } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewPanel } from '../../utils/overview-panels';
import { TopologyMetrics } from '../../api/loki';
import { MetricFunction, MetricType } from '../../model/flow-query';
import './netflow-overview-panel.css';

export const NetflowOverviewPanel: React.FC<{
  panel: OverviewPanel;
  metricFunction?: MetricFunction;
  metricType?: MetricType;
  metrics: TopologyMetrics[];
  loading?: boolean;
}> = ({ panel, metricFunction, metricType, metrics, loading }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const getContent = React.useCallback(() => {
    if (loading) {
      return (
        <Bullseye data-test="loading-overview-panel">
          <Spinner size="xl" />
        </Bullseye>
      );
    } else {
      //TODO: put content here
      switch (panel.id) {
        case 'overview':
          return 'Large overview content';
        case 'bar':
          return 'Bar content';
        case 'donut':
          return 'Donut content';
        case 'sankey':
          return 'Sankey content';
        case 'total_timeseries':
          return 'Total time series content';
        case 'top_timeseries':
          return 'Large top time series content';
        default:
          return t('Error: Unknown panel type');
      }
    }
  }, [loading, t, panel.id]);

  return (
    <Panel variant="raised">
      <PanelHeader>{panel.title}</PanelHeader>
      <Divider />
      <PanelMain>
        <PanelMainBody className="overview-panel-body">{getContent()}</PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

export default NetflowOverviewPanel;
