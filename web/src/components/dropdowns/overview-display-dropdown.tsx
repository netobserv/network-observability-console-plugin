import { Select, Tooltip, Switch, MenuToggleElement, MenuToggle } from '@patternfly/react-core';
import { InfoAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';

import './overview-display-dropdown.css';
import ScopeDropdown from './scope-dropdown';
import TruncateDropdown, { TruncateLength } from './truncate-dropdown';

export type Size = 's' | 'm' | 'l';

export const OverviewDisplayOptions: React.FC<{
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  truncateLength: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  focus: boolean;
  setFocus: (v: boolean) => void;
  allowMultiCluster: boolean;
  allowZone: boolean;
}> = ({
  metricScope,
  setMetricScope,
  truncateLength,
  setTruncateLength,
  focus,
  setFocus,
  allowMultiCluster,
  allowZone
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('The level of details represented.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Scope')} <InfoAltIcon />
            </>
          </div>
        </Tooltip>
        <div className="display-dropdown-padding">
          <ScopeDropdown
            data-test="scope"
            id="scope"
            selected={metricScope}
            setScopeType={setMetricScope}
            allowMultiCluster={allowMultiCluster}
            allowZone={allowZone}
          />
        </div>
      </div>
      <div className="pf-c-select__menu-group">
        <Tooltip content={t('Long labels can reduce visibility.')}>
          <div className="pf-c-select__menu-group-title">
            <>
              {t('Truncate labels')} <InfoAltIcon />
            </>
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
          onChange={(event, value) => setFocus(value)}
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
  allowMultiCluster: boolean;
  allowZone: boolean;
}> = ({
  metricScope,
  setMetricScope,
  truncateLength,
  setTruncateLength,
  focus,
  setFocus,
  allowMultiCluster,
  allowZone
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);

  return (
    <div id="display-dropdown-container" data-test="display-dropdown-container">
      <Select
        id="overview-display-dropdown"
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
            {t('Display options')}
          </MenuToggle>
        )}
      >
        <OverviewDisplayOptions
          metricScope={metricScope}
          setMetricScope={setMetricScope}
          truncateLength={truncateLength}
          setTruncateLength={setTruncateLength}
          focus={focus}
          setFocus={setFocus}
          allowMultiCluster={allowMultiCluster}
          allowZone={allowZone}
        />
      </Select>
    </div>
  );
};

export default OverviewDisplayDropdown;
