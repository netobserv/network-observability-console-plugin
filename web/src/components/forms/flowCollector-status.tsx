import React, { FC } from 'react';

import { Button, Flex, FlexItem, PageSection, TextContent, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { flowCollectorEditPath, flowCollectorNewPath, netflowTrafficPath } from '../../utils/url';
import DynamicLoader, { navigate } from '../dynamic-loader/dynamic-loader';
import './forms.css';
import { Pipeline } from './pipeline';
import { ResourceStatus } from './resource-status';
import { Consumer, ResourceWatcher } from './resource-watcher';

export type FlowCollectorStatusProps = {};

export const FlowCollectorStatus: FC<FlowCollectorStatusProps> = () => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedTypes, setSelectedTypes] = React.useState<string[]>([]);

  return (
    <DynamicLoader>
      <ResourceWatcher group="flows.netobserv.io" version="v1beta2" kind="FlowCollector" name="cluster" skipErrors>
        <Consumer>
          {ctx => {
            return (
              <PageSection id="pageSection">
                <div id="pageHeader">
                  <Title headingLevel="h1" size="2xl">
                    {t('Network Observability FlowCollector status')}
                  </Title>
                </div>
                {ctx.data && (
                  <Flex className="status-container" direction={{ default: 'column' }}>
                    <FlexItem flex={{ default: 'flex_1' }}>
                      <Pipeline existing={ctx.data} selectedTypes={selectedTypes} setSelectedTypes={setSelectedTypes} />
                    </FlexItem>
                    <FlexItem className="status-list-container" flex={{ default: 'flex_1' }}>
                      <ResourceStatus
                        group={ctx.group}
                        version={ctx.version}
                        kind={ctx.kind}
                        existing={ctx.data}
                        selectedTypes={selectedTypes}
                        setSelectedTypes={setSelectedTypes}
                      />
                    </FlexItem>
                    <FlexItem>
                      <Flex>
                        <FlexItem>
                          <Button
                            id="edit-flow-collector"
                            variant="primary"
                            onClick={() => navigate(flowCollectorEditPath)}
                          >
                            {t('Edit FlowCollector')}
                          </Button>
                        </FlexItem>
                        <FlexItem>
                          <Button id="open-network-traffic" variant="link" onClick={() => navigate(netflowTrafficPath)}>
                            {t('Open Network Traffic page')}
                          </Button>
                        </FlexItem>
                      </Flex>
                    </FlexItem>
                  </Flex>
                )}
                {ctx.loadError && (
                  <Flex direction={{ default: 'column' }}>
                    <FlexItem>
                      <TextContent>
                        {t('An error occured while retreiving FlowCollector: {{error}}', { error: ctx.loadError })}
                      </TextContent>
                    </FlexItem>
                    <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>
                      <Button id="create-flow-collector" onClick={() => navigate(flowCollectorNewPath)}>
                        {t('Create FlowCollector')}
                      </Button>
                    </FlexItem>
                  </Flex>
                )}
              </PageSection>
            );
          }}
        </Consumer>
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorStatus;
