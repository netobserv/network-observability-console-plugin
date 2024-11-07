import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { Slider, SliderStepObject } from './slider';

import { getScopeName, getScopeShortName, ScopeConfigDef } from '../../model/scope';
import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
  scopeDefs: ScopeConfigDef[];
  sizePx: number;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope, scopeDefs, sizePx }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  /* TODO: refactor vertical slider
   * In between the display is block to working dimensions managing two cases
   * Non supported dimensions simply hide the slider from the view
   * since we can manage scopes from advanced view
   */
  if (sizePx < 270 || sizePx > 2000) {
    return null;
  }

  const scopes: [FlowScope, SliderStepObject][] = scopeDefs
    .slice()
    .reverse()
    .map((sd, idx) => {
      return [
        sd.id,
        {
          value: idx,
          label: sizePx > 450 ? getScopeName(sd, t) : getScopeShortName(sd, t),
          tooltip: sd.description
        }
      ];
    });

  const index = scopes.findIndex(s => s[0] === scope);
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
      <Slider
        value={index < 0 ? 2 : index}
        showTicks
        max={scopes.length - 1}
        customSteps={scopes.map(s => s[1])}
        onChange={(value: number) => setScope(scopes[value][0])}
        vertical
      />
    </div>
  );
};
