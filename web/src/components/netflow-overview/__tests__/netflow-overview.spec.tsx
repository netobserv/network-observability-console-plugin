import { mount, shallow } from 'enzyme';
import * as React from 'react';

import { EmptyState } from '@patternfly/react-core';
import { droppedMetrics, metrics } from '../../../components/__tests-data__/metrics';

import { TruncateLength } from '../../../components/dropdowns/truncate-dropdown';
import { RecordType } from '../../../model/flow-query';
import { SamplePanel, ShuffledDefaultPanels } from '../../__tests-data__/panels';
import { NetflowOverview, NetflowOverviewProps } from '../netflow-overview';
import { NetflowOverviewPanel } from '../netflow-overview-panel';

describe('<NetflowOverview />', () => {
  const props: NetflowOverviewProps = {
    limit: 5,
    panels: ShuffledDefaultPanels,
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
