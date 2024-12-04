import { Popover, ProgressStep, ProgressStepper } from '@patternfly/react-core';
import * as React from 'react';
import { FlowScope } from '../../model/flow-query';
import { ScopeConfigDef } from '../../model/scope';
// TODO: remove this when https://issues.redhat.com/browse/OCPBUGS-41672 is solved and backported
import '@patternfly/patternfly/components/ProgressStepper/progress-stepper.css';
import './scope-slider.css';

export interface ScopeSliderProps {
  scope: FlowScope;
  setScope: (ms: FlowScope) => void;
  scopeDefs: ScopeConfigDef[];
  sizePx: number;
}

export const ScopeSlider: React.FC<ScopeSliderProps> = ({ scope, setScope, scopeDefs, sizePx }) => {
  return (
    <ProgressStepper isVertical isCenterAligned>
      {scopeDefs.map((sd, i) => (
        <ProgressStep
          key={`scope-step-${i}`}
          variant={sd.id === scope ? 'info' : 'pending'}
          isCurrent={sd.id === scope}
          onClick={() => setScope(sd.id)}
          popoverRender={stepRef => (
            <Popover
              headerContent={<div>{sd.name}</div>}
              bodyContent={<div>{sd.description}</div>}
              triggerRef={stepRef}
              position="right"
            />
          )}
        >
          {sizePx > 450 ? sd.name : sd.shortName}
        </ProgressStep>
      ))}
    </ProgressStepper>
  );
};
