import { Select, Switch, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';

import './overview-display-dropdown.css';
import ScopeDropdown from './scope-dropdown';
import TruncateDropdown, { TruncateLength } from './truncate-dropdown';

export type Size = 's' | 'm' | 'l';

export interface OverviewDisplayOptionsProps {
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  truncateLength: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  focus: boolean;
  setFocus: (v: boolean) => void;
  allowedScopes: FlowScope[];
}

export const OverviewDisplayOptions: React.FC<OverviewDisplayOptionsProps> = ({
  metricScope,
  setMetricScope,
  truncateLength,
  setTruncateLength,
  focus,
  setFocus,
  allowedScopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Scope')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown
            data-test="scope"
            id="scope"
            selected={metricScope}
            setScopeType={setMetricScope}
            allowedScopes={allowedScopes}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Long labels can reduce visibility.')}>
          <div className="pf-c-select__menu-group-title">
            <Text component={TextVariants.p}>
              {t('Truncate labels')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <TruncateDropdown id="truncate" selected={truncateLength} setTruncateLength={setTruncateLength} />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Switch
          id="focus-switch"
          className="display-dropdown-padding"
          label={t('Single graph focus')}
          isChecked={focus}
          onChange={setFocus}
        />
      </div>
    </>
  );
};

export const OverviewDisplayDropdown: React.FC<{
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  truncateLength: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  focus: boolean;
  setFocus: (v: boolean) => void;
  allowedScopes: FlowScope[];
}> = ({ metricScope, setMetricScope, truncateLength, setTruncateLength, focus, setFocus, allowedScopes }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="overview-display-dropdown"
        placeholderText={<Text component={TextVariants.p}>{t('Display options')}</Text>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={
          <OverviewDisplayOptions
            metricScope={metricScope}
            setMetricScope={setMetricScope}
            truncateLength={truncateLength}
            setTruncateLength={setTruncateLength}
            focus={focus}
            setFocus={setFocus}
            allowedScopes={allowedScopes}
          />
        }
      />
    </div>
  );
};

export default OverviewDisplayDropdown;
