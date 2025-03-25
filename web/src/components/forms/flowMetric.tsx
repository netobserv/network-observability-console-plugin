import React, { FC } from 'react';

import { FlowMetricSchema } from './config/schema';
import { FlowMetricUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';
import { GetFlowMetricJS } from './templates';

export type FlowMetricFormProps = {};

export const FlowMetricForm: FC<FlowMetricFormProps> = props => {
  console.log('FlowMetricForm', props);

  return (
    <ResourceWatcher defaultData={GetFlowMetricJS()}>
      <ResourceForm schema={FlowMetricSchema} uiSchema={FlowMetricUISchema} />
    </ResourceWatcher>
  );
};

export default FlowMetricForm;
