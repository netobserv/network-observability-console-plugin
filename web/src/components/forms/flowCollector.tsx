import React, { FC } from 'react';

import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { FlowCollectorSchema } from './config/schema';
import { GetFlowCollectorJS } from './config/templates';
import { FlowCollectorUISchema } from './config/uiSchema';
import { ResourceForm } from './resource-form';
import { ResourceWatcher } from './resource-watcher';

export type FlowCollectorFormProps = {};

export const FlowCollectorForm: FC<FlowCollectorFormProps> = props => {
  return (
    <DynamicLoader>
      <ResourceWatcher defaultData={GetFlowCollectorJS()}>
        <ResourceForm schema={FlowCollectorSchema} uiSchema={FlowCollectorUISchema} />
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorForm;
