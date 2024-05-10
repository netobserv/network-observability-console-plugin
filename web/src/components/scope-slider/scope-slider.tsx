import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { Slider } from '../slider/Slider';

import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
  allowedScopes: FlowScope[];
  sizePx: number;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope, allowedScopes, sizePx }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let scopes: [FlowScope, string][] = [
    ['resource', t('Resource')],
    ['owner', t('Owner')],
    ['namespace', t('Namespace')],
    ['host', t('Node')],
    ['zone', t('Zone')],
    ['cluster', t('Cluster')]
  ];
  scopes = scopes.filter(s => allowedScopes.includes(s[0]));

  const index = scopes.findIndex(s => s[0] === scope);
  /* TODO: refactor vertical slider
   * In between the display is block to working dimensions managing two cases
   * Non supported dimensions simply hide the slider from the view
   * since we can manage scopes from advanced view
   */
  const canDisplay = sizePx > 350 && sizePx < 2000;
  const isBig = sizePx > 700;
  return (
    <div
      id={'scope-slider'}
      style={{
        width: sizePx * (isBig ? 0.85 : 0.7),
        top: sizePx * (isBig ? 0.45 : 0.4),
        left: -sizePx * (isBig ? 0.38 : 0.28)
      }}
    >
      {canDisplay && (
        <Slider
          value={index < 0 ? 2 : index}
          showTicks
          max={scopes.length - 1}
          customSteps={scopes.map((s, idx) => ({ value: idx, label: s[1] }))}
          onChange={(value: number) => setScope(scopes[value][0])}
          vertical
        />
      )}
    </div>
  );
};
