import { mount } from 'enzyme';
import * as React from 'react';

import { Chart, ChartDonut, ChartBar, ChartArea, ChartScatter, ChartGroup } from '@patternfly/react-charts';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsContent, MetricsContentProps } from '../metrics-content';

describe('<MetricsContent />', () => {
  const props: MetricsContentProps = {
    id: 'chart-test',
    title: 'chart-test',
    sizePx: 600,
    metricType: 'bytes',
    metrics: metrics.map(m => ({ ...m, name: 'whatever', isInternal: false })),
    showTitle: true,
    smallerTexts: false,
    doubleWidth: true,
    limit: 5
  };
  it('should render component', async () => {
    const wrapper = mount(<MetricsContent {...props} />);
    expect(wrapper.find(MetricsContent)).toBeTruthy();
    expect(wrapper.find('#metrics-title').last().text()).toBe('chart-test');
  });
  it('should render bar', async () => {
    const wrapper = mount(<MetricsContent {...props} showBar={true} />);

    expect(wrapper.find(ChartDonut)).toHaveLength(0);
    expect(wrapper.find(Chart)).toHaveLength(1);
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
