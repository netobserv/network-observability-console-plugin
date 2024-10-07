import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FlowScope } from '../../model/flow-query';
import { Slider, SliderStepObject } from './slider';

import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
  allowedScopes: FlowScope[];
  sizePx: number;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope, allowedScopes, sizePx }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  /* TODO: refactor vertical slider
   * In between the display is block to working dimensions managing two cases
   * Non supported dimensions simply hide the slider from the view
   * since we can manage scopes from advanced view
   */
  if (sizePx < 250 || sizePx > 2000) {
    return null;
  }

  let scopes: [FlowScope, SliderStepObject][] = [
    [
      'resource',
      {
        value: 0,
        label: sizePx > 450 ? t('Resource') : t('Res'),
        tooltip: t('Base resource, such as a Pod, a Service or a Node')
      }
    ],
    [
      'owner',
      {
        value: 1,
        label: sizePx > 450 ? t('Owner') : t('Own'),
        tooltip: t('Controller owner, such as a Deployment')
      }
    ],
    [
      'namespace',
      {
        value: 2,
        label: sizePx > 450 ? t('Namespace') : t('NS'),
        tooltip: t('Resource namespace')
      }
    ],
    [
      'host',
      {
        value: 3,
        label: sizePx > 450 ? t('Node') : t('Node'),
        tooltip: t('Node on which the resources are running')
      }
    ],
    [
      'zone',
      {
        value: 4,
        label: sizePx > 450 ? t('Zone') : t('AZ'),
        tooltip: t('Availability zone')
      }
    ],
    [
      'cluster',
      {
        value: 5,
        label: sizePx > 450 ? t('Cluster') : t('Cl'),
        tooltip: t('Cluster name or identifier')
      }
    ]
  ];
  scopes = scopes.filter(s => allowedScopes.includes(s[0]));

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
