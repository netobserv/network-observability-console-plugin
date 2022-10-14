import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import { peersEqual, TopologyMetrics } from '../../api/loki';
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
import MetricsContent from '../metrics/metrics-content';
import { MetricScopeOptions } from '../../model/metrics';
import { getFormattedValue, matchPeer } from '../../utils/metrics';

export const ElementPanelContent: React.FC<{
  element: GraphElementPeer;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType: MetricType;
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ element, metrics, metricFunction, metricType, metricScope, filters, setFilters }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData();
  // const type = element.getType();

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
      if (d.resourceKind && d.name) {
        infos = (
          <TextContent id="resourcelink" className="element-text-container grouped">
            <Text component={TextVariants.h4}>{d.resourceKind}</Text>
            <Flex>
              <FlexItem flex={{ default: 'flex_1' }}>
                <ResourceLink inline={true} kind={d.resourceKind} name={d.name} namespace={d.namespace} />
              </FlexItem>
              <FlexItem>
                <Button variant="link" aria-label="Filter" onClick={() => onFilter(d)}>
                  {isFiltered(d) ? <TimesIcon /> : <FilterIcon />}
                </Button>
              </FlexItem>
            </Flex>
          </TextContent>
        );
      }
      if (d.addr) {
        const addressData = {
          addr: d.addr
        };
        infos = (
          <>
            {infos}
            <TextContent id="address" className="element-text-container grouped">
              <Text component={TextVariants.h4}>{t('IP')}</Text>
              <Flex>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Text id="addressValue">{d.addr}</Text>
                </FlexItem>
                <FlexItem>
                  <Button variant="link" aria-label="Filter" onClick={() => onFilter(addressData)}>
                    {isFiltered(addressData) ? <TimesIcon /> : <FilterIcon />}
                  </Button>
                </FlexItem>
              </Flex>
            </TextContent>
          </>
        );
      }
      return infos;
    },
    [isFiltered, onFilter, t]
  );

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
    const outMetrics = filteredMetrics.filter(m => matchPeer(data, m.source));
    const inMetrics = filteredMetrics.filter(m => matchPeer(data, m.destination));
    const outCount = outMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const inCount = inMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const infos = resourceInfos(data);
    return (
      <>
        {infos && (
          <TextContent id="resourceInfos" className="element-text-container">
            <Text component={TextVariants.h3}>{t('Infos')}</Text>
            {infos}
          </TextContent>
        )}
        <MetricsContent
          id={`node-${decorated(data).id}`}
          metricFunction={metricFunction}
          metricType={metricType}
          metrics={[...inMetrics, ...outMetrics]}
          scope={metricScope as MetricScopeOptions}
          data={data}
          counters={metricCounts(inCount, outCount, false)}
          showTitle
          showArea
          showScatter
        />
      </>
    );
  } else if (element instanceof BaseEdge) {
    // Edge A to B (prefering neutral naming here as there is no assumption about what is source, what is destination
    const aData = element.getSource().getData();
    const bData = element.getTarget().getData();
    const aToBMetrics = metrics.filter(m => matchPeer(aData, m.source) && matchPeer(bData, m.destination));
    const bToAMetrics = metrics.filter(m => matchPeer(bData, m.source) && matchPeer(aData, m.destination));
    const aToBCount = aToBMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const bToACount = bToAMetrics.reduce((prev, cur) => prev + getStat(cur.stats, metricFunction), 0);
    const aInfos = resourceInfos(aData);
    const bInfos = resourceInfos(bData);
    return (
      <>
        {aInfos && (
          <TextContent id="source" className="element-text-container">
            <Text component={TextVariants.h3}>{t('Source')}</Text>
            {aInfos}
          </TextContent>
        )}
        {bInfos && (
          <TextContent id="destination" className="element-text-container">
            <Text component={TextVariants.h3}>{t('Destination')}</Text>
            {bInfos}
          </TextContent>
        )}
        <MetricsContent
          id={`edge-${aData.id}-${bData.id}`}
          metricFunction={metricFunction}
          metricType={metricType}
          metrics={[...aToBMetrics, ...bToAMetrics]}
          scope={metricScope as MetricScopeOptions}
          counters={metricCounts(aToBCount, bToACount, true)}
          showTitle
          showArea
          showScatter
        />
      </>
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
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  id?: string;
}> = ({ id, element, metrics, metricFunction, metricType, metricScope, filters, setFilters, onClose }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData();
  const dataKind = data?.resourceKind;

  const titleContent = React.useCallback(() => {
    if (dataKind) {
      return <Text component={TextVariants.h2}>{dataKind}</Text>;
    } else if (element instanceof BaseEdge) {
      return <Text component={TextVariants.h2}>{t('Edge')}</Text>;
    } else {
      return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
    }
  }, [dataKind, element, t]);

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
        {titleContent()}
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <ElementPanelContent
          element={element}
          metrics={metrics}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope as MetricScopeOptions}
          filters={filters}
          setFilters={setFilters}
        />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
