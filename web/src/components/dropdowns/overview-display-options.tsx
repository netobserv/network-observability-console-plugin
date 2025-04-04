import { Switch, Text, TextVariants, Tooltip } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';

import { ScopeConfigDef } from '../../model/scope';
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
  scopes: ScopeConfigDef[];
}

export const OverviewDisplayOptions: React.FC<OverviewDisplayOptionsProps> = ({
  metricScope,
  setMetricScope,
  truncateLength,
  setTruncateLength,
  focus,
  setFocus,
  scopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      <div className="pf-v5-c-menu__group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-v5-c-menu__group-title">
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
            scopes={scopes}
          />
        </div>
      </div>
      <div className="pf-v5-c-menu__group">
        <Tooltip content={t('Long labels can reduce visibility.')}>
          <div className="pf-v5-c-menu__group-title">
            <Text component={TextVariants.p}>
              {t('Truncate labels')} <InfoAltIcon />
            </Text>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <TruncateDropdown id="truncate" selected={truncateLength} setTruncateLength={setTruncateLength} />
        </div>
      </div>
      <div className="pf-v5-c-menu__group">
        <div className="display-dropdown-switch-padding">
          <Switch
            id="focus-switch"
            label={t('Single graph focus')}
            isChecked={focus}
            onChange={(event, value) => setFocus(value)}
            isReversed
          />
        </div>
      </div>
    </>
  );
};

export default OverviewDisplayOptions;
