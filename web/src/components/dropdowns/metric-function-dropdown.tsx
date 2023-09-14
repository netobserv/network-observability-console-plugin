import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricFunction, MetricType } from '../../model/flow-query';

const metricFunctionOptions: MetricFunction[] = ['last', 'avg', 'max', 'sum'];

export const MetricFunctionDropdown: React.FC<{
  selected?: string;
  setMetricFunction: (v: MetricFunction) => void;
  metricType?: MetricType;
  id?: string;
}> = ({ selected, setMetricFunction, metricType, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getMetricDisplay = React.useCallback(
    (mf: MetricFunction): string => {
      const suffix = !['dnsLatencies', 'flowRtt'].includes(metricType || '') ? ' ' + t('rate') : '';
      switch (mf) {
        case 'sum':
          return t('Total');
        case 'last':
          return `${t('Latest')}${suffix}`;
        case 'max':
          return `${t('Max')}${suffix}`;
        case 'avg':
          return `${t('Average')}${suffix}`;
      }
    },
    [metricType, t]
  );

  return (
    <Dropdown
      data-test={id}
      id={id}
      position={DropdownPosition.right}
      toggle={
        <Tooltip
          trigger={['dnsLatencies', 'flowRtt'].includes(metricType || '') ? 'mouseenter focus' : ''}
          position="top"
          content={t('Only average is available for durations')}
        >
          <DropdownToggle
            data-test={`${id}-dropdown`}
            id={`${id}-dropdown`}
            isDisabled={['dnsLatencies', 'flowRtt'].includes(metricType || '')}
            onToggle={() => setMetricDropdownOpen(!metricDropdownOpen)}
          >
            {getMetricDisplay(selected as MetricFunction)}
          </DropdownToggle>
        </Tooltip>
      }
      isOpen={metricDropdownOpen}
      dropdownItems={metricFunctionOptions.map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setMetricDropdownOpen(false);
            setMetricFunction(v);
          }}
        >
          {getMetricDisplay(v)}
        </DropdownItem>
      ))}
    />
  );
};

export default MetricFunctionDropdown;
