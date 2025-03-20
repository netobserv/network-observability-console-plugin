import React, { FC } from 'react';

import { FlowMetricSchema } from './config/schema';
import { FlowMetricUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { GetFlowMetricJS } from './templates';

export type FlowMetricFormProps = {};

export const FlowMetricForm: FC<FlowMetricFormProps> = props => {
  console.log('FlowMetricForm', props);

  return <ResourceForm defaultData={GetFlowMetricJS()} schema={FlowMetricSchema} uiSchema={FlowMetricUISchema} />;
};

export default FlowMetricForm;
