import { Divider, Panel, PanelHeader, PanelMain, PanelMainBody } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Metrics } from '../../api/loki';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { getOverviewPanelTitle, OverviewPanel } from '../../utils/overview-panels';
import { MetricsContent } from '../metrics/metrics-content';
import './netflow-overview-panel.css';

export const NetflowOverviewPanel: React.FC<{
  limit: number;
  panel: OverviewPanel;
  metricStep: number;
  metricFunction?: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  metrics: Metrics[];
  appMetrics?: Metrics;
  doubleWidth?: boolean;
}> = ({ limit, panel, metricStep, metricFunction, metricType, metricScope, metrics, appMetrics, doubleWidth }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const getContent = React.useCallback(() => {
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
            metricStep={metricStep}
            metricFunction={metricFunction}
            metricType={metricType}
            metrics={panel.id === 'total_timeseries' ? (appMetrics ? [appMetrics] : []) : metrics}
            scope={panel.id === 'total_timeseries' ? MetricScopeOptions.APP : (metricScope as MetricScopeOptions)}
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
  }, [panel.id, metricStep, metricFunction, metricType, appMetrics, metrics, metricScope, doubleWidth, t]);

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
