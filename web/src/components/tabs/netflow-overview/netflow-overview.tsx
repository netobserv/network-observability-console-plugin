import { Bullseye, Flex, Spinner } from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Field, FlowDirection, getDirectionDisplayString } from '../../../api/ipfix';
import {
  FlowMetricsResult,
  FunctionMetrics,
  GenericMetric,
  initFunctionMetricKeys,
  initRateMetricKeys,
  isValidTopologyMetrics,
  NamedMetric,
  NetflowMetrics,
  RateMetrics,
  Stats,
  TopologyMetrics,
  TotalFunctionMetrics,
  TotalRateMetrics
} from '../../../api/loki';
import { getFlowGenericMetrics } from '../../../api/routes';
import { ScopeSlider } from '../../../components/slider/scope-slider';
import { Config, Feature } from '../../../model/config';
import { FlowQuery, FlowScope, RecordType } from '../../../model/flow-query';
import { getStat } from '../../../model/metrics';
import { ScopeConfigDef } from '../../../model/scope';
import { TimeRange } from '../../../utils/datetime';
import { getDNSErrorDescription, getDNSRcodeDescription } from '../../../utils/dns';
import { getDSCPServiceClassName } from '../../../utils/dscp';
import { localStorageOverviewKebabKey, useLocalStorage } from '../../../utils/local-storage-hook';
import { observeDOMRect, toNamedMetric } from '../../../utils/metrics-helper';
import {
  customPanelMatcher,
  dnsIdMatcher,
  droppedIdMatcher,
  getFunctionFromId,
  getOverviewPanelInfo,
  getRateFunctionFromId,
  OverviewPanel,
  OverviewPanelId,
  OverviewPanelInfo,
  parseCustomMetricId,
  rttIdMatcher
} from '../../../utils/overview-panels';
import { convertRemToPixels } from '../../../utils/panel';
import { formatPort } from '../../../utils/port';
import { usePrevious } from '../../../utils/previous-hook';
import { formatProtocol } from '../../../utils/protocol';
import { TruncateLength } from '../../dropdowns/truncate-dropdown';
import { Empty } from '../../messages/empty';
import { MetricsDonut } from '../../metrics/metrics-donut';
import { MetricsGraph } from '../../metrics/metrics-graph';
import { MetricsGraphWithTotal } from '../../metrics/metrics-graph-total';
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

export type NetflowOverviewHandle = {
  fetch: (
    fq: FlowQuery,
    metricScope: FlowScope,
    range: number | TimeRange,
    features: Feature[],
    metricsRef: React.MutableRefObject<NetflowMetrics>,
    getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
    setMetrics: (v: NetflowMetrics) => void,
    initFunction: () => void
  ) => Promise<Stats[]> | undefined;
};

export interface NetflowOverviewProps {
  ref?: React.Ref<NetflowOverviewHandle>;
  limit: number;
  panels: OverviewPanel[];
  recordType: RecordType;
  metrics: NetflowMetrics;
  loading?: boolean;
  isDark?: boolean;
  resetDefaultFilters?: (c?: Config) => void;
  clearFilters?: () => void;
  truncateLength: TruncateLength;
  focus?: boolean;
  setFocus?: (v: boolean) => void;
  forcedSize?: DOMRect;
  metricScope: FlowScope;
  setMetricScope: (ms: FlowScope) => void;
  scopes: ScopeConfigDef[];
}

// eslint-disable-next-line react/display-name
export const NetflowOverview: React.FC<NetflowOverviewProps> = React.forwardRef(
  (props, ref: React.Ref<NetflowOverviewHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    const fetch = React.useCallback(
      (
        fq: FlowQuery,
        metricScope: FlowScope,
        range: number | TimeRange,
        features: Feature[],
        metricsRef: React.MutableRefObject<NetflowMetrics>,
        getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
        setMetrics: (v: NetflowMetrics) => void,
        initFunction: () => void
      ) => {
        initFunction();

        let currentMetrics = metricsRef.current;
        const promises: Promise<Stats>[] = [];

        const ratePanels = props.panels.filter(p => p.id.endsWith('_rates'));
        const totalDroppedPanels = props.panels.filter(p => p.id.startsWith('dropped_'));
        if (!_.isEmpty(ratePanels) || !_.isEmpty(totalDroppedPanels)) {
          if (!_.isEmpty(ratePanels)) {
            //run queries for bytes / packets rates
            const rateMetrics = initRateMetricKeys(ratePanels.map(p => p.id)) as RateMetrics;
            (Object.keys(rateMetrics) as (keyof typeof rateMetrics)[]).map(key => {
              promises.push(
                getMetrics({ ...fq, function: 'rate', type: key === 'bytes' ? 'Bytes' : 'Packets' }, range).then(
                  res => {
                    //set matching value and apply changes on the entire object to trigger refresh
                    rateMetrics[key] = res.metrics;
                    currentMetrics = { ...currentMetrics, rateMetrics };
                    setMetrics(currentMetrics);
                    return res.stats;
                  }
                )
              );
            });
          }
          //run queries for total bytes / packets rates
          const totalRateMetric = initRateMetricKeys(
            [...ratePanels, ...totalDroppedPanels].map(p => p.id)
          ) as TotalRateMetrics;
          (Object.keys(totalRateMetric) as (keyof typeof totalRateMetric)[]).map(key => {
            promises.push(
              getMetrics(
                { ...fq, function: 'rate', aggregateBy: 'app', type: key === 'bytes' ? 'Bytes' : 'Packets' },
                range
              ).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                totalRateMetric[key] = res.metrics[0];
                currentMetrics = { ...currentMetrics, totalRateMetric };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });
        } else {
          currentMetrics = { ...currentMetrics, rateMetrics: undefined, totalRateMetric: undefined };
          setMetrics(currentMetrics);
        }

        const droppedPanels = props.panels.filter(p => p.id.includes(droppedIdMatcher));
        if (!_.isEmpty(droppedPanels)) {
          //run same queries for drops
          const droppedRateMetrics = initRateMetricKeys(droppedPanels.map(p => p.id)) as RateMetrics;
          (Object.keys(droppedRateMetrics) as (keyof typeof droppedRateMetrics)[]).map(key => {
            promises.push(
              getMetrics(
                { ...fq, function: 'rate', type: key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets' },
                range
              ).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                droppedRateMetrics[key] = res.metrics;
                currentMetrics = { ...currentMetrics, droppedRateMetrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });

          const totalDroppedRateMetric = initRateMetricKeys(droppedPanels.map(p => p.id)) as TotalRateMetrics;
          (Object.keys(totalDroppedRateMetric) as (keyof typeof totalDroppedRateMetric)[]).map(key => {
            promises.push(
              getMetrics(
                {
                  ...fq,
                  function: 'rate',
                  aggregateBy: 'app',
                  type: key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets'
                },
                range
              ).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                totalDroppedRateMetric[key] = res.metrics[0];
                currentMetrics = { ...currentMetrics, totalDroppedRateMetric };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });

          //get drop state & cause
          promises.push(
            ...[
              getFlowGenericMetrics(
                { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestState' },
                range
              ).then(res => {
                currentMetrics = { ...currentMetrics, droppedStateMetrics: res.metrics };
                setMetrics(currentMetrics);
                return res.stats;
              }),
              getFlowGenericMetrics(
                { ...fq, function: 'rate', type: 'PktDropPackets', aggregateBy: 'PktDropLatestDropCause' },
                range
              ).then(res => {
                currentMetrics = { ...currentMetrics, droppedCauseMetrics: res.metrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
            ]
          );
        } else {
          setMetrics({
            ...currentMetrics,
            droppedRateMetrics: undefined,
            totalDroppedRateMetric: undefined,
            droppedStateMetrics: undefined,
            droppedCauseMetrics: undefined
          });
        }

        const dnsPanels = props.panels.filter(p => p.id.includes(dnsIdMatcher));
        if (features.includes('dnsTracking') && !_.isEmpty(dnsPanels)) {
          //set dns metrics
          const dnsLatencyMetrics = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as FunctionMetrics;
          (Object.keys(dnsLatencyMetrics) as (keyof typeof dnsLatencyMetrics)[]).map(fn => {
            promises.push(
              getMetrics({ ...fq, function: fn, type: 'DnsLatencyMs' }, range).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                dnsLatencyMetrics[fn] = res.metrics;
                currentMetrics = { ...currentMetrics, dnsLatencyMetrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });

          const totalDnsLatencyMetric = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as TotalFunctionMetrics;
          (Object.keys(totalDnsLatencyMetric) as (keyof typeof totalDnsLatencyMetric)[]).map(fn => {
            promises.push(
              getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'DnsLatencyMs' }, range).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                totalDnsLatencyMetric[fn] = res.metrics[0];
                currentMetrics = { ...currentMetrics, totalDnsLatencyMetric };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });

          //set rcode metrics
          if (dnsPanels.some(p => p.id.includes('rcode_dns_latency_flows'))) {
            promises.push(
              ...[
                //get dns response codes
                getFlowGenericMetrics(
                  { ...fq, aggregateBy: 'DnsFlagsResponseCode', function: 'count', type: 'DnsFlows' },
                  range
                ).then(res => {
                  currentMetrics = { ...currentMetrics, dnsRCodeMetrics: res.metrics };
                  setMetrics(currentMetrics);
                  return res.stats;
                }),
                getFlowGenericMetrics({ ...fq, aggregateBy: 'app', function: 'count', type: 'DnsFlows' }, range).then(
                  res => {
                    currentMetrics = { ...currentMetrics, totalDnsCountMetric: res.metrics[0] };
                    setMetrics(currentMetrics);
                    return res.stats;
                  }
                )
              ]
            );
          }
        } else {
          setMetrics({
            ...currentMetrics,
            dnsLatencyMetrics: undefined,
            dnsRCodeMetrics: undefined,
            totalDnsLatencyMetric: undefined,
            totalDnsCountMetric: undefined
          });
        }

        const rttPanels = props.panels.filter(p => p.id.includes(rttIdMatcher));
        if (features.includes('flowRTT') && !_.isEmpty(rttPanels)) {
          //set RTT metrics
          const rttMetrics = initFunctionMetricKeys(rttPanels.map(p => p.id)) as FunctionMetrics;
          (Object.keys(rttMetrics) as (keyof typeof rttMetrics)[]).map(fn => {
            promises.push(
              getMetrics({ ...fq, function: fn, type: 'TimeFlowRttNs' }, range).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                rttMetrics[fn] = res.metrics;
                currentMetrics = { ...currentMetrics, rttMetrics };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });

          const totalRttMetric = initFunctionMetricKeys(rttPanels.map(p => p.id)) as TotalFunctionMetrics;
          (Object.keys(totalRttMetric) as (keyof typeof totalRttMetric)[]).map(fn => {
            promises.push(
              getMetrics({ ...fq, function: fn, aggregateBy: 'app', type: 'TimeFlowRttNs' }, range).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                totalRttMetric[fn] = res.metrics[0];
                currentMetrics = { ...currentMetrics, totalRttMetric };
                setMetrics(currentMetrics);
                return res.stats;
              })
            );
          });
        } else {
          setMetrics({ ...currentMetrics, rttMetrics: undefined, totalRttMetric: undefined });
        }

        const customPanels = props.panels.filter(p => p.id.startsWith(customPanelMatcher));
        if (!_.isEmpty(customPanels)) {
          //set custom metrics
          customPanels
            .map(p => p.id)
            .forEach(id => {
              const parsedId = parseCustomMetricId(id);
              const key = id.replaceAll(customPanelMatcher + '_', '');
              const getMetricFunc = parsedId.aggregateBy ? getFlowGenericMetrics : getMetrics;
              if (parsedId.isValid) {
                promises.push(
                  ...[
                    getMetricFunc(
                      {
                        ...fq,
                        type: parsedId.type,
                        function: parsedId.fn,
                        aggregateBy: parsedId.aggregateBy || metricScope
                      },
                      range
                    ).then(res => {
                      //set matching value and apply changes on the entire object to trigger refresh
                      currentMetrics = {
                        ...currentMetrics,
                        customMetrics: currentMetrics.customMetrics.set(key, res.metrics)
                      };
                      setMetrics(currentMetrics);
                      return res.stats;
                    }),
                    getMetricFunc(
                      {
                        ...fq,
                        type: parsedId.type,
                        function: parsedId.fn,
                        aggregateBy: 'app'
                      },
                      range
                    ).then(res => {
                      //set matching value and apply changes on the entire object to trigger refresh
                      currentMetrics = {
                        ...currentMetrics,
                        totalCustomMetrics: currentMetrics.totalCustomMetrics.set(key, res.metrics[0])
                      };
                      setMetrics(currentMetrics);
                      return res.stats;
                    })
                  ]
                );
              }
            });
        }

        return Promise.all(promises);
      },
      [props.panels]
    );

    React.useImperativeHandle(ref, () => ({
      fetch
    }));

    const [kebabMap, setKebabMap] = useLocalStorage<Map<OverviewPanelId, PanelKebabOptions>>(
      localStorageOverviewKebabKey,
      new Map<OverviewPanelId, PanelKebabOptions>()
    );
    const [selectedPanel, setSelectedPanel] = React.useState<OverviewPanel | undefined>();
    const previousSelectedPanel = usePrevious(selectedPanel);

    const containerPadding = convertRemToPixels(2);
    const cardPadding = convertRemToPixels(0.5);

    const containerRef = React.createRef<HTMLDivElement>();
    const [containerSize, setContainerSize] = React.useState<DOMRect>(
      props.forcedSize || ({ width: 0, height: 0 } as DOMRect)
    );
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

    const emptyGraph = React.useCallback(
      (showDetails: boolean) => {
        return (
          <div className="emptygraph">
            {props.loading ? (
              <Bullseye data-test="loading-contents">
                <Spinner size="xl" />
              </Bullseye>
            ) : (
              <Bullseye data-test="no-results-found">
                <Empty
                  showDetails={showDetails}
                  resetDefaultFilters={props.resetDefaultFilters}
                  clearFilters={props.clearFilters}
                />
              </Bullseye>
            )}
          </div>
        );
      },
      [props.resetDefaultFilters, props.clearFilters, props.loading]
    );

    React.useEffect(() => {
      observeDOMRect(containerRef, containerSize, setContainerSize);
      setSidePanelWidth(document.getElementById('summaryPanel')?.clientWidth || 0);
      setOffsetTop(containerRef.current?.offsetTop || 0);
    }, [containerRef, containerSize]);

    React.useEffect(() => {
      if (props.panels.length && (selectedPanel === undefined || !props.panels.find(p => p.id === selectedPanel.id))) {
        setSelectedPanel(props.panels[0]);
      }
    }, [props.panels, selectedPanel]);

    //allow focus only when prop is true and multiple panels selected
    const allowFocus = props.focus === true && props.panels.length > 1;
    const wasAllowFocus = usePrevious(allowFocus);

    const getRateMetric = React.useCallback(
      (id: OverviewPanelId) => {
        if (id.includes('dropped')) {
          return props.metrics.droppedRateMetrics;
        } else {
          return props.metrics.rateMetrics;
        }
      },
      [props.metrics.droppedRateMetrics, props.metrics.rateMetrics]
    );

    const getTotalRateMetric = React.useCallback(
      (id: OverviewPanelId) => {
        if (id.includes('dropped')) {
          return props.metrics.totalDroppedRateMetric;
        } else {
          return props.metrics.totalRateMetric;
        }
      },
      [props.metrics.totalDroppedRateMetric, props.metrics.totalRateMetric]
    );

    //skip metrics with sources equals to destinations
    //sort by top total item first
    //limit to top X since multiple queries can run in parallel
    const getTopKRateMetrics = React.useCallback(
      (id: OverviewPanelId) => {
        return (
          getRateMetric(id)
            ?.[getRateFunctionFromId(id)]?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
            .map(m => toNamedMetric(t, m, props.truncateLength, true, true)) || []
        );
      },
      [getRateMetric, t, props.truncateLength]
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
        return metric ? toNamedMetric(t, metric, props.truncateLength, false, false) : undefined;
      },
      [getTotalRateMetric, t, props.truncateLength]
    );

    const getTopKDroppedStateMetrics = React.useCallback(() => {
      return props.metrics.droppedStateMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
    }, [props.metrics.droppedStateMetrics]);

    const getTopKDroppedCauseMetrics = React.useCallback(() => {
      return props.metrics.droppedCauseMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
    }, [props.metrics.droppedCauseMetrics]);

    const getTopKDnsRCodeMetrics = React.useCallback(() => {
      return props.metrics.dnsRCodeMetrics?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum')) || [];
    }, [props.metrics.dnsRCodeMetrics]);

    const getDnsCountTotalMetric = React.useCallback(() => {
      return props.metrics.totalDnsCountMetric;
    }, [props.metrics.totalDnsCountMetric]);

    const getTopKMetrics = React.useCallback(
      (id: OverviewPanelId) => {
        let m = undefined;
        if (id.endsWith('dns_latency')) {
          m = props.metrics.dnsLatencyMetrics;
        } else if (id.endsWith('rtt')) {
          m = props.metrics.rttMetrics;
        }

        return (
          m?.[getFunctionFromId(id)]
            ?.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
            .map(m => toNamedMetric(t, m, props.truncateLength, true, true)) || []
        );
      },
      [props.metrics.dnsLatencyMetrics, props.metrics.rttMetrics, t, props.truncateLength]
    );

    const getTotalMetric = React.useCallback(
      (id: OverviewPanelId) => {
        let metric = undefined;
        if (id.endsWith('dns_latency')) {
          metric = props.metrics.totalDnsLatencyMetric;
        } else if (id.endsWith('rtt')) {
          metric = props.metrics.totalRttMetric;
        }

        return metric?.[getFunctionFromId(id)];
      },
      [props.metrics.totalDnsLatencyMetric, props.metrics.totalRttMetric]
    );

    const getNamedTotalMetric = React.useCallback(
      (id: OverviewPanelId) => {
        const metric = getTotalMetric(id);
        return metric ? toNamedMetric(t, metric, props.truncateLength, false, false) : undefined;
      },
      [getTotalMetric, t, props.truncateLength]
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
        return props.metrics.customMetrics.get(id.replaceAll(customPanelMatcher + '_', '')) || [];
      },
      [props.metrics.customMetrics]
    );

    const getNamedTopKCustomMetrics = React.useCallback(
      (id: string) => {
        const metrics = getTopKCustomMetrics(id);
        return (metrics
          .sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
          .map(metric => {
            if (isValidTopologyMetrics(metric)) {
              return toNamedMetric(t, metric, props.truncateLength, true, true);
            }
            return { ...metric, name: getGenericMetricName(metric.aggregateBy, metric.name) };
          }) || []) as NamedMetric[] | GenericMetric[];
      },
      [getGenericMetricName, getTopKCustomMetrics, t, props.truncateLength]
    );

    const getTotalCustomMetrics = React.useCallback(
      (id: string) => {
        return props.metrics.totalCustomMetrics.get(id.replaceAll(customPanelMatcher + '_', ''));
      },
      [props.metrics.totalCustomMetrics]
    );

    const getNamedTotalCustomMetric = React.useCallback(
      (id: OverviewPanelId) => {
        const metric = getTotalCustomMetrics(id);
        if (isValidTopologyMetrics(metric)) {
          return metric ? toNamedMetric(t, metric as TopologyMetrics, props.truncateLength, false, false) : undefined;
        }
        return metric;
      },
      [getTotalCustomMetrics, t, props.truncateLength]
    );

    const smallerTexts = props.truncateLength >= TruncateLength.M;
    const getPanelContent = React.useCallback(
      (id: OverviewPanelId, info: OverviewPanelInfo, isFocus: boolean, animate: boolean): PanelContent => {
        switch (id) {
          case 'overview':
            return {
              element: <>Large overview content</>,
              doubleWidth: true,
              bodyClassSmall: true
            };
          case 'top_sankey':
            return { element: <>Sankey content</> };
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
                    limit={props.limit}
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
                    isDark={props.isDark}
                  />
                ) : (
                  emptyGraph(!isFocus)
                ),
              kebab: (
                <PanelKebab
                  id={id}
                  options={options}
                  setOptions={opts => setKebabOptions(id, opts)}
                  isDark={props.isDark}
                />
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
                  limit={props.limit}
                  showBar={false}
                  showArea={true}
                  showLine={true}
                  showScatter={true}
                  itemsPerRow={2}
                  smallerTexts={smallerTexts}
                  tooltipsTruncate={false}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={props.isDark}
                />
              ) : !_.isEmpty(topKMetrics) || namedTotalMetric || namedTotalDroppedMetric ? (
                <MetricsGraphWithTotal
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={topKMetrics}
                  totalMetric={namedTotalMetric}
                  totalDropMetric={namedTotalDroppedMetric}
                  limit={props.limit}
                  topAsBars={true}
                  showTop={options.showTop!}
                  showTotal={options.showApp?.value || false}
                  showTotalDrop={options.showAppDrop?.value || false}
                  showOutOfScope={options.showOutOfScope!}
                  smallerTexts={smallerTexts}
                  showOthers={false}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={props.isDark}
                />
              ) : (
                emptyGraph(!isFocus)
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
                    limit={props.limit}
                    metricType={metricType}
                    metricFunction="rate"
                    topKMetrics={topKMetrics}
                    totalMetric={namedTotalMetric}
                    showOthers={options.showOthers!}
                    smallerTexts={smallerTexts}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={props.isDark}
                  />
                ) : showTopOnly ? (
                  <MetricsGraph
                    id={id}
                    metricType={metricType}
                    metricFunction="rate"
                    metrics={topKMetrics}
                    limit={props.limit}
                    showBar={false}
                    showArea={true}
                    showLine={true}
                    showScatter={true}
                    itemsPerRow={2}
                    smallerTexts={smallerTexts}
                    tooltipsTruncate={false}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={props.isDark}
                  />
                ) : namedTotalMetric ? (
                  <MetricsGraphWithTotal
                    id={id}
                    metricType={metricType}
                    metricFunction="rate"
                    topKMetrics={topKMetrics}
                    totalMetric={namedTotalMetric}
                    limit={props.limit}
                    topAsBars={true}
                    showTop={options.showTop!}
                    showTotal={options.showApp!.value}
                    smallerTexts={smallerTexts}
                    showTotalDrop={false}
                    showOthers={false}
                    showLegend={!isFocus}
                    animate={animate}
                    isDark={props.isDark}
                  />
                ) : (
                  emptyGraph(!isFocus)
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
                      limit={props.limit}
                      metricType={metricType}
                      metricFunction={getFunctionFromId(id)}
                      topKMetrics={metrics}
                      totalMetric={namedTotalMetric}
                      showOthers={false}
                      smallerTexts={smallerTexts}
                      showLegend={!isFocus}
                      animate={animate}
                      isDark={props.isDark}
                    />
                  ) : (
                    <MetricsGraphWithTotal
                      id={id}
                      metricType={metricType}
                      metricFunction={getFunctionFromId(id)}
                      topKMetrics={metrics}
                      totalMetric={namedTotalMetric}
                      limit={props.limit}
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
                      isDark={props.isDark}
                    />
                  )
                ) : (
                  emptyGraph(!isFocus)
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
                      limit={props.limit}
                      metricType={metricType}
                      metricFunction="sum"
                      topKMetrics={topKMetrics}
                      totalMetric={namedTotalMetric}
                      showOthers={options.showNoError!}
                      othersName={'NoError'}
                      smallerTexts={smallerTexts}
                      showLegend={!isFocus}
                      animate={animate}
                      isDark={props.isDark}
                    />
                  ) : (
                    <MetricsGraphWithTotal
                      id={id}
                      metricType={metricType}
                      metricFunction="sum"
                      topKMetrics={topKMetrics}
                      totalMetric={namedTotalMetric}
                      limit={props.limit}
                      topAsBars={true}
                      showTop={options.showTop!}
                      showTotal={options.showApp!.value}
                      showOthers={options.showNoError!}
                      othersName={'NoError'}
                      smallerTexts={smallerTexts}
                      showTotalDrop={false}
                      showLegend={!isFocus}
                      animate={animate}
                      isDark={props.isDark}
                    />
                  )
                ) : (
                  emptyGraph(!isFocus)
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
                        limit={props.limit}
                        metricType={metricType}
                        metricFunction={metricFunction}
                        topKMetrics={topKMetrics}
                        totalMetric={namedTotalMetric}
                        showOthers={false}
                        smallerTexts={smallerTexts}
                        showLegend={!isFocus}
                        animate={animate}
                        isDark={props.isDark}
                      />
                    ) : (
                      <MetricsGraphWithTotal
                        id={id}
                        metricType={metricType}
                        metricFunction={metricFunction}
                        topKMetrics={topKMetrics}
                        totalMetric={namedTotalMetric}
                        limit={props.limit}
                        topAsBars={true}
                        showTop={options.showTop!}
                        showTotal={options.showApp!.value}
                        showOthers={false}
                        smallerTexts={smallerTexts}
                        showTotalDrop={false}
                        showLegend={!isFocus}
                        animate={animate}
                        isDark={props.isDark}
                      />
                    )
                  ) : (
                    emptyGraph(!isFocus)
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
        props.isDark,
        props.limit,
        setKebabOptions,
        smallerTexts,
        t
      ]
    );

    const getPanelView = React.useCallback(
      (panel: OverviewPanel, i?: number) => {
        const info = getOverviewPanelInfo(
          t,
          panel.id,
          props.limit,
          props.recordType === 'flowLog' ? t('flow') : t('conversation')
        );
        const isFocus = i === undefined;
        const animate =
          isFocus &&
          wasAllowFocus === true &&
          previousSelectedPanel !== undefined &&
          previousSelectedPanel.id !== selectedPanel?.id;
        const isFocusable = (props.panels.length > 1 && allowFocus == false) || isFocus;
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
              isFocusable
                ? (id?: string) => {
                    setSelectedPanel(props.panels.find(p => p.id === id));
                    props.setFocus ? props.setFocus(!allowFocus) : undefined;
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
      [t, props, wasAllowFocus, previousSelectedPanel, selectedPanel, allowFocus, getPanelContent]
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
          {!allowFocus && (
            <div
              id={'overview-scope-slider-div'}
              style={{
                position: 'absolute',
                top: offsetTop,
                right: containerSize.width * 0.92 + sidePanelWidth,
                height: containerSize.height,
                overflow: 'hidden',
                alignContent: 'center',
                width: containerSize.width * 0.1
              }}
            >
              <ScopeSlider scope={props.metricScope} setScope={props.setMetricScope} scopeDefs={props.scopes} />
            </div>
          )}
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
                : {
                    marginLeft: containerSize.width * 0.075
                  }
            }
          >
            <Flex id="overview-flex" justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              {props.panels.map((panel, i) => getPanelView(panel, i))}
            </Flex>
          </div>
        </>
      );
    }, [
      containerSize.width,
      containerSize.height,
      props.metricScope,
      props.setMetricScope,
      props.scopes,
      props.panels,
      allowFocus,
      selectedPanel,
      offsetTop,
      sidePanelWidth,
      containerPadding,
      cardPadding,
      getPanelView
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
  }
);

export default NetflowOverview;
