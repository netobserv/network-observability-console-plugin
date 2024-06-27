import { Tooltip, TooltipProps } from '@patternfly/react-core';
import * as React from 'react';

export type MaybeTooltipProps = Omit<TooltipProps, 'content'> & { content?: React.ReactNode };

export const MaybeTooltip: React.FC<MaybeTooltipProps> = props => {
  if (!props.content) {
    return props.children || null;
  }
  return (
    <Tooltip {...props} content={props.content}>
      {props.children}
    </Tooltip>
  );
};
