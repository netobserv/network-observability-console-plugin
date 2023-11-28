import { mount } from 'enzyme';
import * as React from 'react';

import { Chart, ChartDonut, ChartBar, ChartArea, ChartScatter, ChartGroup } from '@patternfly/react-charts';
import { metrics } from '../../__tests-data__/metrics';
import { MetricsContent, MetricsContentProps } from '../metrics-content';

describe('<MetricsContent />', () => {
  const props: MetricsContentProps = {
    id: 'chart-test',
    metricType: 'bytes',
    metrics: metrics.map(m => ({ ...m, fullName: 'whatever', shortName: 'whatever', isInternal: false })),
    smallerTexts: false,
    limit: 5,
    tooltipsTruncate: true
  };
  it('should render component', async () => {
    const wrapper = mount(<MetricsContent {...props} />);
    expect(wrapper.find(MetricsContent)).toBeTruthy();
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
