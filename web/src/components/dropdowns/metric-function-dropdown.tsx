import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StatFunction, MetricType, isTimeMetric } from '../../model/flow-query';

export const TIME_METRIC_FUNCTIONS: StatFunction[] = ['avg', 'min', 'max', 'p90', 'p99'];
export const RATE_METRIC_FUNCTIONS: StatFunction[] = ['last', 'avg', 'min', 'max', 'sum'];

export const MetricFunctionDropdown: React.FC<{
  selected?: string;
  setMetricFunction: (v: StatFunction) => void;
  metricType?: MetricType;
  id?: string;
}> = ({ selected, setMetricFunction, metricType, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getAvailableFunctions = React.useCallback((): StatFunction[] => {
    switch (metricType) {
      case 'DnsLatencyMs':
      case 'TimeFlowRttNs':
        return TIME_METRIC_FUNCTIONS;
      default:
        return RATE_METRIC_FUNCTIONS;
    }
  }, [metricType]);

  const getMetricDisplay = React.useCallback(
    (mf: StatFunction): string => {
      const suffix = !isTimeMetric(metricType) ? ' ' + t('rate') : '';
      switch (mf) {
        case 'count':
        case 'sum':
          return t('Total');
        case 'rate':
        case 'avg':
          return `${t('Average')}${suffix}`;
        case 'last':
          return `${t('Latest')}${suffix}`;
        case 'min':
          return `${t('Min')}${suffix}`;
        case 'max':
          return `${t('Max')}${suffix}`;
        case 'p90':
          return `${t('P90')}${suffix}`;
        case 'p99':
          return `${t('P99')}${suffix}`;
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
        <DropdownToggle
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          onToggle={() => setMetricDropdownOpen(!metricDropdownOpen)}
        >
          {getMetricDisplay(selected as StatFunction)}
        </DropdownToggle>
      }
      isOpen={metricDropdownOpen}
      dropdownItems={getAvailableFunctions().map(v => (
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
