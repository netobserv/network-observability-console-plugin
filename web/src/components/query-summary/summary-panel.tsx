import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Accordion,
  AccordionContent,
  AccordionExpandedContentBody,
  AccordionItem,
  AccordionToggle,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import _ from 'lodash';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { compareStrings } from '../../utils/base-compare';
import { Record } from '../../api/ipfix';
import { TimeRange } from '../../utils/datetime';
import { FlowsQuerySummaryContent } from './flows-query-summary';
import { comparePorts, formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { compareIPs } from '../../utils/ip';
import { Stats, TopologyMetrics } from '../../api/loki';
import './summary-panel.css';
import { MetricType, RecordType } from '../../model/flow-query';
import { MetricsQuerySummaryContent } from './metrics-query-summary';
import { config } from '../../utils/config';
import { formatDurationAboveMillisecond } from '../../utils/duration';

type TypeCardinality = {
  type: string;
  objects: K8SObjectCardinality[];
};

type K8SObjectCardinality = {
  namespace?: string;
  names: string[];
};

export const SummaryPanelContent: React.FC<{
  flows: Record[] | undefined;
  metrics: TopologyMetrics[] | undefined;
  appMetrics: TopologyMetrics | undefined;
  type: RecordType;
  metricType: MetricType;
  stats: Stats | undefined;
  limit: number;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
}> = ({ flows, metrics, appMetrics, type, metricType, stats, limit, range, lastRefresh }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [expanded, setExpanded] = React.useState<string>('');

  const accordionItem = (id: string, label: string, content: JSX.Element) => {
    return (
      <AccordionItem key={id}>
        <AccordionToggle
          onClick={() => {
            if (id === expanded) {
              setExpanded('');
            } else {
              setExpanded(id);
            }
          }}
          isExpanded={expanded === id}
          id={id}
        >
          {label}
        </AccordionToggle>
        <AccordionContent id={`${id}-content`} isHidden={expanded !== id} isCustomContent>
          {content}
        </AccordionContent>
      </AccordionItem>
    );
  };

  const typeCardinalityContent = (tc: TypeCardinality) => {
    return (
      <>
        {tc.objects
          .sort((a, b) => compareStrings(a.namespace ? a.namespace : '', b.namespace ? b.namespace : ''))
          .flatMap(o => (
            <AccordionExpandedContentBody>
              {o.namespace && <ResourceLink key={`${tc.type}-${o.namespace}`} kind={'Namespace'} name={o.namespace} />}
              {o.names
                .sort((a, b) => compareStrings(a, b))
                .map(n => (
                  <ResourceLink
                    key={`${tc.type}-${n}-${o.namespace}`}
                    className={o.namespace ? 'summary-container-grouped' : ''}
                    kind={tc.type}
                    name={n}
                    namespace={o.namespace}
                  />
                ))}
            </AccordionExpandedContentBody>
          ))}
      </>
    );
  };

  const listCardinalityContent = (
    values: (string | number)[],
    compareFn?: (a: string | number, b: string | number) => number
  ) => {
    const sortedStrings = compareFn
      ? (values.sort((a: string | number, b: string | number) => compareFn(a, b)) as string[])
      : values;
    return (
      <>
        {sortedStrings.map((v: string) => (
          <AccordionExpandedContentBody key={v}>
            <Text>{v}</Text>
          </AccordionExpandedContentBody>
        ))}
      </>
    );
  };

  const configContent = () => {
    return (
      <TextContent className="summary-text-container">
        <Text component={TextVariants.h3}>{`${t('Configuration')}`}</Text>
        <Text className="summary-config-item">{`${t('Sampling')}: ${config.sampling}`}</Text>
      </TextContent>
    );
  };

  const cardinalityContent = () => {
    //regroup all k8s objects per type + namespace
    const namespaces: string[] = [];
    const typesCardinality: TypeCardinality[] = [];
    let addresses: string[] = [];
    let ports: number[] = [];
    let protocols: number[] = [];

    if (flows && flows.length) {
      //list all types
      const types = Array.from(new Set(flows.flatMap(f => [f.fields.SrcK8S_Type, f.fields.DstK8S_Type])));
      types
        .filter((t: string | undefined) => t !== undefined)
        .forEach((type: string) => {
          const tc: TypeCardinality = { type, objects: [] };

          const typeFilteredFlows = flows.filter(f => [f.fields.SrcK8S_Type, f.fields.DstK8S_Type].includes(type));
          //list all namespaces of this type
          const typeNamespaces = new Set(
            typeFilteredFlows.flatMap(f => [f.labels.SrcK8S_Namespace, f.labels.DstK8S_Namespace])
          );
          typeNamespaces.forEach(namespace => {
            const namespaceFilteredFlows = typeFilteredFlows.filter(f =>
              [f.labels.SrcK8S_Namespace, f.labels.DstK8S_Namespace].includes(namespace)
            );

            const nsObject: K8SObjectCardinality = {
              namespace,
              names: []
            };

            //add all names of this namespace of type
            namespaceFilteredFlows.forEach(record => {
              const srcName =
                record.fields.SrcK8S_Type === type && record.labels.SrcK8S_Namespace === namespace
                  ? record.fields.SrcK8S_Name
                  : undefined;
              if (srcName && !nsObject.names.includes(srcName)) {
                nsObject.names.push(srcName);
              }
              const dstName =
                record.fields.DstK8S_Type === type && record.labels.DstK8S_Namespace === namespace
                  ? record.fields.DstK8S_Name
                  : undefined;
              if (dstName && !nsObject.names.includes(dstName)) {
                nsObject.names.push(dstName);
              }
            });

            if (!_.isEmpty(nsObject.names)) {
              tc.objects.push(nsObject);
            }

            if (namespace && !namespaces.includes(namespace)) {
              namespaces.push(namespace);
            }
          });
          typesCardinality.push(tc);
        });

      addresses = Array.from(new Set(flows.map(f => f.fields.SrcAddr).concat(flows.map(f => f.fields.DstAddr))));
      ports = Array.from(new Set(flows.map(f => f.fields.SrcPort).concat(flows.map(f => f.fields.DstPort))));
      protocols = Array.from(new Set(flows.map(f => f.fields.Proto)));
    } else if (metrics && metrics.length) {
      function manageTypeCardinality(hostName?: string, namespace?: string, type?: string, name?: string) {
        if (namespace && !namespaces.includes(namespace)) {
          namespaces.push(namespace);
        }

        if (type) {
          let tc = typesCardinality.find(t => t.type === type);
          if (!tc) {
            tc = { type: type, objects: [] };
            typesCardinality.push(tc);
          }

          let object = tc.objects.find(o => o.namespace === namespace);
          if (!object) {
            object = { names: [], namespace: namespace };
            tc.objects.push(object);
          }

          if (name && !object.names.includes(name)) {
            object.names.push(name);
          }
        }

        if (hostName) {
          manageTypeCardinality('', '', 'Node', hostName);
        }
      }

      metrics.forEach(m => {
        manageTypeCardinality(m.source.hostName, m.source.namespace, m.source.resource?.type, m.source.resource?.name);
        manageTypeCardinality(
          m.destination.hostName,
          m.destination.namespace,
          m.destination.resource?.type,
          m.destination.resource?.name
        );
      });

      addresses = Array.from(
        new Set(metrics.map(m => m.source.addr).concat(metrics.map(m => m.destination.addr)))
      ).filter(v => !_.isEmpty(v)) as string[];
    }

    if (!_.isEmpty(namespaces)) {
      typesCardinality.push({
        type: 'Namespace',
        objects: [{ names: namespaces }]
      });
    }

    return addresses.length || typesCardinality.length || ports.length || protocols.length ? (
      <TextContent className="summary-text-container">
        <Text component={TextVariants.h3}>{`${t('Cardinality')} ${
          !_.isEmpty(metrics) ? t('(top {{count}} metrics)', { count: limit }) : ''
        }`}</Text>
        <Accordion id="cardinality-accordion">
          {addresses.length
            ? accordionItem(
                'addresses',
                t('{{count}} IP(s)', { count: addresses.length }),
                listCardinalityContent(addresses, compareIPs)
              )
            : undefined}
          {typesCardinality.length
            ? typesCardinality.map(tc =>
                accordionItem(
                  tc.type,
                  `${tc.objects.map(o => o.names.length).reduce((a, b) => a + b, 0)} ${tc.type}(s)`,
                  typeCardinalityContent(tc)
                )
              )
            : undefined}
          {ports.length
            ? accordionItem(
                'ports',
                t('{{count}} Port(s)', { count: ports.length }),
                listCardinalityContent(
                  //sort ports before format to keep number order
                  ports.sort((p1, p2) => comparePorts(p1, p2)).map(p => formatPort(p))
                )
              )
            : undefined}
          {protocols.length
            ? accordionItem(
                'protocols',
                t('{{count}} Protocol(s)', { count: protocols.length }),
                listCardinalityContent(
                  protocols.map(p => formatProtocol(p)),
                  compareStrings
                )
              )
            : undefined}
        </Accordion>
      </TextContent>
    ) : undefined;
  };

  const timeContent = () => {
    const filteredFlows = flows || [];
    const duration =
      filteredFlows.map(f => f.fields.TimeFlowEndMs - f.fields.TimeFlowStartMs).reduce((a, b) => a + b, 0) /
      filteredFlows.length;
    const collectionLatency =
      filteredFlows.map(f => f.fields.TimeReceived * 1000 - f.fields.TimeFlowEndMs).reduce((a, b) => a + b, 0) /
      filteredFlows.length;
    const dnsLatency =
      filteredFlows
        .map(f => (f.fields.DnsResponseTimeMs || 0) - (f.fields.DnsRequestTimeMs || 0))
        .reduce((a, b) => a + b, 0) / filteredFlows.length;
    return (
      <TextContent className="summary-text-container">
        <Text component={TextVariants.h3}>{`${t('Average time')}`}</Text>
        <Text className="summary-config-item">{`${t('Duration')}: ${formatDurationAboveMillisecond(duration)}`}</Text>
        <Text className="summary-config-item">{`${t('Collection latency')}: ${formatDurationAboveMillisecond(
          collectionLatency
        )}`}</Text>
        <Text className="summary-config-item">{`${t('DNS latency')}: ${formatDurationAboveMillisecond(
          dnsLatency
        )}`}</Text>
      </TextContent>
    );
  };

  return (
    <>
      <TextContent className="summary-text-container">
        {!_.isEmpty(flows) && stats?.limitReached && (
          <Text component={TextVariants.p}>
            {t(
              // eslint-disable-next-line max-len
              'Flow per request limit reached, following metrics can be inaccurate. Narrow down your search or increase limit.'
            )}
          </Text>
        )}
        <Text component={TextVariants.h3}>{`${t('Results')} ${
          !_.isEmpty(metrics) && _.isEmpty(appMetrics) ? t('(top {{count}} metrics)', { count: limit }) : ''
        }`}</Text>
        {_.isEmpty(flows) ? (
          <MetricsQuerySummaryContent
            className="summary-container-grouped"
            direction="column"
            metrics={metrics || []}
            appMetrics={appMetrics}
            metricType={metricType}
            lastRefresh={lastRefresh}
          />
        ) : (
          <FlowsQuerySummaryContent
            className="summary-container-grouped"
            direction="column"
            type={type}
            flows={flows!}
            limitReached={stats?.limitReached || false}
            range={range}
            lastRefresh={lastRefresh}
          />
        )}
      </TextContent>

      {timeContent()}

      {cardinalityContent()}
      {/*TODO: NETOBSERV-225 for extra stats on query*/}

      {configContent()}
    </>
  );
};

export const SummaryPanel: React.FC<{
  onClose: () => void;
  flows: Record[] | undefined;
  metrics: TopologyMetrics[] | undefined;
  appMetrics: TopologyMetrics | undefined;
  appDroppedMetrics: TopologyMetrics | undefined;
  type: RecordType;
  metricType: MetricType;
  stats: Stats | undefined;
  limit: number;
  range: number | TimeRange;
  lastRefresh: Date | undefined;
  id?: string;
}> = ({ flows, metrics, appMetrics, type, metricType, stats, limit, range, lastRefresh, id, onClose }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <DrawerPanelContent
      data-test={id}
      id={id}
      isResizable
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
    >
      <DrawerHead>
        <Text component={TextVariants.h2}>{t('Query summary')}</Text>
        <DrawerActions>
          <DrawerCloseButton id={`${id ? id : 'summary-panel'}-close-button`} onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <SummaryPanelContent
          flows={flows}
          metrics={metrics}
          appMetrics={appMetrics}
          type={type}
          metricType={metricType}
          stats={stats}
          limit={limit}
          range={range}
          lastRefresh={lastRefresh}
        />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default SummaryPanel;
