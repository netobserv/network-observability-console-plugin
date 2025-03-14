import { MenuToggle, MenuToggleElement, Select } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';
import { useOutsideClickEvent } from '../../utils/outside-hook';
import './overview-display-dropdown.css';
import { OverviewDisplayOptions } from './overview-display-options';
import { TruncateLength } from './truncate-dropdown';

export type Size = 's' | 'm' | 'l';

export interface OverviewDisplayDropdownProps {
  metricScope: FlowScope;
  setMetricScope: (s: FlowScope) => void;
  truncateLength: TruncateLength;
  setTruncateLength: (v: TruncateLength) => void;
  focus: boolean;
  setFocus: (v: boolean) => void;
  scopes: ScopeConfigDef[];
}

export const OverviewDisplayDropdown: React.FC<OverviewDisplayDropdownProps> = ({
  metricScope,
  setMetricScope,
  truncateLength,
  setTruncateLength,
  focus,
  setFocus,
  scopes
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const id = 'overview-display-dropdown';
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <Select
      id={id}
      placeholder={t('Display options')}
      ref={ref}
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
        scopes={scopes}
        appendTo={() => document.getElementById(id)!}
      />
    </Select>
  );
};

export default OverviewDisplayDropdown;
