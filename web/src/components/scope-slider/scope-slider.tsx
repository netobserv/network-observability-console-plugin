import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MetricScope } from '../../model/flow-query';
import { Slider } from '../slider/Slider';

import './scope-slider.css';

export interface ScopeSliderProps {
  metricScope: MetricScope;
  setMetricScope: (ms: MetricScope) => void;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ metricScope, setMetricScope }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const scopes: [MetricScope, string][] = [
    ['resource', t('Resource')],
    ['owner', t('Owner')],
    ['namespace', t('Namespace')],
    ['host', t('Node')]
  ];
  const index = scopes.findIndex(s => s[0] === metricScope);

  return (
    <div id={'scope-slider'}>
      <Slider
        value={index < 0 ? 2 : index}
        showTicks
        max={3}
        customSteps={scopes.map((s, idx) => ({ value: idx, label: s[1] }))}
        onChange={(value: number) => setMetricScope(scopes[value][0])}
        vertical
      />
    </div>
  );
};
