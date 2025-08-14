import React, { FC } from 'react';

import { useParams } from 'react-router-dom-v5-compat';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { FlowMetricUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';

export type FlowMetricFormProps = {
  name?: string;
};

export const FlowMetricForm: FC<FlowMetricFormProps> = props => {
  const params = useParams();

  return (
    <DynamicLoader>
      <ResourceWatcher group="flows.netobserv.io" version="v1alpha1" kind="FlowMetric" name={params.name || props.name}>
        <ResourceForm uiSchema={FlowMetricUISchema} />
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowMetricForm;
