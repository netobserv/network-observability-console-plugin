import React, { FC } from 'react';

import { FlowCollectorSchema } from './config/schema';
import { FlowCollectorUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';
import { GetFlowCollectorJS } from './templates';

export type FlowCollectorFormProps = {};

export const FlowCollectorForm: FC<FlowCollectorFormProps> = props => {
  console.log('FlowCollectorForm', props);

  return (
    <ResourceWatcher defaultData={GetFlowCollectorJS()}>
      <ResourceForm schema={FlowCollectorSchema} uiSchema={FlowCollectorUISchema} />
    </ResourceWatcher>
  );
};

export default FlowCollectorForm;
