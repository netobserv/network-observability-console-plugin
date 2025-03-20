import React, { FC } from 'react';

import { FlowCollectorSchema } from './config/schema';
import { FlowCollectorUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { GetFlowCollectorJS } from './templates';

export type FlowCollectorFormProps = {};

export const FlowCollectorForm: FC<FlowCollectorFormProps> = props => {
  console.log('FlowCollectorForm', props);

  return (
    <ResourceForm defaultData={GetFlowCollectorJS()} schema={FlowCollectorSchema} uiSchema={FlowCollectorUISchema} />
  );
};

export default FlowCollectorForm;
