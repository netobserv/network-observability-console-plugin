import {
  Chart,
  ChartArea,
  ChartAxis,
  ChartBar,
  ChartDonut,
  ChartGroup,
  ChartLabel,
  ChartLegend,
  ChartLegendTooltip,
  ChartScatter,
  ChartThemeColor,
  createContainer
} from '@patternfly/react-charts';
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScopeOptions } from '../../model/metrics';
import { getMetricName, getMetricValue, TopologyMetric, TopologyMetrics } from '../../api/loki';
import { MetricFunction, MetricType } from '../../model/flow-query';
import { getDateFromUnixString, twentyFourHourTime } from '../../utils/datetime';
import './metrics-content.css';

export const MetricsContent: React.FC<{
  id: string;
  sizePx?: number;
  metricFunction?: MetricFunction;
  metricType?: MetricType;
  metrics: TopologyMetrics[];
  scope: MetricScopeOptions;
  counters?: JSX.Element;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  showTitle?: boolean;
  showDonut?: boolean;
  showBar?: boolean;
  showArea?: boolean;
  showScatter?: boolean;
  smallerTexts?: boolean;
  doubleWidth?: boolean;
}> = ({
  id,
  sizePx,
  metricFunction,
  metricType,
  metrics,
  scope,
  counters,
  data,
  showTitle,
  showDonut,
  showBar,
  showArea,
  showScatter,
  smallerTexts,
  doubleWidth
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

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

  const chart = React.useCallback(() => {
    function truncate(input: string) {
      const length = doubleWidth ? 64 : showDonut ? 10 : 18;
      if (input.length > length) {
        return input.substring(0, length / 2) + '…' + input.substring(input.length - length / 2);
      }
      return input;
    }

    function truncateParts(input: string) {
      if (input.includes('.')) {
        const splitted = input.split('.');
        const result: string[] = [];
        splitted.forEach(s => {
          result.push(truncate(s));
        });
        return result.join('.');
      }
      return truncate(input);
    }

    function getName(m: TopologyMetric) {
      switch (scope) {
        case MetricScopeOptions.HOST:
          const srcNode = truncateParts(getMetricName(m, scope, true, t));
          const dstNode = truncateParts(getMetricName(m, scope, false, t));

          return data?.host
            ? m.SrcK8S_HostName === data.host
              ? `${t('To')} ${dstNode}`
              : `${t('From')} ${srcNode}`
            : `${srcNode} -> ${dstNode}`;
        case MetricScopeOptions.NAMESPACE:
          const srcNamespace = truncateParts(getMetricName(m, scope, true, t));
          const dstNamespace = truncateParts(getMetricName(m, scope, false, t));

          return data?.namespace
            ? m.SrcK8S_Namespace === data.name
              ? `${t('To')} ${dstNamespace}`
              : `${t('From')} ${srcNamespace}`
            : `${srcNamespace} -> ${dstNamespace}`;
        case MetricScopeOptions.OWNER:
          const srcOwner = truncateParts(getMetricName(m, scope, true, t));
          const dstOwner = truncateParts(getMetricName(m, scope, false, t));

          return data?.namespace
            ? m.SrcK8S_Namespace === data.namespace
              ? `${t('To')} ${dstOwner}`
              : `${t('From')} ${srcOwner}`
            : `${srcOwner} -> ${dstOwner}`;
        case MetricScopeOptions.RESOURCE:
        default:
          const src = truncateParts(getMetricName(m, scope, true, t));
          const dst = truncateParts(getMetricName(m, scope, false, t));

          return data?.addr
            ? m.SrcAddr === data.addr
              ? `${t('To')} ${dst}`
              : `${t('From')} ${src}`
            : `${src} -> ${dst}`;
      }
    }

    const total = metrics.reduce((prev, cur) => prev + cur.total, 0);

    const legendData = metrics.map(m => ({
      childName: `${showBar ? 'bar-' : 'area-'}${metrics.indexOf(m)}`,
      name: getName(m.metric)
    }));

    const CursorVoronoiContainer = createContainer('voronoi', 'cursor');

    const containerComponent = (
      <CursorVoronoiContainer
        cursorDimension="x"
        labels={({
          datum
        }: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          datum: any;
        }) => `${datum.y !== null ? datum.y : 'no data'}`}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        labelComponent={<ChartLegendTooltip legendData={legendData} title={(datum: any) => datum.x} />}
        mouseFollowTooltips
        voronoiDimension="x"
        voronoiPadding={50}
      />
    );

    const legentComponent = (
      <ChartLegend
        labelComponent={<ChartLabel className={smallerTexts ? 'small-chart-label' : ''} />}
        data={legendData}
      />
    );

    return (
      <div
        id={`chart-${id}`}
        style={{
          width: sizePx ? `${doubleWidth ? 2 * sizePx : sizePx}px` : '100%',
          height: sizePx ? `${sizePx}px` : '100%',
          alignSelf: 'center'
        }}
      >
        {showDonut ? (
          <ChartDonut
            themeColor={ChartThemeColor.multiUnordered}
            constrainToVisibleArea
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="right"
            legendAllowWrap={true}
            legendComponent={legentComponent}
            labels={({ datum }) => datum.x}
            width={doubleWidth ? 1000 : 500}
            height={350}
            data={metrics
              .sort((a, b) => a.total - b.total)
              .map((m: TopologyMetrics) => ({ x: `${((m.total / total) * 100).toFixed(2)}%`, y: m.total }))}
            padding={{
              bottom: 20,
              left: 20,
              right: 300,
              top: 20
            }}
            title={`${getMetricValue(total, metricFunction, metricType)}`}
            subTitle={metricTitle()}
          />
        ) : (
          <Chart
            themeColor={ChartThemeColor.multiUnordered}
            ariaTitle={metricTitle()}
            containerComponent={containerComponent}
            legendData={legendData}
            legendOrientation="vertical"
            legendPosition="bottom-left"
            legendAllowWrap={true}
            legendComponent={legentComponent}
            //TODO: fix refresh on selection change to enable animation
            //animate={true}
            //TODO: check if time scale could be interesting (buggy with current strings)
            scale={{ x: 'linear', y: 'sqrt' }}
            width={doubleWidth ? 1400 : 700}
            height={600}
            domainPadding={{ x: 0, y: 0 }}
            padding={{
              bottom: legendData.length * 25 + 50,
              left: 75,
              right: 50,
              top: 50
            }}
          >
            <ChartAxis fixLabelOverlap />
            <ChartAxis
              dependentAxis
              showGrid
              fixLabelOverlap
              tickFormat={y => getMetricValue(y, metricFunction, metricType)}
            />
            {showBar && (
              <ChartGroup>
                {metrics.map(m => (
                  <ChartBar
                    name={`bar-${metrics.indexOf(m)}`}
                    key={`bar-${metrics.indexOf(m)}`}
                    sortKey={'time'}
                    sortOrder={'ascending'}
                    data={m.values.map(v => ({
                      time: getDateFromUnixString(v[0] as string).getTime(),
                      name: getName(m.metric),
                      x: twentyFourHourTime(getDateFromUnixString(v[0] as string), true),
                      y: Number(v[1])
                    }))}
                  />
                ))}
              </ChartGroup>
            )}
            {showArea && (
              <ChartGroup>
                {metrics.map(m => (
                  <ChartArea
                    name={`area-${metrics.indexOf(m)}`}
                    key={`area-${metrics.indexOf(m)}`}
                    sortKey={'time'}
                    sortOrder={'ascending'}
                    data={m.values.map(v => ({
                      time: getDateFromUnixString(v[0] as string).getTime(),
                      name: getName(m.metric),
                      x: twentyFourHourTime(getDateFromUnixString(v[0] as string), true),
                      y: Number(v[1])
                    }))}
                    interpolation="monotoneX"
                  />
                ))}
              </ChartGroup>
            )}
            {showScatter && (
              <ChartGroup>
                {metrics.map(m => (
                  <ChartScatter
                    name={`scatter-${metrics.indexOf(m)}`}
                    key={`scatter-${metrics.indexOf(m)}`}
                    sortKey={'time'}
                    sortOrder={'ascending'}
                    data={m.values.map(v => ({
                      time: getDateFromUnixString(v[0] as string).getTime(),
                      name: getName(m.metric),
                      x: twentyFourHourTime(getDateFromUnixString(v[0] as string), true),
                      y: Number(v[1])
                    }))}
                  />
                ))}
              </ChartGroup>
            )}
          </Chart>
        )}
      </div>
    );
  }, [
    data,
    doubleWidth,
    id,
    metricFunction,
    metricTitle,
    metricType,
    metrics,
    scope,
    showArea,
    showBar,
    showDonut,
    showScatter,
    sizePx,
    smallerTexts,
    t
  ]);

  return (
    <TextContent id="metrics" className="metrics-content-div">
      {showTitle && (
        <Text id="metrics-title" component={TextVariants.h3}>
          {metricTitle()}
        </Text>
      )}
      {counters}
      {chart()}
    </TextContent>
  );
};

export default MetricsContent;
