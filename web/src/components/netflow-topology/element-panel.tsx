import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import {
  Chart,
  ChartArea,
  ChartScatter,
  ChartAxis,
  ChartGroup,
  ChartVoronoiContainer,
  ChartThemeColor
} from '@patternfly/react-charts';
import {
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
import { BaseEdge, BaseNode, GraphElement } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricFunction, MetricType } from 'src/model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { humanFileSize } from '../../utils/bytes';
import { roundTwoDigits } from '../../utils/count';
import { getDateFromUnixString, twentyFourHourTime } from '../../utils/datetime';
import './element-panel.css';

export type ElementDrawerProps = {
  onClose: () => void;
  element: GraphElement;
  metrics: TopologyMetrics[];
  metricFunction: MetricFunction;
  metricType: MetricType;
  id?: string;
};

export const ElementPanel: React.FC<ElementDrawerProps> = ({
  id,
  element,
  metrics,
  metricFunction,
  metricType,
  onClose
}) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const data = element.getData();
  const type = element.getType();

  const titleContent = React.useCallback(() => {
    if (data.type) {
      return <Text component={TextVariants.h2}>{data.type}</Text>;
    } else if (element instanceof BaseEdge) {
      return <Text component={TextVariants.h2}>{t('Edge')}</Text>;
    } else {
      return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
    }
  }, [data.type, element, t]);

  const ressourceInfos = React.useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (d: any) => {
      let infos: React.ReactElement | undefined;
      if (d.type && d.name) {
        infos = (
          <TextContent className="element-text-container grouped">
            <Text component={TextVariants.h4}>{d.type}</Text>
            <ResourceLink inline={true} kind={d.type} name={d.name} namespace={d.namespace} />
          </TextContent>
        );
      }
      if (d.addr) {
        infos = (
          <>
            {infos}
            <TextContent className="element-text-container grouped">
              <Text component={TextVariants.h4}>{t('Address')}</Text>
              <Text>{d.addr}</Text>
            </TextContent>
          </>
        );
      }
      return infos;
    },
    [t]
  );

  const metricTitle = React.useCallback(() => {
    if (metricFunction === 'rate') {
      return t('Flows rate');
    } else {
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
                <Text className="element-text" component={TextVariants.h4}>{`${
                  forEdge ? t('Source to destination:') : t('In:')
                }`}</Text>
              </FlexItem>
            </FlexItem>
            <FlexItem>
              <FlexItem>
                <Text className="element-text" component={TextVariants.h4}>{`${
                  forEdge ? t('Destination to source:') : t('Out:')
                }`}</Text>
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
              <Text>{metricValue(fromCount)}</Text>
            </FlexItem>
            <FlexItem>
              <Text>{metricValue(toCount)}</Text>
            </FlexItem>
            <FlexItem>
              <Text>{metricValue(toCount + fromCount)}</Text>
            </FlexItem>
          </Flex>
        </Flex>
      );
    },
    [metricValue, t]
  );

  const chart = React.useCallback(
    (id: string, elementMetrics: TopologyMetrics[], addr?: string) => {
      function getName(m: TopologyMetrics) {
        return addr
          ? m.metric.SrcAddr === addr
            ? `${t('To')} ${m.metric.DstK8S_Name ? m.metric.DstK8S_Name : m.metric.DstAddr}`
            : `${t('From')} ${m.metric.SrcK8S_Name ? m.metric.SrcK8S_Name : m.metric.SrcAddr}`
          : `${m.metric.SrcK8S_Name ? m.metric.SrcK8S_Name : m.metric.SrcAddr} -> ${
              m.metric.DstK8S_Name ? m.metric.DstK8S_Name : m.metric.DstAddr
            }`;
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
    [metricTitle, metricValue, metrics, t]
  );

  const bodyContent = React.useCallback(() => {
    let srcCount = 0;
    let dstCount = 0;

    if (element instanceof BaseNode) {
      const nodeMetrics =
        type === 'group'
          ? metrics.filter(m =>
              //namespace must match exclusively Source OR Destination
              data.type === 'Namespace'
                ? m.metric.SrcK8S_Namespace !== m.metric.DstK8S_Namespace &&
                  (m.metric.SrcK8S_Namespace === data.name || m.metric.DstK8S_Namespace === data.name)
                : //host must match exclusively Source OR Destination
                data.type === 'Node'
                ? m.metric.SrcK8S_HostIP !== m.metric.DstK8S_HostIP &&
                  (m.metric.SrcK8S_HostIP === data.name || m.metric.DstK8S_HostIP === data.name)
                : //fallback on Owners match exclusively Source OR Destination
                  m.metric.SrcK8S_OwnerName !== m.metric.DstK8S_OwnerName &&
                  (m.metric.SrcK8S_OwnerName === data.name || m.metric.DstK8S_OwnerName === data.name)
            )
          : //Pods / Services must match Source, Destination or both
            metrics.filter(m => m.metric.SrcAddr === data.addr || m.metric.DstAddr === data.addr);
      nodeMetrics.forEach(m => {
        if (type === 'group') {
          if (data.type === 'Namespace') {
            if (m.metric.SrcK8S_Namespace === data.name) {
              srcCount += m.total;
            } else {
              dstCount += m.total;
            }
          } else if (data.type === 'Node') {
            if (m.metric.SrcK8S_HostIP === data.name) {
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
      return (
        <>
          <TextContent className="element-text-container">
            <Text component={TextVariants.h3}>{t('Infos')}</Text>
            {ressourceInfos(data)}
          </TextContent>
          <TextContent className="element-text-container">
            <Text component={TextVariants.h3}>{metricTitle()}</Text>
            {metricCounts(srcCount, dstCount, false)}
            {chart(`node-${data.addr}`, nodeMetrics, data.addr)}
          </TextContent>
        </>
      );
    } else if (element instanceof BaseEdge) {
      const srcData = element.getSource().getData();
      const tgtData = element.getTarget().getData();
      const edgeMetrics = metrics.filter(
        m =>
          (m.metric.SrcAddr === srcData.addr && m.metric.DstAddr === tgtData.addr) ||
          (m.metric.SrcAddr === tgtData.addr && m.metric.DstAddr === srcData.addr)
      );
      edgeMetrics.forEach(m => {
        if (m.metric.SrcAddr === srcData.addr) {
          srcCount += m.total;
        } else {
          dstCount += m.total;
        }
      });
      return (
        <>
          <TextContent className="element-text-container">
            <Text component={TextVariants.h3}>{t('Source')}</Text>
            {ressourceInfos(srcData)}
          </TextContent>
          <TextContent className="element-text-container">
            <Text component={TextVariants.h3}>{t('Destination')}</Text>
            {ressourceInfos(tgtData)}
          </TextContent>
          <TextContent className="element-text-container">
            <Text component={TextVariants.h3}>{metricTitle()}</Text>
            {metricCounts(dstCount, srcCount, true)}
            {chart(`edge-${srcData.addr}-${tgtData.addr}`, edgeMetrics)}
          </TextContent>
        </>
      );
    } else {
      return undefined;
    }
  }, [chart, data, element, metricCounts, metricTitle, metrics, ressourceInfos, t, type]);

  return (
    <DrawerPanelContent id={id}>
      <DrawerHead>
        {titleContent()}
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>{bodyContent()}</DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
