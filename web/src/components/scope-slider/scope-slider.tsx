import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { Slider } from '../slider/Slider';

import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
  allowMultiCluster: boolean;
  allowZone: boolean;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope, allowMultiCluster, allowZone }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const scopes: [FlowScope, string][] = [
    ['resource', t('Resource')],
    ['owner', t('Owner')],
    ['namespace', t('Namespace')],
    ['host', t('Node')],
    ['zone', t('Zone')],
    ['cluster', t('Cluster')]
  ].filter(s => (allowMultiCluster || s[0] !== 'cluster') && (allowZone || s[0] !== 'zone')) as [FlowScope, string][];

  const index = scopes.findIndex(s => s[0] === scope);

  return (
    <div id={'scope-slider'}>
      <Slider
        value={index < 0 ? 2 : index}
        showTicks
        max={scopes.length - 1}
        customSteps={scopes.map((s, idx) => ({ value: idx, label: s[1] }))}
        onChange={(value: number) => setScope(scopes[value][0])}
        vertical
      />
    </div>
  );
};
