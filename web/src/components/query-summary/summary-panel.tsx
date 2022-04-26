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
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { compareStrings } from '../../utils/base-compare';
import { Record } from '../../api/ipfix';
import { TimeRange } from '../../utils/datetime';
import { QuerySummaryContent } from './query-summary';
import './summary-panel.css';
import _ from 'lodash';
import { comparePorts, formatPort } from '../../utils/port';
import { formatProtocol } from '../../utils/protocol';
import { compareIPs } from '../../utils/ip';

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
  range: number | TimeRange;
  limit: number;
}> = ({ flows, range, limit }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
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
    compareFn: (a: string | number, b: string | number) => number
  ) => {
    const sortedStrings = values.sort((a: string | number, b: string | number) => compareFn(a, b)) as string[];
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

  const cardinalityContent = () => {
    if (flows && flows.length) {
      //regroup all k8s objects per type + namespace
      const typesCardinality: TypeCardinality[] = [];
      const namespaces: string[] = [];

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

      if (!_.isEmpty(namespaces)) {
        typesCardinality.push({
          type: 'Namespace',
          objects: [{ names: namespaces }]
        });
      }

      const addresses = Array.from(new Set(flows.map(f => f.fields.SrcAddr).concat(flows.map(f => f.fields.DstAddr))));
      const ports = Array.from(new Set(flows.map(f => f.fields.SrcPort).concat(flows.map(f => f.fields.DstPort))));
      const protocols = Array.from(new Set(flows.map(f => f.fields.Proto)));

      return (
        <Accordion id="cardinality-accordion">
          {accordionItem(
            'addresses',
            t('{{count}} Address(es)', { count: addresses.length }),
            listCardinalityContent(addresses, compareIPs)
          )}
          {typesCardinality.map(tc =>
            accordionItem(
              tc.type,
              `${tc.objects.map(o => o.names.length).reduce((a, b) => a + b, 0)} ${tc.type}(s)`,
              typeCardinalityContent(tc)
            )
          )}
          {accordionItem(
            'ports',
            t('{{count}} Port(s)', { count: ports.length }),
            listCardinalityContent(
              ports.map(p => formatPort(p)),
              comparePorts
            )
          )}
          {accordionItem(
            'protocols',
            t('{{count}} Protocol(s)', { count: protocols.length }),
            listCardinalityContent(
              protocols.map(p => formatProtocol(p)),
              compareStrings
            )
          )}
        </Accordion>
      );
    } else {
      return <></>;
    }
  };

  return (
    <>
      <TextContent className="summary-text-container">
        <Text component={TextVariants.h3}>{t('Results')}</Text>
        <QuerySummaryContent
          className="summary-container-grouped"
          direction={'column'}
          flows={flows || []}
          range={range}
          limit={limit}
        />
      </TextContent>
      <TextContent className="summary-text-container">
        <Text component={TextVariants.h3}>{t('Cardinality')}</Text>
        {cardinalityContent()}
      </TextContent>
      {/*TODO: NETOBSERV-225 for extra stats on query*/}
    </>
  );
};

export const SummaryPanel: React.FC<{
  onClose: () => void;
  flows: Record[] | undefined;
  range: number | TimeRange;
  limit: number;
  id?: string;
}> = ({ flows, range, limit, id, onClose }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  return (
    <DrawerPanelContent id={id} isResizable defaultSize={defaultSize} minSize={minSize} maxSize={maxSize}>
      <DrawerHead>
        <Text component={TextVariants.h2}>{t('Query summary')}</Text>
        <DrawerActions>
          <DrawerCloseButton id={`${id ? id : 'summary-panel'}-close-button`} onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <SummaryPanelContent flows={flows} range={range} limit={limit} />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default SummaryPanel;
