import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';

export interface MetricTypeDropdownProps {
  selected?: string;
  setMetricType: (v: MetricType) => void;
  allowedTypes: MetricType[];
  id?: string;
}

export const MetricTypeDropdown: React.FC<MetricTypeDropdownProps> = ({
  selected,
  setMetricType,
  id,
  allowedTypes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

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
          onBlur={() => setTimeout(() => setOpen(false), 100)}
        >
          {getMetricDisplay(selected as MetricType)}
        </MenuToggle>
      )}
    >
      {allowedTypes.map(v => (
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
