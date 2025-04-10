import React, { FC } from 'react';

import { Flex, FlexItem, PageSection } from '@patternfly/react-core';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { GetFlowCollectorJS } from './config/templates';
import { Pipeline } from './pipeline';
import { ResourceStatus } from './resource-status';
import { Consumer, ResourceWatcher } from './resource-watcher';
import './forms.css';

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
                <Flex className="status-container" direction={{ default: "column" }}>
                  <FlexItem flex={{ default: "flex_1" }}>
                    <Pipeline />
                  </FlexItem>
                  <FlexItem flex={{ default: "flex_1" }}>
                    <ResourceStatus group={group} version={version} kind={kind} existing={existing} />
                  </FlexItem>
                </Flex>
              </PageSection>
            );
          }}
        </Consumer>
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorStatus;
