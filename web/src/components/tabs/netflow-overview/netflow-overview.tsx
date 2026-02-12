import { Bullseye, Flex, Spinner } from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Field, FlowDirection, getDirectionDisplayString } from '../../../api/ipfix';
import {
  FlowMetricsResult,
  FunctionMetrics,
  GenericMetric,
  GenericMetricsResult,
  initFunctionMetricKeys,
  initRateMetricKeys,
  isValidTopologyMetrics,
  MetricStats,
  NamedMetric,
  NetflowMetrics,
  RateMetrics,
  Stats,
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
import { getHTTPErrorDetails } from '../../../utils/errors';
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
import { Result } from '../../../utils/result';
import { TruncateLength } from '../../dropdowns/truncate-dropdown';
import { Empty } from '../../messages/empty';
import { PanelErrorIndicator } from '../../messages/panel-error-indicator';
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

const emptyStats = { numQueries: 0, limitReached: false, dataSources: [] } as Stats;

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
        baseQuery: FlowQuery,
        metricScope: FlowScope,
        range: number | TimeRange,
        features: Feature[],
        metricsRef: React.MutableRefObject<NetflowMetrics>,
        getMetrics: (q: FlowQuery, range: number | TimeRange) => Promise<FlowMetricsResult>,
        setMetrics: (v: NetflowMetrics) => void,
        initFunction: () => void
      ) => {
        initFunction();

        // Don't reset errors immediately to avoid banner flashing
        // Errors will be collected fresh during this fetch
        let currentMetrics = { ...metricsRef.current };
        const promises: Promise<Stats>[] = [];

        const ratePanels = props.panels.filter(p => p.id.endsWith('_rates'));
        const totalDroppedPanels = props.panels.filter(p => p.id.startsWith('dropped_'));
        if (!_.isEmpty(ratePanels) || !_.isEmpty(totalDroppedPanels)) {
          if (!_.isEmpty(ratePanels)) {
            //run queries for bytes / packets rates
            const rateMetrics = initRateMetricKeys(ratePanels.map(p => p.id)) as RateMetrics;
            (Object.keys(rateMetrics) as (keyof typeof rateMetrics)[]).map(key => {
              const metricType = key === 'bytes' ? 'Bytes' : 'Packets';
              const fq: FlowQuery = { ...baseQuery, function: 'rate', type: metricType };
              promises.push(
                Result.fromPromise(getMetrics(fq, range)).then(res => {
                  //set matching value and apply changes on the entire object to trigger refresh
                  const rate = res
                    .map(success => {
                      rateMetrics[key] = success.metrics;
                      return rateMetrics;
                    })
                    .mapError(err => t('{{metricType}} Rate: ', { metricType }) + getHTTPErrorDetails(err, true));
                  currentMetrics = { ...currentMetrics, rate };
                  setMetrics(currentMetrics);
                  return res.map(r => r.stats).or(emptyStats);
                })
              );
            });
          }
          //run queries for total bytes / packets rates
          const totalRateMetric = initRateMetricKeys(
            [...ratePanels, ...totalDroppedPanels].map(p => p.id)
          ) as TotalRateMetrics;
          (Object.keys(totalRateMetric) as (keyof typeof totalRateMetric)[]).map(key => {
            const metricType = key === 'bytes' ? 'Bytes' : 'Packets';
            const fq: FlowQuery = { ...baseQuery, function: 'rate', aggregateBy: 'app', type: metricType };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                const totalRate = res
                  .map(success => {
                    totalRateMetric[key] = success.metrics[0];
                    return totalRateMetric;
                  })
                  .mapError(err => t('Total {{metricType}} Rate: ', { metricType }) + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, totalRate };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });
        } else {
          currentMetrics = { ...currentMetrics, rate: undefined, totalRate: undefined };
          setMetrics(currentMetrics);
        }

        const droppedPanels = props.panels.filter(p => p.id.includes(droppedIdMatcher));
        if (!_.isEmpty(droppedPanels)) {
          //run same queries for drops
          const droppedRateMetrics = initRateMetricKeys(droppedPanels.map(p => p.id)) as RateMetrics;
          (Object.keys(droppedRateMetrics) as (keyof typeof droppedRateMetrics)[]).map(key => {
            const metricType = key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets';
            const fq: FlowQuery = { ...baseQuery, function: 'rate', type: metricType };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                const droppedRate = res
                  .map(success => {
                    droppedRateMetrics[key] = success.metrics;
                    return droppedRateMetrics;
                  })
                  .mapError(err => t('Dropped {{key}} Rate: ', { key }) + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, droppedRate };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });

          const totalDroppedRateMetric = initRateMetricKeys(droppedPanels.map(p => p.id)) as TotalRateMetrics;
          (Object.keys(totalDroppedRateMetric) as (keyof typeof totalDroppedRateMetric)[]).map(key => {
            const metricType = key === 'bytes' ? 'PktDropBytes' : 'PktDropPackets';
            const fq: FlowQuery = { ...baseQuery, function: 'rate', aggregateBy: 'app', type: metricType };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                const totalDroppedRate = res
                  .map(success => {
                    totalDroppedRateMetric[key] = success.metrics[0];
                    return totalDroppedRateMetric;
                  })
                  .mapError(err => t('Total Dropped {{key}} Rate: ', { key }) + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, totalDroppedRate };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });

          //get drop state & cause
          const fqState: FlowQuery = {
            ...baseQuery,
            function: 'rate',
            type: 'PktDropPackets',
            aggregateBy: 'PktDropLatestState'
          };
          const fqCause: FlowQuery = {
            ...baseQuery,
            function: 'rate',
            type: 'PktDropPackets',
            aggregateBy: 'PktDropLatestDropCause'
          };
          promises.push(
            ...[
              Result.fromPromise(getFlowGenericMetrics(fqState, range)).then(res => {
                const droppedState = res
                  .map(success => success.metrics)
                  .mapError(err => t('Drop State: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, droppedState };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              }),
              Result.fromPromise(getFlowGenericMetrics(fqCause, range)).then(res => {
                const droppedCause = res
                  .map(success => success.metrics)
                  .mapError(err => t('Drop Cause: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, droppedCause };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            ]
          );
        } else {
          setMetrics({
            ...currentMetrics,
            droppedRate: undefined,
            totalDroppedRate: undefined,
            droppedState: undefined,
            droppedCause: undefined
          });
        }

        const dnsPanels = props.panels.filter(p => p.id.includes(dnsIdMatcher));
        if (features.includes('dnsTracking') && !_.isEmpty(dnsPanels)) {
          //set dns metrics
          const dnsLatencyMetrics = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as FunctionMetrics;
          (Object.keys(dnsLatencyMetrics) as (keyof typeof dnsLatencyMetrics)[]).map(fn => {
            const fq: FlowQuery = { ...baseQuery, function: fn, type: 'DnsLatencyMs' };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                const dnsLatency = res
                  .map(success => {
                    dnsLatencyMetrics[fn] = success.metrics;
                    return dnsLatencyMetrics;
                  })
                  .mapError(err => t('DNS Latency: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, dnsLatency };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });

          const totalDnsLatencyMetric = initFunctionMetricKeys(dnsPanels.map(p => p.id)) as TotalFunctionMetrics;
          (Object.keys(totalDnsLatencyMetric) as (keyof typeof totalDnsLatencyMetric)[]).map(fn => {
            const fq: FlowQuery = { ...baseQuery, function: fn, aggregateBy: 'app', type: 'DnsLatencyMs' };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                const totalDnsLatency = res
                  .map(success => {
                    totalDnsLatencyMetric[fn] = success.metrics[0];
                    return totalDnsLatencyMetric;
                  })
                  .mapError(err => t('Total DNS Latency: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, totalDnsLatency };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });

          //set rcode metrics
          if (dnsPanels.some(p => p.id.includes('rcode_dns_latency_flows'))) {
            const fqNames: FlowQuery = { ...baseQuery, aggregateBy: 'DnsName', function: 'count', type: 'DnsFlows' };
            const fqCodes: FlowQuery = {
              ...baseQuery,
              aggregateBy: 'DnsFlagsResponseCode',
              function: 'count',
              type: 'DnsFlows'
            };
            const fqTotal: FlowQuery = { ...baseQuery, aggregateBy: 'app', function: 'count', type: 'DnsFlows' };
            promises.push(
              ...[
                //get dns names
                Result.fromPromise(getFlowGenericMetrics(fqNames, range)).then(res => {
                  const dnsName = res
                    .map(success => success.metrics)
                    .mapError(err => t('DNS Names: ') + getHTTPErrorDetails(err, true));
                  currentMetrics = { ...currentMetrics, dnsName };
                  setMetrics(currentMetrics);
                  return res.map(r => r.stats).or(emptyStats);
                }),
                //get dns response codes
                Result.fromPromise(getFlowGenericMetrics(fqCodes, range)).then(res => {
                  const dnsRCode = res
                    .map(success => success.metrics)
                    .mapError(err => t('DNS RCodes: ') + getHTTPErrorDetails(err, true));
                  currentMetrics = { ...currentMetrics, dnsRCode };
                  setMetrics(currentMetrics);
                  return res.map(r => r.stats).or(emptyStats);
                }),
                Result.fromPromise(getFlowGenericMetrics(fqTotal, range)).then(res => {
                  const totalDnsCount = res
                    .map(success => success.metrics[0])
                    .mapError(err => t('DNS Total: ') + getHTTPErrorDetails(err, true));
                  currentMetrics = { ...currentMetrics, totalDnsCount };
                  setMetrics(currentMetrics);
                  return res.map(r => r.stats).or(emptyStats);
                })
              ]
            );
          }
        } else {
          setMetrics({
            ...currentMetrics,
            dnsLatency: undefined,
            dnsName: undefined,
            dnsRCode: undefined,
            totalDnsLatency: undefined,
            totalDnsCount: undefined
          });
        }

        const rttPanels = props.panels.filter(p => p.id.includes(rttIdMatcher));
        if (features.includes('flowRTT') && !_.isEmpty(rttPanels)) {
          //set RTT metrics
          const rttMetrics = initFunctionMetricKeys(rttPanels.map(p => p.id)) as FunctionMetrics;
          (Object.keys(rttMetrics) as (keyof typeof rttMetrics)[]).map(fn => {
            const fq: FlowQuery = { ...baseQuery, function: fn, type: 'TimeFlowRttNs' };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                const rtt = res
                  .map(success => {
                    rttMetrics[fn] = success.metrics;
                    return rttMetrics;
                  })
                  .mapError(err => t('RTT: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, rtt };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });

          const totalRttMetric = initFunctionMetricKeys(rttPanels.map(p => p.id)) as TotalFunctionMetrics;
          (Object.keys(totalRttMetric) as (keyof typeof totalRttMetric)[]).map(fn => {
            const fq: FlowQuery = { ...baseQuery, function: fn, aggregateBy: 'app', type: 'TimeFlowRttNs' };
            promises.push(
              Result.fromPromise(getMetrics(fq, range)).then(res => {
                //set matching value and apply changes on the entire object to trigger refresh
                const totalRtt = res
                  .map(success => {
                    totalRttMetric[fn] = success.metrics[0];
                    return totalRttMetric;
                  })
                  .mapError(err => t('Total RTT: ') + getHTTPErrorDetails(err, true));
                currentMetrics = { ...currentMetrics, totalRtt };
                setMetrics(currentMetrics);
                return res.map(r => r.stats).or(emptyStats);
              })
            );
          });
        } else {
          setMetrics({ ...currentMetrics, rtt: undefined, totalRtt: undefined });
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
                const fq: FlowQuery = {
                  ...baseQuery,
                  type: parsedId.type,
                  function: parsedId.fn,
                  aggregateBy: parsedId.aggregateBy || metricScope
                };
                const fqTotal: FlowQuery = {
                  ...baseQuery,
                  type: parsedId.type,
                  function: parsedId.fn,
                  aggregateBy: 'app'
                };
                promises.push(
                  ...[
                    Result.fromPromise(
                      getMetricFunc(fq, range) as Promise<GenericMetricsResult | FlowMetricsResult>
                    ).then(res => {
                      //set matching value and apply changes on the entire object to trigger refresh
                      const customResult = res
                        .map(success => success.metrics)
                        .mapError(err => t('Custom metric {{key}}', { key }) + getHTTPErrorDetails(err, true));
                      currentMetrics = { ...currentMetrics, custom: currentMetrics.custom.set(key, customResult) };
                      setMetrics(currentMetrics);
                      return res.map(r => r.stats).or(emptyStats);
                    }),
                    Result.fromPromise(
                      getMetricFunc(fqTotal, range) as Promise<GenericMetricsResult | FlowMetricsResult>
                    ).then(res => {
                      //set matching value and apply changes on the entire object to trigger refresh
                      const customResult = res
                        .map(success => success.metrics[0])
                        .mapError(err => t('Total custom metric {{key}}', { key }) + getHTTPErrorDetails(err, true));
                      currentMetrics = {
                        ...currentMetrics,
                        totalCustom: currentMetrics.totalCustom.set(key, customResult)
                      };
                      setMetrics(currentMetrics);
                      return res.map(r => r.stats).or(emptyStats);
                    })
                  ]
                );
              }
            });
        }

        // After all promises complete, set the collected errors
        return Promise.all(promises).then(results => {
          setMetrics({ ...currentMetrics });
          return results;
        });
      },
      [props.panels, t]
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

    const sortMetrics = React.useCallback(
      <T extends { stats: MetricStats }, E>(metrics: Result<T[], E> | undefined) => {
        return Result.fromNullable(metrics).map(m =>
          m.sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))
        );
      },
      []
    );

    //skip metrics with sources equals to destinations
    //sort by top total item first
    //limit to top X since multiple queries can run in parallel
    const getTopKRateMetrics = React.useCallback(
      (id: OverviewPanelId): Result<NamedMetric[], string> => {
        const rootMetric = id.includes('dropped') ? props.metrics.droppedRate : props.metrics.rate;
        return sortMetrics(
          Result.fromNullable(rootMetric).map(m => {
            return m[getRateFunctionFromId(id)]?.map(m => toNamedMetric(t, m, props.truncateLength, true, true));
          })
        );
      },
      [sortMetrics, props.metrics.droppedRate, props.metrics.rate, t, props.truncateLength]
    );

    const getNamedTotalRateMetric = React.useCallback(
      (id: OverviewPanelId) => {
        const rootMetric = id.includes('dropped') ? props.metrics.totalDroppedRate : props.metrics.totalRate;
        return Result.fromNullable(rootMetric)
          .map(metric => metric[getRateFunctionFromId(id)])
          .map(m => toNamedMetric(t, m, props.truncateLength, false, false));
      },
      [props.metrics.totalDroppedRate, props.metrics.totalRate, t, props.truncateLength]
    );

    const getLatencyMetrics = React.useCallback(
      (id: OverviewPanelId) => {
        let rootMetric = undefined;
        if (id.endsWith('dns_latency')) {
          rootMetric = props.metrics.dnsLatency;
        } else if (id.endsWith('rtt')) {
          rootMetric = props.metrics.rtt;
        }
        return sortMetrics(
          Result.fromNullable(rootMetric).map(m => {
            return m[getFunctionFromId(id)]?.map(m => toNamedMetric(t, m, props.truncateLength, true, true));
          })
        );
      },
      [sortMetrics, props.metrics.dnsLatency, props.metrics.rtt, t, props.truncateLength]
    );

    const getNamedTotalLatencyMetric = React.useCallback(
      (id: OverviewPanelId) => {
        let m = undefined;
        if (id.endsWith('dns_latency')) {
          m = props.metrics.totalDnsLatency;
        } else if (id.endsWith('rtt')) {
          m = props.metrics.totalRtt;
        }
        return Result.fromNullable(m)
          .map(metric => metric[getFunctionFromId(id)])
          .map(m => toNamedMetric(t, m, props.truncateLength, false, false));
      },
      [props.metrics.totalDnsLatency, props.metrics.totalRtt, t, props.truncateLength]
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

    const getNamedTopKCustomMetrics = React.useCallback(
      (id: string) => {
        const rootMetric = props.metrics.custom.get(id.replaceAll(customPanelMatcher + '_', ''));
        return sortMetrics(
          Result.fromNullable(rootMetric).map(m => {
            return m.map(metric => {
              if (isValidTopologyMetrics(metric)) {
                return toNamedMetric(t, metric, props.truncateLength, true, true);
              }
              return { ...metric, name: getGenericMetricName(metric.aggregateBy, metric.name) } as GenericMetric;
            });
          })
        );
      },
      [sortMetrics, getGenericMetricName, props.metrics.custom, t, props.truncateLength]
    );

    const getNamedTotalCustomMetric = React.useCallback(
      (id: OverviewPanelId) => {
        const rootMetric = props.metrics.totalCustom.get(id.replaceAll(customPanelMatcher + '_', ''));
        return Result.fromNullable(rootMetric).map(m => {
          if (isValidTopologyMetrics(m)) {
            return toNamedMetric(t, m, props.truncateLength, false, false);
          }
          return m;
        });
      },
      [props.metrics.totalCustom, t, props.truncateLength]
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
            const panelError = metrics.error || namedTotalMetric.error;
            return {
              element: panelError ? (
                <PanelErrorIndicator error={panelError} metricType={metricType} showDetails={!isFocus} />
              ) : !_.isEmpty(metrics.result) && namedTotalMetric.result ? (
                <MetricsDonut
                  id={id}
                  subTitle={info.subtitle}
                  limit={props.limit}
                  metricType={metricType}
                  metricFunction={'rate'}
                  topKMetrics={metrics.result!}
                  totalMetric={namedTotalMetric.result}
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
              kebab: !panelError ? (
                <PanelKebab
                  id={id}
                  options={options}
                  setOptions={opts => setKebabOptions(id, opts)}
                  isDark={props.isDark}
                />
              ) : undefined,
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
            const metricType = id.endsWith('byte_rates') ? 'Bytes' : 'Packets';
            const topKMetrics = getTopKRateMetrics(id);
            const filteredTopk = topKMetrics.or([]).filter(m => m.source.id !== m.destination.id);
            if (showTopOnly) {
              return {
                calculatedTitle: info.topTitle,
                element: topKMetrics.error ? (
                  <PanelErrorIndicator error={topKMetrics.error} metricType={metricType} showDetails={!isFocus} />
                ) : (
                  <MetricsGraph
                    id={id}
                    metricType={metricType}
                    metrics={filteredTopk}
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
                ),
                kebab: !topKMetrics.error ? (
                  <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
                ) : undefined,
                bodyClassSmall: false,
                doubleWidth: true
              };
            }

            const showTotalOnly = !options.showTop && options.showApp!.value;
            const namedTotalMetric = getNamedTotalRateMetric(id.replace('dropped_', '') as OverviewPanelId);
            const namedTotalDroppedMetric = getNamedTotalRateMetric(id);
            const panelError = topKMetrics.error || namedTotalMetric.error || namedTotalDroppedMetric.error;
            return {
              calculatedTitle: showTotalOnly ? info.totalTitle : undefined,
              element: panelError ? (
                <PanelErrorIndicator error={panelError} metricType={metricType} showDetails={!isFocus} />
              ) : !_.isEmpty(filteredTopk) || namedTotalMetric.result || namedTotalDroppedMetric.result ? (
                <MetricsGraphWithTotal
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={filteredTopk}
                  totalMetric={namedTotalMetric.result}
                  totalDropMetric={namedTotalDroppedMetric.result}
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
              kebab: !panelError ? (
                <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
              ) : undefined,
              bodyClassSmall: false,
              doubleWidth: true
            };
          }
          case 'state_dropped_packet_rates':
          case 'cause_dropped_packet_rates': {
            const isState = id === 'state_dropped_packet_rates';
            const metricType = 'Packets'; // TODO: consider adding bytes graphs here
            const topKMetrics = isState
              ? sortMetrics(props.metrics.droppedState)
              : sortMetrics(props.metrics.droppedCause);
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
            const panelError = showTopOnly ? topKMetrics.error : topKMetrics.error || namedTotalMetric.error;
            return {
              calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
              element: panelError ? (
                <PanelErrorIndicator
                  error={panelError}
                  metricType={isState ? 'Dropped state' : 'Dropped cause'}
                  showDetails={!isFocus}
                />
              ) : isDonut && !_.isEmpty(topKMetrics.result) && namedTotalMetric.result ? (
                <MetricsDonut
                  id={id}
                  subTitle={info.subtitle}
                  limit={props.limit}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={topKMetrics.result!}
                  totalMetric={namedTotalMetric.result}
                  showOthers={options.showOthers!}
                  smallerTexts={smallerTexts}
                  showLegend={!isFocus}
                  animate={animate}
                  isDark={props.isDark}
                />
              ) : showTopOnly && !_.isEmpty(topKMetrics.result) ? (
                <MetricsGraph
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  metrics={topKMetrics.result!}
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
              ) : namedTotalMetric.result ? (
                <MetricsGraphWithTotal
                  id={id}
                  metricType={metricType}
                  metricFunction="rate"
                  topKMetrics={topKMetrics.or([])}
                  totalMetric={namedTotalMetric.result}
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
              kebab: !panelError ? (
                <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
              ) : undefined,
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
            const metrics = getLatencyMetrics(id);
            const namedTotalMetric = getNamedTotalLatencyMetric(id);
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
            const panelError = metrics.error || namedTotalMetric.error;
            return {
              calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
              element: panelError ? (
                <PanelErrorIndicator error={panelError} metricType={metricType} showDetails={!isFocus} />
              ) : !_.isEmpty(metrics.result) && namedTotalMetric.result ? (
                options!.graph!.type === 'donut' ? (
                  <MetricsDonut
                    id={id}
                    subTitle={info.subtitle}
                    limit={props.limit}
                    metricType={metricType}
                    metricFunction={getFunctionFromId(id)}
                    topKMetrics={metrics.result!}
                    totalMetric={namedTotalMetric.result}
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
                    topKMetrics={metrics.result!}
                    totalMetric={namedTotalMetric.result}
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
              kebab: !panelError ? (
                <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
              ) : undefined,
              bodyClassSmall: options.graph!.type === 'donut',
              doubleWidth: options.graph!.type !== 'donut'
            };
          }
          case 'name_dns_latency_flows':
          case 'rcode_dns_latency_flows': {
            const metricType = id === 'name_dns_latency_flows' ? 'DnsName' : 'DnsFlows'; // TODO: consider adding packets graphs here
            const topKMetrics =
              id === 'name_dns_latency_flows'
                ? sortMetrics(props.metrics.dnsName)
                : sortMetrics(props.metrics.dnsRCode);
            const namedTotalMetric = props.metrics.totalDnsCount;
            const options = getKebabOptions(id, {
              showNoError: true,
              showTop: true,
              showApp: { text: t('Show total'), value: true },
              graph: { options: ['bar_line', 'donut'], type: 'donut' }
            });
            const isDonut = options!.graph!.type === 'donut';
            const showTopOnly = isDonut || (options.showTop && !options.showApp!.value);
            const showTotalOnly = !options.showTop && options.showApp!.value;
            const panelError = topKMetrics.error || namedTotalMetric?.error;
            return {
              calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
              element: panelError ? (
                <PanelErrorIndicator error={panelError} metricType={metricType} showDetails={!isFocus} />
              ) : !_.isEmpty(topKMetrics.result) && namedTotalMetric?.result ? (
                isDonut ? (
                  <MetricsDonut
                    id={id}
                    subTitle={info.subtitle}
                    limit={props.limit}
                    metricType={metricType}
                    metricFunction="sum"
                    topKMetrics={topKMetrics.result!}
                    totalMetric={namedTotalMetric.result}
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
                    topKMetrics={topKMetrics.result!}
                    totalMetric={namedTotalMetric.result}
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
              kebab: !panelError ? (
                <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
              ) : undefined,
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
              const panelError = topKMetrics.error || namedTotalMetric.error;
              return {
                calculatedTitle: showTopOnly ? info.topTitle : showTotalOnly ? info.totalTitle : undefined,
                element: panelError ? (
                  <PanelErrorIndicator error={panelError} metricType={metricType} showDetails={!isFocus} />
                ) : !_.isEmpty(topKMetrics.result) && namedTotalMetric.result ? (
                  isDonut ? (
                    <MetricsDonut
                      id={id}
                      subTitle={info.subtitle}
                      limit={props.limit}
                      metricType={metricType}
                      metricFunction={metricFunction}
                      topKMetrics={topKMetrics.result!}
                      totalMetric={namedTotalMetric.result}
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
                      topKMetrics={topKMetrics.result!}
                      totalMetric={namedTotalMetric.result}
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
                kebab: !panelError ? (
                  <PanelKebab id={id} options={options} setOptions={opts => setKebabOptions(id, opts)} />
                ) : undefined,
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
        props.metrics.totalDnsCount,
        getNamedTotalLatencyMetric,
        getNamedTotalRateMetric,
        props.metrics.dnsName,
        props.metrics.dnsRCode,
        props.metrics.droppedCause,
        props.metrics.droppedState,
        getLatencyMetrics,
        getTopKRateMetrics,
        getNamedTopKCustomMetrics,
        getNamedTotalCustomMetric,
        props.isDark,
        props.limit,
        setKebabOptions,
        smallerTexts,
        sortMetrics,
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
