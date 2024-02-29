import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';

export const MetricTypeDropdown: React.FC<{
  selected?: string;
  setMetricType: (v: MetricType) => void;
  isTopology?: boolean;
  allowPktDrop?: boolean;
  allowDNSMetric?: boolean;
  allowRTTMetric?: boolean;
  id?: string;
}> = ({ selected, setMetricType, id, isTopology, allowPktDrop, allowDNSMetric, allowRTTMetric }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const getMetricTypeOptions = React.useCallback(() => {
    let options: MetricType[] = ['bytes', 'packets'];
    if (isTopology) {
      if (allowPktDrop) {
        options = options.concat('droppedBytes', 'droppedPackets');
      }
      if (allowDNSMetric) {
        options.push('dnsLatencies');
      }
      if (allowRTTMetric) {
        options.push('flowRtt');
      }
    }
    return options;
  }, [allowDNSMetric, allowPktDrop, allowRTTMetric, isTopology]);

  const getMetricDisplay = React.useCallback(
    (metricType: MetricType): string => {
      switch (metricType) {
        case 'bytes':
          return t('Bytes');
        case 'droppedBytes':
          return t('Dropped bytes');
        case 'packets':
          return t('Packets');
        case 'droppedPackets':
          return t('Dropped packets');
        case 'dnsLatencies':
          return t('DNS latencies');
        case 'flowRtt':
          return t('RTT');
        default:
          throw new Error('getMetricDisplay called with invalid metricType: ' + metricType);
      }
    },
    [t]
  );

  return (
    <Dropdown
      data-test={id}
      id={id}
      isOpen={isOpen}
      popperProps={{
        position: 'right'
      }}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isExpanded={isOpen}
          onClick={() => setOpen(!isOpen)}
        >
          {getMetricDisplay(selected as MetricType)}
        </MenuToggle>
      )}
    >
      {getMetricTypeOptions().map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setOpen(false);
            setMetricType(v);
          }}
        >
          {getMetricDisplay(v)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default MetricTypeDropdown;
