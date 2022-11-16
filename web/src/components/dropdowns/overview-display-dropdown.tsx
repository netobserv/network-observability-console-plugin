import { FlexItem, Select, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScope, MetricType } from '../../model/flow-query';

import MetricTypeDropdown from './metric-type-dropdown';
import './overview-display-dropdown.css';
import ScopeDropdown from './scope-dropdown';

export type Size = 's' | 'm' | 'l';

export const OverviewDisplayOptions: React.FC<{
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  metricScope: MetricScope;
  setMetricScope: (s: MetricScope) => void;
}> = ({ metricType, setMetricType, metricScope, setMetricScope }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Type of measurement to show in graphs.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Metric type')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <FlexItem>
            <MetricTypeDropdown data-test="type" id="type" selected={metricType} setMetricType={setMetricType} />
          </FlexItem>
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Scope')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown data-test="scope" id="scope" selected={metricScope} setScopeType={setMetricScope} />
        </div>
      </div>
    </>
  );
};

export const OverviewDisplayDropdown: React.FC<{
  metricType: MetricType;
  setMetricType: (t: MetricType) => void;
  metricScope: MetricScope;
  setMetricScope: (s: MetricScope) => void;
}> = ({ metricType, setMetricType, metricScope, setMetricScope }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div data-test="display-dropdown-container">
      <Select
        id="overview-display-dropdown"
        placeholderText={<span>{t('Display options')}</span>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={
          <OverviewDisplayOptions
            metricType={metricType}
            setMetricType={setMetricType}
            metricScope={metricScope}
            setMetricScope={setMetricScope}
          />
        }
      />
    </div>
  );
};

export default OverviewDisplayDropdown;
