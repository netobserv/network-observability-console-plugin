import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricType } from '../../model/flow-query';

const metricTypeOptions: MetricType[] = ['bytes', 'packets', 'flowRtt'];

export const MetricTypeDropdown: React.FC<{
  selected?: string;
  setMetricType: (v: MetricType) => void;
  isTopology?: boolean;
  id?: string;
}> = ({ selected, setMetricType, id, isTopology }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getMetricDisplay = React.useCallback(
    (metricType: MetricType): string => {
      switch (metricType) {
        case 'packets':
          return t('Packets');
        case 'bytes':
          return t('Bytes');
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
      dropdownItems={metricTypeOptions
        .filter(v => isTopology || v !== 'flowRtt')
        .map(v => (
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
