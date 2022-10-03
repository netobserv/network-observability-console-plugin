import { mount } from 'enzyme';
import * as React from 'react';

import { Chart, ChartDonut, ChartBar, ChartArea, ChartScatter, ChartGroup } from '@patternfly/react-charts';
import { MetricFunction, MetricType } from '../../../model/flow-query';
import { MetricScopeOptions } from '../../../model/metrics';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsContent } from '../metrics-content';

describe('<MetricsContent />', () => {
  const props = {
    id: 'chart-test',
    sizePx: 600,
    metricFunction: 'sum' as MetricFunction,
    metricType: 'bytes' as MetricType,
    scope: MetricScopeOptions.HOST,
    metrics,
    showTitle: true,
    smallerTexts: false,
    doubleWidth: true
  };
  it('should render component', async () => {
    const wrapper = mount(<MetricsContent {...props} />);
    expect(wrapper.find(MetricsContent)).toBeTruthy();
    expect(wrapper.find('#metrics-title').last().text()).toBe('Total bytes');
  });
  it('should render donut', async () => {
    const wrapper = mount(<MetricsContent {...props} showDonut={true} />);

    const donut = wrapper.find(ChartDonut);
    expect(donut).toHaveLength(1);
    expect(donut.props().title).toBe('49 MB');
    expect(donut.props().subTitle).toBe('Total bytes');
    expect(donut.props().data?.length).toBe(metrics.length);
    expect(wrapper.find(Chart)).toHaveLength(0);
  });
  it('should render bar', async () => {
    const wrapper = mount(<MetricsContent {...props} showBar={true} />);

    expect(wrapper.find(ChartDonut)).toHaveLength(0);
    expect(wrapper.find(Chart)).toHaveLength(1);
    expect(wrapper.find(ChartGroup)).toHaveLength(1);
    expect(wrapper.find(ChartBar)).toHaveLength(metrics.length);
    expect(wrapper.find(ChartArea)).toHaveLength(0);
    expect(wrapper.find(ChartScatter)).toHaveLength(0);
  });
  it('should render area', async () => {
    const wrapper = mount(<MetricsContent {...props} showArea={true} />);

    expect(wrapper.find(ChartDonut)).toHaveLength(0);
    expect(wrapper.find(Chart)).toHaveLength(1);
    expect(wrapper.find(ChartGroup)).toHaveLength(1);
    expect(wrapper.find(ChartBar)).toHaveLength(0);
    expect(wrapper.find(ChartArea)).toHaveLength(metrics.length);
    expect(wrapper.find(ChartScatter)).toHaveLength(0);
  });
  it('should render area with scatter', async () => {
    const wrapper = mount(<MetricsContent {...props} showArea={true} showScatter={true} />);

    expect(wrapper.find(ChartDonut)).toHaveLength(0);
    expect(wrapper.find(Chart)).toHaveLength(1);
    expect(wrapper.find(ChartGroup)).toHaveLength(2);
    expect(wrapper.find(ChartBar)).toHaveLength(0);
    expect(wrapper.find(ChartArea)).toHaveLength(metrics.length);
    expect(wrapper.find(ChartScatter)).toHaveLength(metrics.length);
  });
});
