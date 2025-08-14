import React, { FC } from 'react';

import { useParams } from 'react-router-dom-v5-compat';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { FlowCollectorUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';

export type FlowCollectorFormProps = {
  name?: string;
};

export const FlowCollectorForm: FC<FlowCollectorFormProps> = props => {
  const params = useParams();

  return (
    <DynamicLoader>
      <ResourceWatcher
        group="flows.netobserv.io"
        version="v1beta2"
        kind="FlowCollector"
        name={params.name || props.name}
      >
        <ResourceForm uiSchema={FlowCollectorUISchema} />
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorForm;
