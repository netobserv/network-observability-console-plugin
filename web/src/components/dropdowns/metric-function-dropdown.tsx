import { Dropdown, DropdownItem, DropdownPosition, DropdownToggle } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricFunction } from '../../model/flow-query';

const metricFunctionOptions: MetricFunction[] = ['last', 'avg', 'max', 'sum'];

export const MetricFunctionDropdown: React.FC<{
  selected?: string;
  setMetricFunction: (v: MetricFunction) => void;
  id?: string;
}> = ({ selected, setMetricFunction, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [metricDropdownOpen, setMetricDropdownOpen] = React.useState(false);

  const getMetricDisplay = React.useCallback(
    (mf: MetricFunction): string => {
      switch (mf) {
        case 'sum':
          return t('Total');
        case 'last':
          return t('Latest rate');
        case 'max':
          return t('Max rate');
        case 'avg':
          return t('Average rate');
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
          {getMetricDisplay(selected as MetricFunction)}
        </DropdownToggle>
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
