import React, { FC } from 'react';

import { useParams } from 'react-router-dom-v5-compat';
import DynamicLoader, { back } from '../dynamic-loader/dynamic-loader';
import { flowCollectorSliceUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';

export type FlowCollectorSliceFormProps = {
  name?: string;
};

export const FlowCollectorSliceForm: FC<FlowCollectorSliceFormProps> = props => {
  const params = useParams();

  return (
    <DynamicLoader>
      <ResourceWatcher
        group="flows.netobserv.io"
        version="v1alpha1"
        kind="FlowCollectorSlice"
        name={params.name || props.name}
        namespace={params.namespace || 'default'}
        onSuccess={back}
        defaultFrom="CSVExample"
      >
        <ResourceForm uiSchema={flowCollectorSliceUISchema} />
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorSliceForm;
