import React, { FC } from 'react';

import { Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { GetFlowCollectorJS } from './config/templates';
import './forms.css';
import { Pipeline } from './pipeline';
import { ResourceStatus } from './resource-status';
import { Consumer, ResourceWatcher } from './resource-watcher';

export type FlowCollectorStatusProps = {};

export const FlowCollectorStatus: FC<FlowCollectorStatusProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  return (
    <DynamicLoader>
      <ResourceWatcher defaultData={GetFlowCollectorJS()}>
        <Consumer>
          {({ group, version, kind, existing }) => {
            return (
              <PageSection id="pageSection">
                <div id="pageHeader">
                  <Title headingLevel="h1" size="2xl">
                    {t('Network Observability FlowCollector status')}
                  </Title>
                </div>
                <Flex className="status-container" direction={{ default: 'column' }}>
                  {existing && (
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Pipeline existing={existing} selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
                    </FlexItem>
                  )}
                  <FlexItem className="status-list-container" flex={{ default: 'flex_1' }}>
                    <ResourceStatus
                      group={group}
                      version={version}
                      kind={kind}
                      existing={existing}
                      selectedTypes={selectedTypes}
                      setSelectedTypes={setSelectedTypes}
                    />
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
