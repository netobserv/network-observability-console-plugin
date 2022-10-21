import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateIcon,
  EmptyStateVariant,
  Flex,
  Spinner,
  Title
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyMetrics } from '../../api/loki';
import { MetricType } from '../../model/flow-query';
import { getOverviewPanelTitle, OverviewPanel, OverviewPanelId } from '../../utils/overview-panels';
import LokiError from '../messages/loki-error';
import { NetflowOverviewPanel } from './netflow-overview-panel';
import { MetricsContent } from '../metrics/metrics-content';
import { StatDonut } from '../metrics/stat-donut';
import { toNamedMetric } from '../metrics/metrics-helper';
import { getStat } from '../../model/topology';
import { MetricsTotalContent } from '../metrics/metrics-total-content';
import { peersEqual } from '../../utils/metrics';

import './netflow-overview.css';
import { PanelKebab, PanelKebabOptions } from './panel-kebab';

type PanelContent = {
  element: JSX.Element;
  kebab?: JSX.Element;
  bodyClassSmall?: boolean;
  doubleWidth?: boolean;
};

export type NetflowOverviewProps = {
  limit: number;
  panels: OverviewPanel[];
  metricType: MetricType;
  metrics: TopologyMetrics[];
  totalMetric?: TopologyMetrics;
  loading?: boolean;
  error?: string;
  clearFilters: () => void;
};

export const NetflowOverview: React.FC<NetflowOverviewProps> = ({
  limit,
  panels,
  metricType,
  metrics,
  totalMetric,
  loading,
  error,
  clearFilters
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [kebabMap, setKebabMap] = React.useState(new Map<OverviewPanelId, PanelKebabOptions>());

  const setKebabOptions = React.useCallback(
    (id: OverviewPanelId, options: PanelKebabOptions) => {
      kebabMap.set(id, options);
      setKebabMap(new Map(kebabMap));
    },
    [kebabMap, setKebabMap]
  );

  if (error) {
    return <LokiError title={t('Unable to get overview')} error={error} />;
  } else if (_.isEmpty(metrics) || !totalMetric) {
    if (loading) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    } else {
      return (
        <Bullseye data-test="no-results-found">
          <EmptyState variant={EmptyStateVariant.small}>
            <EmptyStateIcon icon={SearchIcon} />
            <Title headingLevel="h2" size="lg">
              {t('No results found')}
            </Title>
            <EmptyStateBody>{t('Clear all filters and try again.')}</EmptyStateBody>
            <Button data-test="clear-all-filters" variant="link" onClick={clearFilters}>
              {t('Clear all filters')}
            </Button>
          </EmptyState>
        </Bullseye>
      );
    }
  }

  //skip metrics with sources equals to destinations
  //sort by top total item first
  //limit to top X since multiple queries can run in parallel
  const topKMetrics = metrics
    .sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
    .map(m => toNamedMetric(t, m));
  const namedTotalMetric = toNamedMetric(t, totalMetric);
  const noInternalTopK = topKMetrics.filter(m => !peersEqual(m.source, m.destination));

  const getPanelContent = (id: OverviewPanelId, title: string): PanelContent => {
    switch (id) {
      case 'overview':
        return {
          element: <>Large overview content</>,
          doubleWidth: true,
          bodyClassSmall: true
        };
      case 'top_bar':
        return {
          element: (
            <MetricsContent
              id={id}
              title={title}
              sizePx={600}
              metricType={metricType}
              metrics={noInternalTopK}
              limit={limit}
              showBar={true}
              showArea={false}
              showScatter={false}
              smallerTexts={false}
              doubleWidth={false}
            />
          ),
          doubleWidth: false
        };
      case 'total_timeseries':
        return {
          element: (
            <MetricsContent
              id={id}
              title={title}
              sizePx={600}
              metricType={metricType}
              metrics={[namedTotalMetric]}
              limit={limit}
              showBar={false}
              showArea={true}
              showScatter={true}
              smallerTexts={false}
              doubleWidth={false}
            />
          ),
          doubleWidth: false
        };
      case 'top_bar_total': {
        const options = kebabMap.get(id) || {
          showTotal: true,
          showInternal: true,
          showOutOfScope: false
        };
        return {
          element: (
            <MetricsTotalContent
              id={id}
              title={title}
              sizePx={600}
              metricType={metricType}
              topKMetrics={topKMetrics}
              totalMetric={namedTotalMetric}
              limit={limit}
              doubleWidth={true}
              showTotal={options.showTotal!}
              showInternal={options.showInternal!}
              showOutOfScope={options.showOutOfScope!}
            />
          ),
          kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
          doubleWidth: true
        };
      }
      case 'top_timeseries':
        return {
          element: (
            <MetricsContent
              id={id}
              title={title}
              sizePx={600}
              metricType={metricType}
              metrics={noInternalTopK}
              limit={limit}
              showBar={false}
              showArea={true}
              showScatter={true}
              smallerTexts={false}
              doubleWidth={true}
            />
          ),
          doubleWidth: true
        };
      case 'top_avg_donut': {
        const options = kebabMap.get(id) || {
          showOthers: true,
          showInternal: true,
          showOutOfScope: false
        };
        return {
          element: (
            <StatDonut
              id={id}
              limit={limit}
              metricType={metricType}
              stat="avg"
              topKMetrics={topKMetrics}
              totalMetric={namedTotalMetric}
              showOthers={options.showOthers!}
              showInternal={options.showInternal!}
              showOutOfScope={options.showOutOfScope!}
            />
          ),
          kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
        };
      }
      case 'top_latest_donut': {
        const options = kebabMap.get(id) || {
          showOthers: true,
          showInternal: true,
          showOutOfScope: false
        };
        return {
          element: (
            <StatDonut
              id={id}
              limit={limit}
              metricType={metricType}
              stat="last"
              topKMetrics={topKMetrics}
              totalMetric={namedTotalMetric}
              showOthers={options.showOthers!}
              showInternal={options.showInternal!}
              showOutOfScope={options.showOutOfScope!}
            />
          ),
          kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
        };
      }
      case 'top_sankey':
        return { element: <>Sankey content</> };
      case 'packets_dropped':
        return { element: <>Packets dropped content</> };
      case 'inbound_flows_region':
        return { element: <>Inbound flows by region content</> };
    }
  };

  return (
    <div id="overview-container">
      <Flex id="overview-flex" justifyContent={{ default: 'justifyContentSpaceBetween' }}>
        {panels
          .filter(p => p.isSelected)
          .map((panel, i) => {
            const title = getOverviewPanelTitle(t, panel.id, limit);
            const content = getPanelContent(panel.id, title);
            return (
              <NetflowOverviewPanel
                key={i}
                bodyClassSmall={!!content.bodyClassSmall}
                doubleWidth={!!content.doubleWidth}
                title={title}
                kebab={content.kebab}
              >
                {content.element}
              </NetflowOverviewPanel>
            );
          })}
      </Flex>
    </div>
  );
};

export default NetflowOverview;
