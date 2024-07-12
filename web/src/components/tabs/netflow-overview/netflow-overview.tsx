import {
  Bullseye,
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
import { Field, FlowDirection, getDirectionDisplayString } from '../../../api/ipfix';
import { GenericMetric, isValidTopologyMetrics, NamedMetric, NetflowMetrics, TopologyMetrics } from '../../../api/loki';
import { RecordType } from '../../../model/flow-query';
import { getStat } from '../../../model/metrics';
import { getDNSErrorDescription, getDNSRcodeDescription } from '../../../utils/dns';
import { getDSCPServiceClassName } from '../../../utils/dscp';
import { localStorageOverviewKebabKey, useLocalStorage } from '../../../utils/local-storage-hook';
import { observeDOMRect, toNamedMetric } from '../../../utils/metrics-helper';
import {
  customPanelMatcher,
  getFunctionFromId,
  getOverviewPanelInfo,
  getRateFunctionFromId,
  OverviewPanel,
  OverviewPanelId,
  OverviewPanelInfo,
  parseCustomMetricId
} from '../../../utils/overview-panels';
import { convertRemToPixels } from '../../../utils/panel';
import { formatPort } from '../../../utils/port';
import { usePrevious } from '../../../utils/previous-hook';
import { formatProtocol } from '../../../utils/protocol';
import { TruncateLength } from '../../dropdowns/truncate-dropdown';
import { MetricsDonut } from '../../metrics/metrics-donut';
import { MetricsGraph } from '../../metrics/metrics-graph';
import { MetricsGraphWithTotal } from '../../metrics/metrics-graph-total';
import { SankeyChart } from '../../metrics/sankey-chart';
import { NetflowOverviewPanel } from './netflow-overview-panel';
import './netflow-overview.css';
import { PanelKebab, PanelKebabOptions } from './panel-kebab';

type PanelContent = {
  calculatedTitle?: string;
  element: JSX.Element;
  kebab?: JSX.Element;
  bodyClassSmall?: boolean;
  doubleWidth?: boolean;
};

export interface NetflowOverviewProps {
  limit: number;
  panels: OverviewPanel[];
  recordType: RecordType;
  metrics: NetflowMetrics;
  loading?: boolean;
  isDark?: boolean;
  filterActionLinks: JSX.Element;
  truncateLength: TruncateLength;
  focus?: boolean;
  setFocus?: (v: boolean) => void;
  forcedSize?: DOMRect;
}

export const NetflowOverview: React.FC<NetflowOverviewProps> = ({
  limit,
  panels,
  recordType,
  metrics,
  loading,
  isDark,
  filterActionLinks,
  truncateLength,
  focus,
  setFocus,
  forcedSize
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [kebabMap, setKebabMap] = useLocalStorage<Map<OverviewPanelId, PanelKebabOptions>>(
    localStorageOverviewKebabKey,
    new Map<OverviewPanelId, PanelKebabOptions>()
  );
  const [selectedPanel, setSelectedPanel] = React.useState<OverviewPanel | undefined>();
  const previousSelectedPanel = usePrevious(selectedPanel);

  const containerPadding = convertRemToPixels(2);
  const cardPadding = convertRemToPixels(0.5);

  const containerRef = React.createRef<HTMLDivElement>();
  const [containerSize, setContainerSize] = React.useState<DOMRect>(forcedSize || ({ width: 0, height: 0 } as DOMRect));
  const [sidePanelWidth, setSidePanelWidth] = React.useState<number>(0);
  const [offsetTop, setOffsetTop] = React.useState<number>(0);

  const setKebabOptions = React.useCallback(
    (id: OverviewPanelId, options: PanelKebabOptions) => {
      kebabMap.set(id, options);
      setKebabMap(new Map(kebabMap));
    },
    [kebabMap, setKebabMap]
  );

  const getKebabOptions = React.useCallback(
    (id: OverviewPanelId, defaultValue: PanelKebabOptions) => {
      const found = kebabMap.get(id);
      if (found) {
        // ensure localstorage doesn't contains extra fields than default value in case an option has been removed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value: any = {};
        (Object.keys(defaultValue) as (keyof typeof defaultValue)[]).forEach(k => {
          value[k] = found[k];
        });
        return value as PanelKebabOptions;
      }
      return defaultValue;
    },
    [kebabMap]
  );

  const emptyGraph = React.useCallback(() => {
    return (
      <div className="emptygraph">
        {loading ? (
          <Bullseye data-test="loading-contents">
            <Spinner size="xl" />
          </Bullseye>
        ) : (
          <Bullseye data-test="no-results-found">
            <EmptyState variant={EmptyStateVariant.small}>
              <EmptyStateIcon icon={SearchIcon} />
              <Title headingLevel="h2" size="lg">
                {t('No results found')}
              </Title>
              <EmptyStateBody>{t('Clear or reset filters and try again.')}</EmptyStateBody>
              {filterActionLinks}
            </EmptyState>
          </Bullseye>
        )}
      </div>
    );
  }, [filterActionLinks, loading, t]);

  React.useEffect(() => {
    observeDOMRect(containerRef, containerSize, setContainerSize);
    setSidePanelWidth(document.getElementById('summaryPanel')?.clientWidth || 0);
    setOffsetTop(containerRef.current?.offsetTop || 0);
  }, [containerRef, containerSize]);

  React.useEffect(() => {
    if (panels.length && (selectedPanel === undefined || !panels.find(p => p.id === selectedPanel.id))) {
      setSelectedPanel(panels[0]);
    }
  }, [panels, selectedPanel]);

  //allow focus only when prop is true and multiple panels selected
  const allowFocus = focus === true && panels.length > 1;
  const wasAllowFocus = usePrevious(allowFocus);

  const getRateMetric = React.useCallback(
    (id: OverviewPanelId) => {
      if (id.includes('dropped')) {
        return metrics.droppedRateMetrics;
      } else {
        return metrics.rateMetrics;
      }
    },
    [metrics.droppedRateMetrics, metrics.rateMetrics]
  );

  const getTotalRateMetric = React.useCallback(
    (id: OverviewPanelId) => {
      if (id.includes('dropped')) {
        return metrics.totalDroppedRateMetric;
      } else {
        return metrics.totalRateMetric;
      }
    },
    [metrics.totalDroppedRateMetric, metrics.totalRateMetric]
  );

  //skip metrics with sources equals to destinations
  //sort by top total item first
  //limit to top X since multiple queries can run in parallel
  const getTopKRateMetrics = React.useCallback(
    (id: OverviewPanelId) => {
      return (
        getRateMetric(id)
          ?.[getRateFunctionFromId(id)]?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
          .map(m => toNamedMetric(t, m, truncateLength, true, true)) || []
      );
    },
    [getRateMetric, t, truncateLength]
  );

  const getNoInternalTopKRateMetrics = React.useCallback(
    (id: OverviewPanelId) => {
      return getTopKRateMetrics(id).filter(m => m.source.id !== m.destination.id);
    },
    [getTopKRateMetrics]
  );

  const getNamedTotalRateMetric = React.useCallback(
    (id: OverviewPanelId) => {
      const metric = getTotalRateMetric(id)?.[getRateFunctionFromId(id)];
      return metric ? toNamedMetric(t, metric, truncateLength, false, false) : undefined;
    },
    [getTotalRateMetric, t, truncateLength]
  );

  const getTopKDroppedStateMetrics = React.useCallback(() => {
    return metrics.droppedStateMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
  }, [metrics.droppedStateMetrics]);

  const getTopKDroppedCauseMetrics = React.useCallback(() => {
    return metrics.droppedCauseMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
  }, [metrics.droppedCauseMetrics]);

  const getTopKDnsRCodeMetrics = React.useCallback(() => {
    return metrics.dnsRCodeMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
  }, [metrics.dnsRCodeMetrics]);

  const getDnsCountTotalMetric = React.useCallback(() => {
    return metrics.totalDnsCountMetric;
  }, [metrics.totalDnsCountMetric]);

  const getTopKMetrics = React.useCallback(
    (id: OverviewPanelId) => {
      let m = undefined;
      if (id.endsWith('dns_latency')) {
        m = metrics.dnsLatencyMetrics;
      } else if (id.endsWith('rtt')) {
        m = metrics.rttMetrics;
      }

      return (
        m?.[getFunctionFromId(id)]
          ?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
          .map(m => toNamedMetric(t, m, truncateLength, true, true)) || []
      );
    },
    [metrics.dnsLatencyMetrics, metrics.rttMetrics, t, truncateLength]
  );

  const getTotalMetric = React.useCallback(
    (id: OverviewPanelId) => {
      let metric = undefined;
      if (id.endsWith('dns_latency')) {
        metric = metrics.totalDnsLatencyMetric;
      } else if (id.endsWith('rtt')) {
        metric = metrics.totalRttMetric;
      }

      return metric?.[getFunctionFromId(id)];
    },
    [metrics.totalDnsLatencyMetric, metrics.totalRttMetric]
  );

  const getNamedTotalMetric = React.useCallback(
    (id: OverviewPanelId) => {
      const metric = getTotalMetric(id);
      return metric ? toNamedMetric(t, metric, truncateLength, false, false) : undefined;
    },
    [getTotalMetric, t, truncateLength]
  );

  const getGenericMetricName = React.useCallback(
    (field: Field, value: string) => {
      switch (field) {
        case 'SrcPort':
        case 'DstPort':
          return formatPort(Number(value));
        case 'Proto':
          return formatProtocol(Number(value), t);
        case 'Dscp':
          return getDSCPServiceClassName(Number(value)) || value;
        case 'FlowDirection':
          return getDirectionDisplayString(value as FlowDirection, t);
        case 'DnsFlagsResponseCode':
          return getDNSRcodeDescription(value);
        case 'DnsErrno':
          const err = getDNSErrorDescription(Number(value));
          return err !== '' ? err : t('n/a');
        default:
          return value !== '' ? value : t('n/a');
      }
    },
    [t]
  );

  const getTopKCustomMetrics = React.useCallback(
    (id: string) => {
      return metrics.customMetrics.get(id.replaceAll(customPanelMatcher + '_', '')) || [];
    },
    [metrics.customMetrics]
  );

  const getNamedTopKCustomMetrics = React.useCallback(
    (id: string) => {
      const metrics = getTopKCustomMetrics(id);
      return (metrics
        .sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
        .map(metric => {
          if (isValidTopologyMetrics(metric)) {
            return toNamedMetric(t, metric, truncateLength, true, true);
          }
          return { ...metric, name: getGenericMetricName(metric.aggregateBy, metric.name) };
        }) || []) as NamedMetric[] | GenericMetric[];
    },
    [getGenericMetricName, getTopKCustomMetrics, t, truncateLength]
  );

  const getTotalCustomMetrics = React.useCallback(
    (id: string) => {
      return metrics.totalCustomMetrics.get(id.replaceAll(customPanelMatcher + '_', ''));
    },
    [metrics.totalCustomMetrics]
  );

  const getNamedTotalCustomMetric = React.useCallback(
    (id: OverviewPanelId) => {
      const metric = getTotalCustomMetrics(id);
      if (isValidTopologyMetrics(metric)) {
        return metric ? toNamedMetric(t, metric as TopologyMetrics, truncateLength, false, false) : undefined;
      }
      return metric;
    },
    [getTotalCustomMetrics, t, truncateLength]
  );

  const smallerTexts = truncateLength >= TruncateLength.M;
  const getPanelContent = React.useCallback(
    (id: OverviewPanelId, info: OverviewPanelInfo, isFocus: boolean, animate: boolean): PanelContent => {
      switch (id) {
        case 'overview':
          return {
            element: <>Large overview content</>,
            doubleWidth: true,
            bodyClassSmall: true
          };
        case 'top_sankey_avg_byte_rates':
        case 'top_sankey_avg_packet_rates':
        case 'top_sankey_avg_dropped_byte_rates':
        case 'top_sankey_avg_dropped_packet_rates': {
          const metrics = getTopKRateMetrics(id);
          const options = getKebabOptions(id, {
            showLast: false
          });

          return {
            element: !_.isEmpty(metrics) ? (
              <SankeyChart
                id={id}
                isDark={isDark}
                showLast={options.showLast}
                metrics={metrics}
                limit={limit}
                showLegend={!isFocus}
              />
            ) : (
              emptyGraph()
            ),
            kebab: (
              <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} isDark={isDark} />
            ),
            bodyClassSmall: true,
            doubleWidth: false
          };
        }
        case 'inbound_region':
          return { element: <>Inbound flows by region content</> };
        case 'top_avg_byte_rates':
        case 'top_avg_dropped_byte_rates':
        case 'top_avg_packet_rates':
        case 'top_avg_dropped_packet_rates': {
          const options = getKebabOptions(id, {
            showOthers: true,
            showInternal: true,
            showOutOfScope: false,
            showLast: false,
            graph: {
              type: 'donut'
            }
          });
          const metricType = id.endsWith('byte_rates') ? 'Bytes' : 'Packets';
          const metrics = getTopKRateMetrics(id);
          const namedTotalMetric = getNamedTotalRateMetric(id);
          return {
            element:
              !_.isEmpty(metrics) && namedTotalMetric ? (
                <MetricsDonut
                  id={id}
                  subTitle={info.subtitle}
                  limit={limit}
                  metricType={metricType}
                  metricFunction={'rate'}
                  topKMetrics={metrics}
                  totalMetric={namedTotalMetric}
                  showOthers={options.showOthers!}
                  showLast={options.showLast}
                  showInternal={options.showInternal!}
                  showOutOfScope={options.showOutOfScope!}
                  smallerTexts={smallerTexts}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={isDark}
                />
              ) : (
                emptyGraph()
              ),
            kebab: (
              <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} isDark={isDark} />
            ),
            bodyClassSmall: true,
            doubleWidth: false
          };
        }
        case 'byte_rates':
        case 'dropped_byte_rates':
        case 'packet_rates':
        case 'dropped_packet_rates': {
          const isDrop = id.startsWith('dropped');
          const options = getKebabOptions(id, {
            showOutOfScope: false,
            showTop: true,
            showApp: { text: t('Show total'), value: !isDrop },
            showAppDrop: isDrop ? { text: t('Show total dropped'), value: true } : undefined,
            graph: { type: 'bar' }
          });
          const showTopOnly = options.showTop && !options.showApp?.value && !options.showAppDrop?.value;
          const showTotalOnly = !options.showTop && options.showApp!.value;
          const metricType = id.endsWith('byte_rates') ? 'Bytes' : 'Packets';
          const topKMetrics = getNoInternalTopKRateMetrics(id);
          const namedTotalMetric = getNamedTotalRateMetric(id.replace('dropped_', '') as OverviewPanelId);
          const namedTotalDroppedMetric = getNamedTotalRateMetric(id);
          return {
            calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
            element: showTopOnly ? (
              <MetricsGraph
                id={id}
                metricType={metricType}
                metrics={topKMetrics}
                metricFunction="rate"
                limit={limit}
                showBar={false}
                showArea={true}
                showLine={true}
                showScatter={true}
                itemsPerRow={2}
                smallerTexts={smallerTexts}
                tooltipsTruncate={false}
                showLegend={!isFocus}
                animate={animate}
                isDark={isDark}
              />
            ) : !_.isEmpty(topKMetrics) || namedTotalMetric || namedTotalDroppedMetric ? (
              <MetricsGraphWithTotal
                id={id}
                metricType={metricType}
                metricFunction="rate"
                topKMetrics={topKMetrics}
                totalMetric={namedTotalMetric}
                totalDropMetric={namedTotalDroppedMetric}
                limit={limit}
                topAsBars={true}
                showTop={options.showTop!}
                showTotal={options.showApp?.value || false}
                showTotalDrop={options.showAppDrop?.value || false}
                showOutOfScope={options.showOutOfScope!}
                smallerTexts={smallerTexts}
                showOthers={false}
                showLegend={!isFocus}
                animate={animate}
                isDark={isDark}
              />
            ) : (
              emptyGraph()
            ),
            kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
            bodyClassSmall: false,
            doubleWidth: true
          };
        }
        case 'state_dropped_packet_rates':
        case 'cause_dropped_packet_rates': {
          const isState = id === 'state_dropped_packet_rates';
          const metricType = 'Packets'; // TODO: consider adding bytes graphs here
          const topKMetrics = isState ? getTopKDroppedStateMetrics() : getTopKDroppedCauseMetrics();
          const namedTotalMetric = getNamedTotalRateMetric(id);
          const options = getKebabOptions(id, {
            showOthers: true,
            showTop: true,
            showApp: { text: t('Show total'), value: true },
            graph: { options: ['bar_line', 'donut'], type: 'bar_line' }
          });
          const isDonut = options!.graph!.type === 'donut';
          const showTopOnly = isDonut || (options.showTop && !options.showApp!.value);
          const showTotalOnly = !options.showTop && options.showApp!.value;
          return {
            calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
            element:
              isDonut && !_.isEmpty(topKMetrics) && namedTotalMetric ? (
                <MetricsDonut
                  id={id}
                  subTitle={info.subtitle}
                  limit={limit}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={topKMetrics}
                  totalMetric={namedTotalMetric}
                  showOthers={options.showOthers!}
                  smallerTexts={smallerTexts}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={isDark}
                />
              ) : showTopOnly ? (
                <MetricsGraph
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  metrics={topKMetrics}
                  limit={limit}
                  showBar={false}
                  showArea={true}
                  showLine={true}
                  showScatter={true}
                  itemsPerRow={2}
                  smallerTexts={smallerTexts}
                  tooltipsTruncate={false}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={isDark}
                />
              ) : namedTotalMetric ? (
                <MetricsGraphWithTotal
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={topKMetrics}
                  totalMetric={namedTotalMetric}
                  limit={limit}
                  topAsBars={true}
                  showTop={options.showTop!}
                  showTotal={options.showApp!.value}
                  smallerTexts={smallerTexts}
                  showTotalDrop={false}
                  showOthers={false}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={isDark}
                />
              ) : (
                emptyGraph()
              ),
            kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
            bodyClassSmall: options.graph!.type === 'donut',
            doubleWidth: options.graph!.type !== 'donut'
          };
        }
        case 'top_avg_dns_latency':
        case 'top_max_dns_latency':
        case 'top_p90_dns_latency':
        case 'top_p99_dns_latency':
        case 'bottom_min_dns_latency':
        case 'top_avg_rtt':
        case 'top_max_rtt':
        case 'top_p90_rtt':
        case 'top_p99_rtt':
        case 'bottom_min_rtt': {
          const isAvg = id.includes('_avg_');
          const metricType = id.endsWith('Bytes')
            ? 'Bytes'
            : id.endsWith('Packets')
            ? 'Packets'
            : id.endsWith('dns_latency')
            ? 'DnsLatencyMs'
            : 'TimeFlowRttNs';
          const metrics = getTopKMetrics(id);
          const namedTotalMetric = getNamedTotalMetric(id);
          const options = getKebabOptions(id, {
            showTop: true,
            showApp: { text: t('Show overall'), value: true },
            graph: {
              options: ['donut', 'line'],
              type: isAvg ? 'line' : 'donut'
            }
          });
          const isDonut = options!.graph!.type === 'donut';
          const showTopOnly = isDonut || (options.showTop && !options.showApp!.value);
          const showTotalOnly = !options.showTop && options.showApp!.value;
          return {
            calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
            element:
              !_.isEmpty(metrics) && namedTotalMetric ? (
                options!.graph!.type === 'donut' ? (
                  <MetricsDonut
                    id={id}
                    subTitle={info.subtitle}
                    limit={limit}
                    metricType={metricType}
                    metricFunction={getFunctionFromId(id)}
                    topKMetrics={metrics}
                    totalMetric={namedTotalMetric}
                    showOthers={false}
                    smallerTexts={smallerTexts}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={isDark}
                  />
                ) : (
                  <MetricsGraphWithTotal
                    id={id}
                    metricType={metricType}
                    metricFunction={getFunctionFromId(id)}
                    topKMetrics={metrics}
                    totalMetric={namedTotalMetric}
                    limit={limit}
                    topAsBars={false}
                    showTop={options.showTop!}
                    showTotal={options.showApp!.value}
                    showInternal={false}
                    showOutOfScope={false}
                    smallerTexts={smallerTexts}
                    showTotalDrop={false}
                    showOthers={false}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={isDark}
                  />
                )
              ) : (
                emptyGraph()
              ),
            kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
            bodyClassSmall: options.graph!.type === 'donut',
            doubleWidth: options.graph!.type !== 'donut'
          };
        }
        case 'rcode_dns_latency_flows': {
          const metricType = 'DnsFlows'; // TODO: consider adding packets graphs here
          const topKMetrics = getTopKDnsRCodeMetrics();
          const namedTotalMetric = getDnsCountTotalMetric();
          const options = getKebabOptions(id, {
            showNoError: true,
            showTop: true,
            showApp: { text: t('Show total'), value: true },
            graph: { options: ['bar_line', 'donut'], type: 'donut' }
          });
          const isDonut = options!.graph!.type === 'donut';
          const showTopOnly = isDonut || (options.showTop && !options.showApp!.value);
          const showTotalOnly = !options.showTop && options.showApp!.value;
          return {
            calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
            element:
              !_.isEmpty(topKMetrics) && namedTotalMetric ? (
                isDonut ? (
                  <MetricsDonut
                    id={id}
                    subTitle={info.subtitle}
                    limit={limit}
                    metricType={metricType}
                    metricFunction="sum"
                    topKMetrics={topKMetrics}
                    totalMetric={namedTotalMetric}
                    showOthers={options.showNoError!}
                    othersName={'NoError'}
                    smallerTexts={smallerTexts}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={isDark}
                  />
                ) : (
                  <MetricsGraphWithTotal
                    id={id}
                    metricType={metricType}
                    metricFunction="sum"
                    topKMetrics={topKMetrics}
                    totalMetric={namedTotalMetric}
                    limit={limit}
                    topAsBars={true}
                    showTop={options.showTop!}
                    showTotal={options.showApp!.value}
                    showOthers={options.showNoError!}
                    othersName={'NoError'}
                    smallerTexts={smallerTexts}
                    showTotalDrop={false}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={isDark}
                  />
                )
              ) : (
                emptyGraph()
              ),
            kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
            bodyClassSmall: options.graph!.type === 'donut',
            doubleWidth: options.graph!.type !== 'donut'
          };
        }
        default: {
          const parsedId = parseCustomMetricId(id);
          if (parsedId.isValid) {
            const metricType = parsedId.type!;
            const metricFunction = parsedId.fn || 'avg';
            const topKMetrics = getNamedTopKCustomMetrics(id);
            const namedTotalMetric = getNamedTotalCustomMetric(id);
            const options = getKebabOptions(id, {
              showTop: true,
              showApp: { text: t('Show total'), value: true },
              graph: { options: ['bar_line', 'donut'], type: 'donut' }
            });
            const isDonut = options!.graph!.type === 'donut';
            const showTopOnly = isDonut || (options.showTop && !options.showApp!.value);
            const showTotalOnly = !options.showTop && options.showApp!.value;
            return {
              calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
              element:
                !_.isEmpty(topKMetrics) && namedTotalMetric ? (
                  isDonut ? (
                    <MetricsDonut
                      id={id}
                      subTitle={info.subtitle}
                      limit={limit}
                      metricType={metricType}
                      metricFunction={metricFunction}
                      topKMetrics={topKMetrics}
                      totalMetric={namedTotalMetric}
                      showOthers={false}
                      smallerTexts={smallerTexts}
                      showLegend={!isFocus}
                      animate={animate}
                      isDark={isDark}
                    />
                  ) : (
                    <MetricsGraphWithTotal
                      id={id}
                      metricType={metricType}
                      metricFunction={metricFunction}
                      topKMetrics={topKMetrics}
                      totalMetric={namedTotalMetric}
                      limit={limit}
                      topAsBars={true}
                      showTop={options.showTop!}
                      showTotal={options.showApp!.value}
                      showOthers={false}
                      smallerTexts={smallerTexts}
                      showTotalDrop={false}
                      showLegend={!isFocus}
                      animate={animate}
                      isDark={isDark}
                    />
                  )
                ) : (
                  emptyGraph()
                ),
              kebab: <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />,
              bodyClassSmall: options.graph!.type === 'donut',
              doubleWidth: options.graph!.type !== 'donut'
            };
          } else {
            return {
              element: <></>
            };
          }
        }
      }
    },
    [
      emptyGraph,
      getKebabOptions,
      getDnsCountTotalMetric,
      getNamedTotalMetric,
      getNamedTotalRateMetric,
      getNoInternalTopKRateMetrics,
      getTopKDnsRCodeMetrics,
      getTopKDroppedCauseMetrics,
      getTopKDroppedStateMetrics,
      getTopKMetrics,
      getTopKRateMetrics,
      getNamedTopKCustomMetrics,
      getNamedTotalCustomMetric,
      isDark,
      limit,
      setKebabOptions,
      smallerTexts,
      t
    ]
  );

  const getPanelView = React.useCallback(
    (panel: OverviewPanel, i?: number) => {
      const info = getOverviewPanelInfo(t, panel.id, limit, recordType === 'flowLog' ? t('flow') : t('conversation'));
      const isFocus = i === undefined;
      const animate =
        isFocus &&
        wasAllowFocus === true &&
        previousSelectedPanel !== undefined &&
        previousSelectedPanel.id !== selectedPanel?.id;
      const isFocusable = (panels.length > 1 && allowFocus == false) || isFocus;
      const isFocusListItem = !isFocus && allowFocus == true;
      const content = getPanelContent(panel.id, info, isFocusListItem, animate);
      return (
        <NetflowOverviewPanel
          id={panel.id}
          key={i}
          bodyClassName={
            isFocusListItem
              ? 'overview-panel-body-compact'
              : isFocus || isFocusListItem || (isFocusable && !!content.bodyClassSmall)
              ? 'overview-panel-body-small'
              : 'overview-panel-body'
          }
          doubleWidth={allowFocus || !!content.doubleWidth}
          title={content.calculatedTitle || info.title}
          titleTooltip={info.tooltip}
          kebab={content.kebab}
          onClick={isFocusListItem ? () => setSelectedPanel(panel) : undefined}
          focusOn={
            isFocusable && setFocus
              ? (id?: string) => {
                  setSelectedPanel(panels.find(p => p.id === id));
                  setFocus(!allowFocus);
                }
              : undefined
          }
          isSelected={isFocusListItem && selectedPanel?.id === panel.id}
          isFocus={isFocus}
        >
          {content.element}
        </NetflowOverviewPanel>
      );
    },
    [
      t,
      limit,
      recordType,
      wasAllowFocus,
      previousSelectedPanel,
      selectedPanel,
      panels,
      allowFocus,
      getPanelContent,
      setFocus
    ]
  );

  const getContent = React.useCallback(() => {
    // avoid drawing graphs before having container size
    if (containerSize.width === 0 || containerSize.height === 0) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    }

    return (
      <>
        {allowFocus && selectedPanel && (
          <div
            id="overview-absolute-graph"
            style={{
              position: 'absolute',
              top: offsetTop,
              right: containerSize.width / 5 + sidePanelWidth,
              height: containerSize.height,
              overflow: 'hidden',
              width: (containerSize.width * 4) / 5,
              padding: `${containerPadding}px ${cardPadding}px ${containerPadding}px ${containerPadding}px`
            }}
          >
            {getPanelView(selectedPanel)}
          </div>
        )}
        <div
          id="overview-graph-list"
          style={
            allowFocus
              ? {
                  width: containerSize.width / 5 - containerPadding,
                  marginLeft: (containerSize.width * 4) / 5 - containerPadding
                }
              : undefined
          }
        >
          <Flex id="overview-flex" justifyContent={{ default: 'justifyContentSpaceBetween' }}>
            {panels.map((panel, i) => getPanelView(panel, i))}
          </Flex>
        </div>
      </>
    );
  }, [
    containerSize,
    allowFocus,
    selectedPanel,
    offsetTop,
    sidePanelWidth,
    containerPadding,
    cardPadding,
    getPanelView,
    panels
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: `${containerPadding}px 0 ${containerPadding}px ${containerPadding}px`
      }}
      ref={containerRef}
    >
      {getContent()}
    </div>
  );
};

export default NetflowOverview;
