import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Divider,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricFunction, MetricType, NodeType } from '../../model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import {
  decorated,
  ElementData,
  getStat,
  GraphElementPeer,
  isElementFiltered,
  NodeData,
  toggleElementFilter
} from '../../model/topology';
import './element-panel.css';
import { MetricsContent } from '../metrics/metrics-content';
import { getFormattedValue, matchPeer, peersEqual } from '../../utils/metrics';
import { toNamedMetric } from '../metrics/metrics-helper';

export const ElementPanelDetailsContent: React.FC<{
  element: GraphElementPeer;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ element, filters, setFilters }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [hidden, setHidden] = React.useState<string[]>([]);
  const data = element.getData();

  const toggle = React.useCallback(
    (id: string) => {
      const index = hidden.indexOf(id);
      const newExpanded: string[] =
        index >= 0 ? [...hidden.slice(0, index), ...hidden.slice(index + 1, hidden.length)] : [...hidden, id];
      setHidden(newExpanded);
    },
    [hidden]
  );

  const isFiltered = React.useCallback(
    (d: ElementData) => {
      return isElementFiltered(d, filters, t);
    },
    [filters, t]
  );

  const onFilter = React.useCallback(
    (d: ElementData) => {
      toggleElementFilter(d, isFiltered(d), filters, setFilters, t);
    },
    [filters, isFiltered, setFilters, t]
  );

  const resourceInfos = React.useCallback(
    (d: NodeData) => {
      let infos: React.ReactElement | undefined;

      const addInfos = (id: string, title: string, content: React.ReactElement, data: ElementData) => {
        infos = (
          <>
            {infos}
            <TextContent id={id} className="record-field-container">
              <Text component={TextVariants.h4}>{title}</Text>
              <Flex>
                <FlexItem flex={{ default: 'flex_1' }}>{content}</FlexItem>
                <FlexItem>
                  <Button variant="link" aria-label="Filter" onClick={() => onFilter(data)}>
                    {isFiltered(data) ? <TimesIcon /> : <FilterIcon />}
                  </Button>
                </FlexItem>
              </Flex>
            </TextContent>
          </>
        );
      };

      if (d.resourceKind && d.name) {
        addInfos(
          'resourcelink',
          element instanceof BaseNode ? t('Name') : d.resourceKind,
          element instanceof BaseNode ? (
            <Text>{d.name}</Text>
          ) : (
            <ResourceLink inline={true} kind={d.resourceKind} name={d.name} namespace={d.namespace} />
          ),
          d
        );
      }
      if (d.namespace) {
        addInfos('namespace', t('Namespace'), <ResourceLink inline={true} kind={'Namespace'} name={d.namespace} />, {
          nodeType: 'namespace' as NodeType,
          name: d.namespace
        });
      }
      if (d.host) {
        addInfos('host', t('Node Name'), <ResourceLink inline={true} kind={'Node'} name={d.host} />, {
          nodeType: 'host' as NodeType,
          name: d.host
        });
      }
      if (d.addr) {
        addInfos('address', t('IP'), <Text id="addressValue">{d.addr}</Text>, {
          addr: d.addr
        });
      }

      if (!infos) {
        infos = (
          <TextContent id="no-infos" className="record-field-container">
            {
              // eslint-disable-next-line max-len
              <Text component={TextVariants.p}>
                {t('No information available for this content. Change scope to get more details.')}
              </Text>
            }
          </TextContent>
        );
      }
      return infos;
    },
    [element, isFiltered, onFilter, t]
  );

  if (element instanceof BaseNode && data) {
    const infos = resourceInfos(data);
    return <>{infos}</>;
  } else if (element instanceof BaseEdge) {
    // Edge A to B (prefering neutral naming here as there is no assumption about what is source, what is destination
    const aData = element.getSource().getData();
    const bData = element.getTarget().getData();
    const aInfos = resourceInfos(aData);
    const bInfos = resourceInfos(bData);
    return (
      <Accordion asDefinitionList={false}>
        {aInfos && (
          <div className="record-group-container" key={'source'} data-test-id={'source'}>
            <AccordionItem data-test-id={'source'}>
              {
                <AccordionToggle
                  className="borderless-accordion"
                  onClick={() => toggle('source')}
                  isExpanded={!hidden.includes('source')}
                  id={'source'}
                >
                  {t('Source')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="source-content"
                isHidden={hidden.includes('source')}
              >
                {aInfos}
              </AccordionContent>
            </AccordionItem>
          </div>
        )}
        {bInfos && (
          <div className="record-group-container" key={'destination'} data-test-id={'destination'}>
            <Divider />
            <AccordionItem data-test-id={'destination'}>
              {
                <AccordionToggle
                  className="borderless-accordion"
                  onClick={() => toggle('destination')}
                  isExpanded={!hidden.includes('destination')}
                  id={'destination'}
                >
                  {t('Destination')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="destination-content"
                isHidden={hidden.includes('destination')}
              >
                {bInfos}
              </AccordionContent>
            </AccordionItem>
          </div>
        )}
      </Accordion>
    );
  }
  return <></>;
};

export const ElementPanelMetricsContent: React.FC<{
  element: GraphElementPeer;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType: MetricType;
}> = ({ element, metrics, metricFunction, metricType }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData();

  const metricCounts = React.useCallback(
    (inCount: number, outCount: number, forEdge: boolean) => {
      return (
        <Flex className="metrics-flex-container">
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem>
              <FlexItem>
                <Text className="element-text" component={TextVariants.h4}>
                  {`${forEdge ? t('Source to destination:') : t('In:')}`}
                </Text>
              </FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>
                <Text className="element-text" component={TextVariants.h4}>
                  {`${forEdge ? t('Destination to source:') : t('Out:')}`}
                </Text>
              </FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>
                <Text className="element-text" component={TextVariants.h4}>{`${t('Both:')}`}</Text>
              </FlexItem>
            </FlexItem>
          </Flex>
          <Flex direction={{ default: 'column' }} spaceItems={{ default: 'spaceItemsNone' }}>
            <FlexItem>
              <Text id="inCount">{getFormattedValue(inCount, metricType, metricFunction)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="outCount">{getFormattedValue(outCount, metricType, metricFunction)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="total">{getFormattedValue(inCount + outCount, metricType, metricFunction)}</Text>
            </FlexItem>
          </Flex>
        </Flex>
      );
    },
    [metricFunction, metricType, t]
  );

  if (element instanceof BaseNode && data) {
    const filteredMetrics = metrics.filter(m => !peersEqual(m.source, m.destination));
    const outMetrics = filteredMetrics.filter(m => matchPeer(data, m.source)).map(m => toNamedMetric(t, m, data));
    const inMetrics = filteredMetrics.filter(m => matchPeer(data, m.destination)).map(m => toNamedMetric(t, m, data));
    const outCount = outMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const inCount = inMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    return (
      <div className="element-metrics-container">
        <MetricsContent
          id={`node-${decorated(data).id}`}
          title={t('{{type}} rate', { type: metricType.charAt(0).toUpperCase() + metricType.slice(1) })}
          metricType={metricType}
          metrics={[...inMetrics, ...outMetrics].sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))}
          counters={metricCounts(inCount, outCount, false)}
          limit={10}
          showTitle
          showArea
          showScatter
        />
      </div>
    );
  } else if (element instanceof BaseEdge) {
    // Edge A to B (prefering neutral naming here as there is no assumption about what is source, what is destination
    const aData = element.getSource().getData();
    const bData = element.getTarget().getData();
    const aToBMetrics = metrics
      .filter(m => matchPeer(aData, m.source) && matchPeer(bData, m.destination))
      .map(m => toNamedMetric(t, m, data));
    const bToAMetrics = metrics
      .filter(m => matchPeer(bData, m.source) && matchPeer(aData, m.destination))
      .map(m => toNamedMetric(t, m, data));
    const aToBCount = aToBMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const bToACount = bToAMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    return (
      <div className="element-metrics-container">
        <MetricsContent
          id={`edge-${aData.id}-${bData.id}`}
          title={t('{{type}} rate', { type: metricType.charAt(0).toUpperCase() + metricType.slice(1) })}
          metricType={metricType}
          metrics={[...aToBMetrics, ...bToAMetrics].sort((a, b) => getStat(b.stats, 'sum') - getStat(a.stats, 'sum'))}
          counters={metricCounts(aToBCount, bToACount, true)}
          limit={10}
          showTitle
          showArea
          showScatter
        />
      </div>
    );
  }
  return <></>;
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElementPeer;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType: MetricType;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  id?: string;
}> = ({ id, element, metrics, metricFunction, metricType, filters, setFilters, onClose }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [activeTab, setActiveTab] = React.useState<string>('details');

  const data = element.getData();

  const titleContent = React.useCallback(() => {
    if (element instanceof BaseNode && data?.resourceKind && data?.name) {
      return <ResourceLink inline={true} kind={data.resourceKind} name={data.name} namespace={data.namespace} />;
    } else if (data?.resourceKind) {
      return <Text component={TextVariants.h2}>{data?.resourceKind}</Text>;
    } else if (element instanceof BaseEdge) {
      return <Text component={TextVariants.h2}>{t('Edge')}</Text>;
    } else {
      return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
    }
  }, [data, element, t]);

  return (
    <DrawerPanelContent
      data-test-id={id}
      id={id}
      className="drawer-panel-content"
      isResizable
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
    >
      <DrawerHead id={`${id}-drawer-head`} data-test-id="drawer-head" className="drawer-head">
        {titleContent()}
        <DrawerActions>
          <DrawerCloseButton data-test-id="drawer-close-button" className="drawer-close-button" onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Divider />
      <DrawerPanelBody id={`${id}-drawer-body`} className="drawer-body" data-test-id="drawer-body">
        <Tabs
          id="drawer-tabs"
          activeKey={activeTab}
          usePageInsets
          onSelect={(e, key) => setActiveTab(key as string)}
          role="region"
        >
          <Tab className="drawer-tab" eventKey={'details'} title={<TabTitleText>{t('Details')}</TabTitleText>}>
            <ElementPanelDetailsContent element={element} filters={filters} setFilters={setFilters} />
          </Tab>
          <Tab className="drawer-tab" eventKey={'metrics'} title={<TabTitleText>{t('Metrics')}</TabTitleText>}>
            <ElementPanelMetricsContent
              element={element}
              metrics={metrics}
              metricFunction={metricFunction}
              metricType={metricType}
            />
          </Tab>
        </Tabs>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
