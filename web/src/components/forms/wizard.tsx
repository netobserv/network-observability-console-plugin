/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title, Wizard, WizardStep, WizardStepChangeScope, WizardStepType } from '@patternfly/react-core';
import validator from '@rjsf/validator-ajv8';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { FlowCollectorSchema } from './config/schema';
import { FlowCollectorUISchema } from './config/uiSchema';
import { DynamicForm } from './dynamic-form/dynamic-form';
import './forms.css';
import ResourceWatcher, { Consumer } from './resource-watcher';
import { GetFlowCollectorJS } from './templates';
import { getFilteredUISchema } from './utils';

export type WizardProps = {};

const NetflowWizard: FC<WizardProps> = props => {
  console.log(props);
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [data, setData] = React.useState<any>(null);
  const defaultPaths = ['spec.namespace', 'spec.networkPolicy'];
  const [paths, setPaths] = React.useState<string[]>(defaultPaths);

  const form = React.useCallback(() => {
    const filteredSchema = getFilteredUISchema(FlowCollectorUISchema, paths);
    return (
      <DynamicForm
        formData={data}
        schema={FlowCollectorSchema}
        uiSchema={filteredSchema} // see if we can regenerate this from CSV
        validator={validator}
        onChange={(data, id) => {
          console.log('onChange', data, id);
          setData(data); // TODO: improve performances here as the forms recreates on every change !
        }}
        onFocus={(id, data) => {
          console.log('onFocus', id, data);
        }}
        onBlur={(id, data) => {
          console.log('onBlur', id, data);
        }}
        onSubmit={(data, event) => {
          console.log('onSubmit', data, event);
        }}
      />
    );
  }, [data, paths])

  const step = React.useCallback((id, name: string) => {
    return (
      <WizardStep name={name} id={id} key={id}>
        {form()}
      </WizardStep>
    );
  }, [form]);

  const onStepChange = (
    event: React.MouseEvent<HTMLButtonElement>,
    step: WizardStepType,
    prevStep: WizardStepType,
    scope: WizardStepChangeScope) => {
    switch (step.id) {
      case 'overview':
        setPaths(defaultPaths);
        break;
      case 'filters':
        setPaths([
          'spec.agent.ebpf.flowFilter.enable', 'spec.agent.ebpf.flowFilter.rules',
          'spec.processor.filters'
        ]);
        break;
      case 'options':
        setPaths([
          'spec.agent.ebpf.sampling', 'spec.agent.ebpf.privileged', 'spec.agent.ebpf.features',
          'spec.processor.clusterName', 'spec.processor.multiClusterDeployment', 'spec.processor.addZone'
        ]);
        break;
      case 'pipeline':
        setPaths([
          'spec.deploymentModel', 'spec.kafka',
          'spec.agent.ebpf.kafkaBatchSize',
          'spec.processor.kafkaConsumerQueueCapacity', 'spec.processor.kafkaConsumerAutoscaler',
          'spec.processor.kafkaConsumerReplicas', 'spec.processor.kafkaConsumerBatchSize',
          'spec.exporters.items'
        ]);
        break;
      case 'loki':
        setPaths([
          'spec.loki'
        ]);
        break;
      case 'prom':
        setPaths([
          'spec.prometheus.querier'
        ]);
        break;
      case 'console':
        setPaths([
          'spec.consolePlugin'
        ]);
        break;
      default:
        setPaths([]);
    }
  };

  return (
    <ResourceWatcher defaultData={GetFlowCollectorJS()}>
      <Consumer>
        {({ existing, defaultData, onSubmit }) => {
          // first init data when watch resource query got results
          if (data == null) {
            setData(existing || defaultData);
          }
          return (
            <PageSection id="pageSection">
              <div id="pageHeader">
                <Title headingLevel="h1" size="2xl">{t('FlowCollector step by step configuration')}</Title>
              </div>
              <Wizard onStepChange={onStepChange} onSave={() => onSubmit(data)}>
                <WizardStep
                  name={t('Overview')}
                  id="overview"
                >
                  {
                    // TODO: set intro text here
                    "TODO: make an intro text"
                  }
                  {form()}
                </WizardStep>
                <WizardStep
                  name={t('Capture')}
                  id="capture"
                  steps={[
                    step('filters', t('Filters')),
                    step('options', t('Options')),
                  ]}
                />
                <WizardStep
                  name={t('Pipeline')}
                  id="pipeline"
                >
                  {form()}
                </WizardStep>
                <WizardStep
                  name={t('Storage')}
                  id="storage"
                  steps={[
                    step('loki', t('Loki')),
                    step('prom', t('Prometheus'))
                  ]}
                />
                <WizardStep
                  name={t('Console')}
                  id="console"
                >
                  {form()}
                </WizardStep>
                <WizardStep name={t('Review')} id="review-step" footer={{ nextButtonText: 'Finish' }}>
                  <ResourceYAMLEditor initialResource={data} />
                </WizardStep>
              </Wizard>
            </PageSection>
          )
        }}
      </Consumer>
    </ResourceWatcher>
  );
};

export default NetflowWizard;
