import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartGroup,
  ChartScatter,
  ChartThemeColor,
  ChartVoronoiContainer
} from '@patternfly/react-charts';
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
import { TopologyMetrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { MetricFunction, MetricScope, MetricType } from '../../model/flow-query';
import { MetricScopeOptions } from '../../model/metrics';
import { ElementData, isElementFiltered, toggleElementFilter } from '../../model/topology';
import { humanFileSize } from '../../utils/bytes';
import { roundTwoDigits } from '../../utils/count';
import { getDateFromUnixString, twentyFourHourTime } from '../../utils/datetime';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import './element-panel.css';

export const ElementPanelContent: React.FC<{
  element: GraphElement;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ element, metrics, metricFunction, metricType, metricScope, filters, setFilters }) => {
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

  const metricTitle = React.useCallback(() => {
    if (metricFunction === 'rate') {
      return t('Flows rate');
    } else if (metricType) {
      switch (metricFunction) {
        case 'avg':
          return t('Average {{type}} (1m frame)', { type: metricType });
        case 'max':
          return t('Max {{type}} (1m frame)', { type: metricType });
        case 'sum':
          return t('Total {{type}}', { type: metricType });
        default:
          return '';
      }
    } else {
      console.error('metricType cannot be undefined');
      return '';
    }
  }, [metricFunction, metricType, t]);

  const metricValue = React.useCallback(
    (v: number) => {
      return metricFunction !== 'rate' && metricType === 'bytes' ? humanFileSize(v, true, 0) : roundTwoDigits(v);
    },
    [metricFunction, metricType]
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
              <Text id="fromCount">{metricValue(fromCount)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="toCount">{metricValue(toCount)}</Text>
            </FlexItem>
            <FlexItem>
              <Text id="total">{metricValue(toCount + fromCount)}</Text>
            </FlexItem>
          </Flex>
        </Flex>
      );
    },
    [metricValue, t]
  );

  const chart = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (id: string, elementMetrics: TopologyMetrics[], nodeData?: any) => {
      function getName(m: TopologyMetrics) {
        switch (metricScope) {
          case MetricScopeOptions.HOST:
            const srcNode = m.metric.SrcK8S_HostName ? m.metric.SrcK8S_HostName : t('External');
            const dstNode = m.metric.DstK8S_HostName ? m.metric.DstK8S_HostName : t('External');
            return nodeData?.host
              ? m.metric.SrcK8S_HostName === nodeData.host
                ? `${t('To')} ${dstNode}`
                : `${t('From')} ${srcNode}`
              : `${srcNode} -> ${dstNode}`;
          case MetricScopeOptions.NAMESPACE:
            const srcNamespace = m.metric.SrcK8S_Namespace ? m.metric.SrcK8S_Namespace : t('Unknown');
            const dstNamespace = m.metric.DstK8S_Namespace ? m.metric.DstK8S_Namespace : t('Unknown');
            return nodeData?.namespace
              ? m.metric.SrcK8S_Namespace === nodeData.name
                ? `${t('To')} ${dstNamespace}`
                : `${t('From')} ${srcNamespace}`
              : `${srcNamespace} -> ${dstNamespace}`;
          case MetricScopeOptions.OWNER:
            let srcOwner = t('Unknown');
            if (m.metric.SrcK8S_Namespace && m.metric.SrcK8S_OwnerName) {
              srcOwner = `${m.metric.SrcK8S_Namespace}.${m.metric.SrcK8S_OwnerName}`;
            } else if (m.metric.SrcK8S_OwnerName) {
              srcOwner = m.metric.SrcK8S_OwnerName;
            }

            let dstOwner = t('Unknown');
            if (m.metric.DstK8S_Namespace && m.metric.DstK8S_OwnerName) {
              dstOwner = `${m.metric.DstK8S_Namespace}.${m.metric.DstK8S_OwnerName}`;
            } else if (m.metric.DstK8S_OwnerName) {
              dstOwner = m.metric.DstK8S_OwnerName;
            }
            return nodeData?.namespace
              ? m.metric.SrcK8S_Namespace === nodeData.namespace
                ? `${t('To')} ${dstOwner}`
                : `${t('From')} ${srcOwner}`
              : `${srcOwner} -> ${dstOwner}`;
          case MetricScopeOptions.RESOURCE:
          default:
            let src = m.metric.SrcAddr;
            if (m.metric.SrcK8S_Namespace && m.metric.SrcK8S_Name) {
              src = `${m.metric.SrcK8S_Namespace}.${m.metric.SrcK8S_Name}`;
            } else if (m.metric.SrcK8S_Name) {
              src = m.metric.SrcK8S_Name;
            }

            let dst = m.metric.DstAddr;
            if (m.metric.DstK8S_Namespace && m.metric.DstK8S_Name) {
              dst = `${m.metric.DstK8S_Namespace}.${m.metric.DstK8S_Name}`;
            } else if (m.metric.DstK8S_Name) {
              dst = m.metric.DstK8S_Name;
            }
            return nodeData?.addr
              ? m.metric.SrcAddr === nodeData.addr
                ? `${t('To')} ${dst}`
                : `${t('From')} ${src}`
              : `${src} -> ${dst}`;
        }
      }

      const legendData = elementMetrics.map(m => ({
        name: getName(m)
      }));

      return (
        <div id={`${id}-chart`}>
          <Chart
            themeColor={ChartThemeColor.multiUnordered}
            ariaTitle={metricTitle()}
            containerComponent={
              <ChartVoronoiContainer
                labels={({ datum }) => (datum.childName.includes('area-') ? `${datum.name}: ${datum.y}` : '')}
                constrainToVisibleArea
              />
            }
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="bottom-left"
            legendAllowWrap={true}
            //TODO: fix refresh on selection change to enable animation
            //animate={true}
            //TODO: check if time scale could be interesting (buggy with current strings)
            scale={{ x: 'linear', y: 'sqrt' }}
            height={300 + legendData.length * 25}
            domainPadding={{ x: 0, y: 0 }}
            padding={{
              bottom: legendData.length * 25 + 50,
              left: 75,
              right: 50,
              top: 50
            }}
          >
            <ChartAxis fixLabelOverlap />
            <ChartAxis dependentAxis showGrid fixLabelOverlap tickFormat={y => metricValue(y)} />
            <ChartGroup>
              {elementMetrics.map(m => (
                <ChartArea
                  name={`area-${metrics.indexOf(m)}`}
                  key={`area-${metrics.indexOf(m)}`}
                  data={m.values.map(v => ({
                    name: getName(m),
                    x: twentyFourHourTime(getDateFromUnixString(v[0] as string), true),
                    y: Number(v[1])
                  }))}
                  interpolation="monotoneX"
                />
              ))}
            </ChartGroup>
            <ChartGroup>
              {elementMetrics.map(m => (
                <ChartScatter
                  name={`scatter-${metrics.indexOf(m)}`}
                  key={`scatter-${metrics.indexOf(m)}`}
                  data={m.values.map(v => ({
                    name: getName(m),
                    x: twentyFourHourTime(getDateFromUnixString(v[0] as string), true),
                    y: Number(v[1])
                  }))}
                />
              ))}
            </ChartGroup>
          </Chart>
        </div>
      );
    },
    [metricTitle, metricValue, metrics, metricScope, t]
  );

  let srcCount = 0;
  let dstCount = 0;

  if (element instanceof BaseNode) {
    function getFieldFromType(type: string) {
      switch (type.toLowerCase()) {
        case 'namespace':
          return 'Namespace';
        case 'host':
        case 'node':
          return 'HostName';
        default:
          return 'OwnerName';
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function match(d: TopologyMetrics, data: any, elementType: string) {
      const m = d.metric as never;

      const field = getFieldFromType(elementType);
      if (data.parentType && data.parentName) {
        const parentField = getFieldFromType(data.parentType);

        //match both parent / child source or dest criterias
        return (
          (m[`SrcK8S_${field}`] === data.name && m[`SrcK8S_${parentField}`] === data.parentName) ||
          (m[`DstK8S_${field}`] === data.name && m[`DstK8S_${parentField}`] === data.parentName)
        );
      }

      //match exclusively src or dest criteria
      return (
        m[`SrcK8S_${field}`] !== m[`DstK8S_${field}`] &&
        (m[`SrcK8S_${field}`] === data.name || m[`DstK8S_${field}`] === data.name)
      );
    }

    const nodeMetrics = metrics.filter(m =>
      type === 'group'
        ? match(m, data, data.type)
        : metricScope === MetricScopeOptions.RESOURCE
        ? m.metric.SrcAddr === data.addr || m.metric.DstAddr === data.addr
        : match(m, data, metricScope)
    );
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
        <TextContent id="metrics" className="element-text-container">
          <Text component={TextVariants.h3}>{metricTitle()}</Text>
          {metricCounts(srcCount, dstCount, false)}
          {chart(`node-${data.id}`, nodeMetrics, data)}
        </TextContent>
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
        <TextContent id="metrics" className="element-text-container">
          <Text component={TextVariants.h3}>{metricTitle()}</Text>
          {metricCounts(dstCount, srcCount, true)}
          {chart(`edge-${srcData.id}-${tgtData.id}`, edgeMetrics)}
        </TextContent>
      </>
    );
  } else {
    return <></>;
  }
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElement;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType?: MetricType;
  metricScope: MetricScope;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  id?: string;
}> = ({ id, element, metrics, metricFunction, metricType, metricScope, filters, setFilters, onClose }) => {
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
