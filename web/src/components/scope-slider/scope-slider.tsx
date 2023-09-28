import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { Slider } from '../slider/Slider';

import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const scopes: [FlowScope, string][] = [
    ['resource', t('Resource')],
    ['owner', t('Owner')],
    ['namespace', t('Namespace')],
    ['host', t('Node')],
    ['cluster', t('Cluster')]
  ];
  const index = scopes.findIndex(s => s[0] === scope);

  return (
    <div id={'scope-slider'}>
      <Slider
        value={index < 0 ? 3 : index}
        showTicks
        max={4}
        customSteps={scopes.map((s, idx) => ({ value: idx, label: s[1] }))}
        onChange={(value: number) => setScope(scopes[value][0])}
        vertical
      />
    </div>
  );
};
