import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';
import { TopologyMetricTypes } from '../../model/topology';

export const MetricTypeDropdown: React.FC<{
  selected?: string;
  setMetricType: (v: MetricType) => void;
  id?: string;
}> = ({ selected, setMetricType, id }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getMetricDisplay = (metricType?: string) => {
    switch (metricType as TopologyMetricTypes) {
      case TopologyMetricTypes.PACKETS:
        return t('Packets');
      case TopologyMetricTypes.BYTES:
      default:
        return t('Bytes');
    }
  };

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
          {getMetricDisplay(selected)}
        </DropdownToggle>
      }
      isOpen={metricDropdownOpen}
      dropdownItems={Object.values(TopologyMetricTypes).map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setMetricDropdownOpen(false);
            setMetricType(v as unknown as MetricType);
          }}
        >
          {getMetricDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default MetricTypeDropdown;
