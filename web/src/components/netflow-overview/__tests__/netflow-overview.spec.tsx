import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { EmptyState } from '@patternfly/react-core';
import LokiError from '../../../components/messages/loki-error';
import { metrics, droppedMetrics } from '../../../components/__tests-data__/metrics';

import { MetricType, RecordType } from '../../../model/flow-query';
import { SamplePanel, ShuffledDefaultPanels } from '../../__tests-data__/panels';
import { NetflowOverview, NetflowOverviewProps } from '../netflow-overview';
import { NetflowOverviewPanel } from '../netflow-overview-panel';
import { TruncateLength } from '../../../components/dropdowns/truncate-dropdown';

describe('<NetflowOverview />', () => {
  const props: NetflowOverviewProps = {
    limit: 5,
    panels: ShuffledDefaultPanels,
    error: undefined as string | undefined,
    loading: false,
    recordType: 'flowLog' as RecordType,
    metricType: 'bytes' as MetricType,
    metrics: [],
    droppedMetrics: [],
    totalMetric: undefined,
    filterActionLinks: <></>,
    truncateLength: TruncateLength.M
  };
  it('should render component', async () => {
    const wrapper = shallow(<NetflowOverview {...props} />);
    expect(wrapper.find(NetflowOverview)).toBeTruthy();
  });
  it('should render error', async () => {
    const wrapper = shallow(<NetflowOverview {...props} />);
    wrapper.setProps({
      error: 'couic!'
    });
    wrapper.update();
    expect(wrapper.find(LokiError)).toHaveLength(1);
  });
  it('should render empty state', async () => {
    const wrapper = mount(<NetflowOverview {...props} />);
    const containerDiv = wrapper.find(EmptyState);
    expect(containerDiv.length).toEqual(1);
  });
  it('should render panels', async () => {
    const wrapper = mount(
      <NetflowOverview
        {...props}
        metrics={metrics}
        droppedMetrics={droppedMetrics}
        totalMetric={metrics[0]}
        totalDroppedMetric={droppedMetrics[0]}
      />
    );
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(props.panels.length);
    wrapper.setProps({
      panels: [SamplePanel]
    });
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(1);
  });
});
