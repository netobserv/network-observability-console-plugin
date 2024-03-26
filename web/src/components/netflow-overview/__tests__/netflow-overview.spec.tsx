import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { EmptyState } from '@patternfly/react-core';
import LokiError from '../../../components/messages/loki-error';
import { metrics, droppedMetrics } from '../../../components/__tests-data__/metrics';

import { RecordType } from '../../../model/flow-query';
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
    metrics: {
      customMetrics: new Map(),
      totalCustomMetrics: new Map()
    },
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
  it('should render empty states', async () => {
    const wrapper = mount(<NetflowOverview {...props} />);
    const containerDiv = wrapper.find(EmptyState);
    // 12 panels are expected here according to getDefaultOverviewPanels isSelected items
    expect(containerDiv.length).toEqual(12);
  });
  it('should render panels', async () => {
    const wrapper = mount(
      <NetflowOverview
        {...props}
        metrics={{
          ...props.metrics,
          rateMetrics: { bytes: metrics },
          droppedRateMetrics: { bytes: droppedMetrics },
          totalRateMetric: { bytes: metrics[0] },
          totalDroppedRateMetric: { bytes: droppedMetrics[0] }
        }}
      />
    );
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(props.panels.length);
    wrapper.setProps({
      panels: [SamplePanel]
    });
    expect(wrapper.find(NetflowOverviewPanel)).toHaveLength(1);
  });
});
