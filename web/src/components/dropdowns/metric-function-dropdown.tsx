import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricFunction, MetricType, isTimeMetric } from '../../model/flow-query';

export const TIME_METRIC_FUNCTIONS: MetricFunction[] = ['avg', 'min', 'max', 'p90', 'p99'];
export const RATE_METRIC_FUNCTIONS: MetricFunction[] = ['last', 'avg', 'min', 'max', 'sum'];

export const MetricFunctionDropdown: React.FC<{
  selected?: string;
  setMetricFunction: (v: MetricFunction) => void;
  metricType?: MetricType;
  id?: string;
}> = ({ selected, setMetricFunction, metricType, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const getAvailableFunctions = React.useCallback((): MetricFunction[] => {
    switch (metricType) {
      case 'dnsLatencies':
      case 'flowRtt':
        return TIME_METRIC_FUNCTIONS;
      default:
        return RATE_METRIC_FUNCTIONS;
    }
  }, [metricType]);

  const getMetricDisplay = React.useCallback(
    (mf: MetricFunction): string => {
      const suffix = !isTimeMetric(metricType) ? ' ' + t('rate') : '';
      switch (mf) {
        case 'sum':
          return t('Total');
        case 'last':
          return `${t('Latest')}${suffix}`;
        case 'min':
          return `${t('Min')}${suffix}`;
        case 'max':
          return `${t('Max')}${suffix}`;
        case 'avg':
          return `${t('Average')}${suffix}`;
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
          {getMetricDisplay(selected as MetricFunction)}
        </MenuToggle>
      )}
    >
      {getAvailableFunctions().map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setOpen(false);
            setMetricFunction(v);
          }}
        >
          {getMetricDisplay(v)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default MetricFunctionDropdown;
