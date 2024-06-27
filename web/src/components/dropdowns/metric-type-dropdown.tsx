import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';

export interface MetricTypeDropdownProps {
  selected?: string;
  setMetricType: (v: MetricType) => void;
  isTopology?: boolean;
  allowPktDrop?: boolean;
  allowDNSMetric?: boolean;
  allowRTTMetric?: boolean;
  id?: string;
}

export const MetricTypeDropdown: React.FC<MetricTypeDropdownProps> = ({
  selected,
  setMetricType,
  id,
  isTopology,
  allowPktDrop,
  allowDNSMetric,
  allowRTTMetric
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getMetricTypeOptions = React.useCallback(() => {
    let options: MetricType[] = ['Bytes', 'Packets'];
    if (isTopology) {
      if (allowPktDrop) {
        options = options.concat('PktDropBytes', 'PktDropPackets');
      }
      if (allowDNSMetric) {
        options.push('DnsLatencyMs');
      }
      if (allowRTTMetric) {
        options.push('TimeFlowRttNs');
      }
    }
    return options;
  }, [allowDNSMetric, allowPktDrop, allowRTTMetric, isTopology]);

  const getMetricDisplay = React.useCallback(
    (metricType: MetricType): string => {
      switch (metricType) {
        case 'Bytes':
          return t('Bytes');
        case 'PktDropBytes':
          return t('Dropped bytes');
        case 'Packets':
          return t('Packets');
        case 'PktDropPackets':
          return t('Dropped packets');
        case 'DnsLatencyMs':
          return t('DNS latencies');
        case 'TimeFlowRttNs':
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
      position={DropdownPosition.right}
      toggle={
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          onToggle={() => setMetricDropdownOpen(!metricDropdownOpen)}
        >
          {getMetricDisplay(selected as MetricType)}
        </DropdownToggle>
      }
      isOpen={metricDropdownOpen}
      dropdownItems={getMetricTypeOptions().map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setMetricDropdownOpen(false);
            setMetricType(v);
          }}
        >
          {getMetricDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default MetricTypeDropdown;
