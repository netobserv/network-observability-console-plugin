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
import { BaseEdge, BaseNode, GraphElement } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import { getMetricValue, Metrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { ElementData, isElementFiltered, toggleElementFilter } from '../../model/topology';
import './element-panel.css';
import MetricsContent from '../metrics/metrics-content';
import { MetricScopeOptions } from '../../model/metrics';

export const ElementPanelContent: React.FC<{
  element: GraphElement;
  metrics: Metrics[];
  metricStep: number;
  metricFunction: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ element, metrics, metricStep, metricFunction, metricType, metricScope, filters, setFilters }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData();
  const type = element.getType();

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
    (d: ElementData) => {
      let infos: React.ReactElement | undefined;
      if (d.type && d.name) {
        const resourceData = {
          type: d.type,
          namespace: d.namespace,
          name: d.name
        };
        infos = (
          <TextContent id="resourcelink" className="element-text-container grouped">
            <Text component={TextVariants.h4}>{d.type}</Text>
            <Flex>
              <FlexItem flex={{ default: 'flex_1' }}>
                <ResourceLink inline={true} kind={d.type} name={d.name} namespace={d.namespace} />
              </FlexItem>
              <FlexItem>
                <Button variant="link" aria-label="Filter" onClick={() => onFilter(resourceData)}>
                  {isFiltered(resourceData) ? <TimesIcon /> : <FilterIcon />}
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
    (toCount: number, fromCount: number, forEdge: boolean) => {
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
              <Text id="fromCount">{getMetricValue(fromCount, metricFunction, metricType)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="toCount">{getMetricValue(toCount, metricFunction, metricType)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="total">{getMetricValue(toCount + fromCount, metricFunction, metricType)}</Text>
            </FlexItem>
          </Flex>
        </Flex>
      );
    },
    [metricFunction, metricType, t]
  );

  let srcCount = 0;
  let dstCount = 0;

  if (element instanceof BaseNode) {
    function matchExclusively(d: Metrics, field: string, value: string) {
      const m = d.metric as never;

      return (
        m[`SrcK8S_${field}`] !== m[`DstK8S_${field}`] &&
        (m[`SrcK8S_${field}`] === value || m[`DstK8S_${field}`] === value)
      );
    }

    const nodeMetrics =
      type === 'group'
        ? metrics.filter(m => {
            switch (data.type) {
              case 'Namespace':
                //namespace must match exclusively Source OR Destination
                return matchExclusively(m, 'Namespace', data.name);
              case 'Node':
                //host must match exclusively Source OR Destination
                return matchExclusively(m, 'HostName', data.name);
              default:
                //fallback on Owners match exclusively Source OR Destination
                return matchExclusively(m, 'OwnerName', data.name);
            }
          })
        : metrics.filter(m => {
            switch (metricScope) {
              case MetricScopeOptions.NAMESPACE:
                //namespace must match exclusively Source OR Destination
                return matchExclusively(m, 'Namespace', data.namespace);
              case MetricScopeOptions.HOST:
                //host must match exclusively Source OR Destination
                return matchExclusively(m, 'HostName', data.host);
              case MetricScopeOptions.OWNER:
                //owner must match exclusively Source OR Destination
                return matchExclusively(m, 'OwnerName', data.name);
              case MetricScopeOptions.RESOURCE:
              default:
                //fallback on ip addresses
                return m.metric.SrcAddr === data.addr || m.metric.DstAddr === data.addr;
            }
          });
    nodeMetrics.forEach(m => {
      if (type === 'group') {
        if (data.type === 'Namespace') {
          if (m.metric.SrcK8S_Namespace === data.name) {
            srcCount += m.total;
          } else {
            dstCount += m.total;
          }
        } else if (data.type === 'Node') {
          if (m.metric.SrcK8S_HostName === data.name) {
            srcCount += m.total;
          } else {
            dstCount += m.total;
          }
        } else {
          if (m.metric.SrcK8S_OwnerName === data.name) {
            srcCount += m.total;
          } else {
            dstCount += m.total;
          }
        }
      } else {
        if (m.metric.SrcAddr === data.addr) {
          srcCount += m.total;
        } else {
          dstCount += m.total;
        }
      }
    });
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
          id={`node-${data.id}`}
          metricStep={metricStep}
          metricFunction={metricFunction}
          metricType={metricType}
          metrics={nodeMetrics}
          scope={metricScope as MetricScopeOptions}
          data={data}
          counters={metricCounts(srcCount, dstCount, false)}
          showTitle
          showArea
          showScatter
        />
      </>
    );
  } else if (element instanceof BaseEdge) {
    const srcData = element.getSource().getData();
    const tgtData = element.getTarget().getData();
    const edgeMetrics = metrics.filter(m => {
      //must match Source / Destination
      switch (metricScope) {
        case MetricScopeOptions.HOST:
          return (
            (m.metric.SrcK8S_HostName === srcData.host && m.metric.DstK8S_HostName === tgtData.host) ||
            (m.metric.SrcK8S_HostName === tgtData.host && m.metric.DstK8S_HostName === srcData.host)
          );
        case MetricScopeOptions.NAMESPACE:
          return (
            (m.metric.SrcK8S_Namespace === srcData.name && m.metric.DstK8S_Namespace === tgtData.name) ||
            (m.metric.SrcK8S_Namespace === tgtData.name && m.metric.DstK8S_Namespace === srcData.name)
          );
        case MetricScopeOptions.OWNER:
          return (
            (m.metric.SrcK8S_OwnerName === srcData.name && m.metric.DstK8S_OwnerName === tgtData.name) ||
            (m.metric.SrcK8S_OwnerName === tgtData.name && m.metric.DstK8S_OwnerName === srcData.name)
          );
        case MetricScopeOptions.RESOURCE:
        default:
          return (
            (m.metric.SrcAddr === srcData.addr && m.metric.DstAddr === tgtData.addr) ||
            (m.metric.SrcAddr === tgtData.addr && m.metric.DstAddr === srcData.addr)
          );
      }
    });
    edgeMetrics.forEach(m => {
      if (
        (metricScope === MetricScopeOptions.HOST && m.metric.SrcK8S_HostName === srcData.host) ||
        m.metric.SrcAddr === srcData.addr
      ) {
        srcCount += m.total;
      } else {
        dstCount += m.total;
      }
    });
    const srcInfos = resourceInfos(srcData);
    const tgtInfos = resourceInfos(tgtData);
    return (
      <>
        {srcInfos && (
          <TextContent id="source" className="element-text-container">
            <Text component={TextVariants.h3}>{t('Source')}</Text>
            {srcInfos}
          </TextContent>
        )}
        {tgtInfos && (
          <TextContent id="destination" className="element-text-container">
            <Text component={TextVariants.h3}>{t('Destination')}</Text>
            {tgtInfos}
          </TextContent>
        )}
        <MetricsContent
          id={`edge-${srcData.id}-${tgtData.id}`}
          metricStep={metricStep}
          metricFunction={metricFunction}
          metricType={metricType}
          metrics={edgeMetrics}
          scope={metricScope as MetricScopeOptions}
          counters={metricCounts(dstCount, srcCount, true)}
          showTitle
          showArea
          showScatter
        />
      </>
    );
  } else {
    return <></>;
  }
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElement;
  metrics: Metrics[];
  metricStep: number;
  metricFunction: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  id?: string;
}> = ({ id, element, metrics, metricStep, metricFunction, metricType, metricScope, filters, setFilters, onClose }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const data = element.getData();

  const titleContent = React.useCallback(() => {
    if (data.type) {
      return <Text component={TextVariants.h2}>{data.type}</Text>;
    } else if (element instanceof BaseEdge) {
      return <Text component={TextVariants.h2}>{t('Edge')}</Text>;
    } else {
      return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
    }
  }, [data.type, element, t]);

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
          metricStep={metricStep}
          metricFunction={metricFunction}
          metricType={metricType}
          metricScope={metricScope as MetricScope}
          filters={filters}
          setFilters={setFilters}
        />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
