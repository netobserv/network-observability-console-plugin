import React, { FC } from 'react';

import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { FlowMetricSchema } from './config/schema';
import { GetFlowMetricJS } from './config/templates';
import { FlowMetricUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';

export type FlowMetricFormProps = {};

export const FlowMetricForm: FC<FlowMetricFormProps> = props => {
  console.log('FlowMetricForm', props);

  return (
    <DynamicLoader>
      <ResourceWatcher defaultData={GetFlowMetricJS()}>
        <ResourceForm schema={FlowMetricSchema} uiSchema={FlowMetricUISchema} />
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowMetricForm;
