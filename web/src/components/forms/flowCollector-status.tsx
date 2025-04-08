import React, { FC } from 'react';

import { PageSection } from '@patternfly/react-core';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { GetFlowCollectorJS } from './config/templates';
import { ResourceStatus } from './resource-status';
import { Consumer, ResourceWatcher } from './resource-watcher';

export type FlowCollectorStatusProps = {};

export const FlowCollectorStatus: FC<FlowCollectorStatusProps> = props => {
  console.log('FlowCollectorStatus', props);
  return (
    <DynamicLoader>
      <ResourceWatcher defaultData={GetFlowCollectorJS()}>
        <Consumer>
          {({ group, version, kind, existing }) => {
            return (
              <PageSection id="pageSection">
                <ResourceStatus group={group} version={version} kind={kind} existing={existing} />
              </PageSection>
            );
          }}
        </Consumer>
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorStatus;
