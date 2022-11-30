import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { MetricType } from '../../model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { decorated, getStat, NodeData } from '../../model/topology';
import { MetricsContent } from '../metrics/metrics-content';
import { matchPeer } from '../../utils/metrics';
import { toNamedMetric } from '../metrics/metrics-helper';
import { ElementPanelStats, PanelMetricsContext } from './element-panel-stats';
import { TruncateLength } from '../dropdowns/truncate-dropdown';

export const ElementPanelMetrics: React.FC<{
  aData: NodeData;
  bData?: NodeData;
  isGroup: boolean;
  metrics: TopologyMetrics[];
  metricType: MetricType;
  context: PanelMetricsContext;
  truncateLength: TruncateLength;
}> = ({ aData, bData, isGroup, metrics, metricType, context, truncateLength }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const titleStats = t('Stats');
  const titleChart = t('Top 5 rates');

  let id = '';
  let filtered: TopologyMetrics[] = [];
  let focusNode: NodeData | undefined;
  switch (context) {
    case 'a-to-b':
      id = `edge-${aData.peer.id}-${bData!.peer.id}`;
      filtered = metrics.filter(m => matchPeer(aData, m.source) && matchPeer(bData!, m.destination));
      break;
    case 'b-to-a':
      id = `edge-${bData!.peer.id}-${aData.peer.id}`;
      filtered = metrics.filter(m => matchPeer(bData!, m.source) && matchPeer(aData, m.destination));
      break;
    case 'from-node':
      focusNode = aData;
      id = `node-${decorated(focusNode).id}`;
      filtered = metrics.filter(m => m.source.id !== m.destination.id && matchPeer(focusNode!, m.source));
      break;
    case 'to-node':
      focusNode = aData;
      id = `node-${decorated(focusNode).id}`;
      filtered = metrics.filter(m => m.source.id !== m.destination.id && matchPeer(focusNode!, m.destination));
      break;
  }
  const top5 = filtered
    .map(m => toNamedMetric(t, m, truncateLength, false, false, isGroup ? undefined : focusNode))
    .sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'));

  return (
    <div className="element-metrics-container">
      <TextContent>
        <Text id="metrics-stats-title" component={TextVariants.h4}>
          {titleStats}
        </Text>
        <ElementPanelStats metricType={metricType} metrics={filtered} context={context} />
        <Text id="metrics-chart-title" component={TextVariants.h4}>
          {titleChart}
        </Text>
      </TextContent>
      <MetricsContent
        id={id}
        title={titleChart}
        metricType={metricType}
        metrics={top5}
        limit={5}
        showArea
        showScatter
        tooltipsTruncate={true}
      />
    </div>
  );
};
