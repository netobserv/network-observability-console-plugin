import { Divider, Panel, PanelHeader, PanelMain, PanelMainBody } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getOverviewPanelTitle, OverviewPanel } from '../../utils/overview-panels';
import { TopologyMetrics } from '../../api/loki';
import { MetricFunction, MetricType, MetricScope } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import './netflow-overview-panel.css';
import MetricsContent from '../metrics/metrics-content';

export const NetflowOverviewPanel: React.FC<{
  limit: number;
  panel: OverviewPanel;
  metricFunction: MetricFunction;
  metricType: MetricType;
  metricScope: MetricScope;
  metrics: TopologyMetrics[];
  doubleWidth?: boolean;
}> = ({ limit, panel, metricFunction, metricType, metricScope, metrics, doubleWidth }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const getContent = React.useCallback(() => {
    //TODO: put content here
    switch (panel.id) {
      case 'overview':
        return 'Large overview content';
      case 'total_timeseries':
      case 'top_bar':
      case 'top_donut':
      case 'top_timeseries':
        return (
          <MetricsContent
            id={panel.id}
            sizePx={600}
            metricFunction={metricFunction}
            metricType={metricType}
            metrics={metrics}
            scope={metricScope as MetricScopeOptions}
            showDonut={panel.id === 'top_donut'}
            showBar={panel.id === 'top_bar'}
            showArea={panel.id.endsWith('_timeseries')}
            showScatter={panel.id.endsWith('_timeseries')}
            smallerTexts={panel.id === 'top_donut'}
            doubleWidth={doubleWidth}
          />
        );
      case 'top_sankey':
        return 'Sankey content';
      case 'packets_dropped':
        return 'Packets dropped content';
      case 'inbound_flows_region':
        return 'Inbound flows by region content';
      default:
        return t('Error: Unknown panel type');
    }
  }, [panel.id, metricFunction, metricType, metrics, metricScope, doubleWidth, t]);

  return (
    <Panel variant="raised">
      <PanelHeader>{getOverviewPanelTitle(t, panel.id, limit.toString())}</PanelHeader>
      <Divider />
      <PanelMain>
        <PanelMainBody className={panel.id !== 'overview' ? 'overview-panel-body' : 'overview-panel-body-small'}>
          {getContent()}
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};

export default NetflowOverviewPanel;
