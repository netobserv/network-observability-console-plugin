/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Button,
  PageSection,
  Title,
  Wizard,
  WizardFooterWrapper,
  WizardStep,
  WizardStepType
} from '@patternfly/react-core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import _ from 'lodash';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { flowCollectorEditPath, flowCollectorNewPath, flowCollectorStatusPath } from '../../utils/url';
import DynamicLoader, { navigate } from '../dynamic-loader/dynamic-loader';
import { FlowCollectorUISchema } from './config/uiSchema';
import Consumption from './consumption';
import { DynamicForm } from './dynamic-form/dynamic-form';
import { ErrorTemplate } from './dynamic-form/templates';
import './forms.css';
import ResourceWatcher, { Consumer } from './resource-watcher';
import { getFilteredUISchema } from './utils';

export type FlowCollectorWizardProps = {
  name?: string;
};

const defaultPaths = ['spec.namespace', 'spec.networkPolicy'];

export const FlowCollectorWizard: FC<FlowCollectorWizardProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [schema, setSchema] = React.useState<RJSFSchema | null>(null);
  const [data, setData] = React.useState<any>(null);
  const [paths, setPaths] = React.useState<string[]>(defaultPaths);
  const params = useParams();

  const form = React.useCallback(
    (errors?: string[]) => {
      if (!schema) {
        return <></>;
      }
      const filteredSchema = getFilteredUISchema(FlowCollectorUISchema, paths);
      return (
        <DynamicForm
          formData={data}
          schema={schema}
          uiSchema={filteredSchema} // see if we can regenerate this from CSV
          validator={validator}
          onChange={event => {
            setData(event.formData);
          }}
          errors={errors}
        />
      );
    },
    [data, paths, schema]
  );

  const onStepChange = React.useCallback((_event: React.MouseEvent<HTMLButtonElement>, step: WizardStepType) => {
    switch (step.id) {
      case 'overview':
        setPaths(defaultPaths);
        break;
      case 'processing':
        setPaths([
          'spec.deploymentModel',
          'spec.kafka.address',
          'spec.kafka.topic',
          'spec.kafka.tls',
          'spec.agent.ebpf.privileged',
          'spec.agent.ebpf.features',
          'spec.processor.clusterName',
          'spec.processor.addZone'
        ]);
        break;
      case 'loki':
        setPaths(['spec.loki']);
        break;
      default:
        setPaths([]);
    }
  }, []);

  const setSampling = React.useCallback(
    (sampling: number) => {
      if (!data) {
        return;
      }
      data.spec.agent.ebpf.sampling = sampling;
      setData({ ...data });
    },
    [data]
  );

  return (
    <DynamicLoader>
      <ResourceWatcher
        group="flows.netobserv.io"
        version="v1beta2"
        kind="FlowCollector"
        name={params.name || props.name || 'cluster'} // fallback on cluster to ensure it doesn't already exists
        skipCRError
        onSuccess={() => {
          navigate(flowCollectorStatusPath);
        }}
      >
        <Consumer>
          {ctx => {
            // redirect to edit page if resource already exists or is created while using the wizard
            // We can't handle edition here since this page doesn't include ResourceYAMLEditor
            // which handle reload / update buttons
            if (ctx.data.metadata?.resourceVersion) {
              navigate(flowCollectorEditPath);
            }
            // first init schema & data when watch resource query got results
            if (schema == null) {
              setSchema(ctx.schema);
            }
            if (data == null) {
              // slightly modify default example when creating a new resource
              if (params.name !== 'cluster') {
                const updatedData = _.cloneDeep(ctx.data) as any;
                if (!updatedData.spec) {
                  updatedData.spec = {};
                }
                if (!updatedData.spec.loki) {
                  updatedData.spec.loki = {};
                }
                updatedData.spec.loki.mode = 'LokiStack'; // default to lokistack
                setData(updatedData);
              } else {
                setData(ctx.data);
              }
            }
            return (
              <PageSection id="pageSection">
                <div id="pageHeader">
                  <Title headingLevel="h1" size="2xl">
                    {t('Network Observability FlowCollector setup')}
                  </Title>
                </div>
                <div id="wizard-container">
                  <Wizard onStepChange={onStepChange} onSave={() => ctx.onSubmit(data)} onClose={() => navigate('/')}>
                    <WizardStep name={t('Overview')} id="overview">
                      <span className="co-pre-line">
                        {t(
                          // eslint-disable-next-line max-len
                          'The FlowCollector resource is used to configure the Network Observability operator and its managed components. When it is created, network flows start being collected.'
                        )}
                        <br /> <br />
                        {t(
                          // eslint-disable-next-line max-len
                          'This wizard is a helper to create a first FlowCollector resource. It does not cover all the available configuration options, but only the most common ones.\nFor advanced configuration, please use YAML or the'
                        )}{' '}
                        <Button
                          id="open-flow-collector-form"
                          data-test-id="open-flow-collector-form"
                          className="no-padding"
                          variant="link"
                          onClick={() => navigate(flowCollectorNewPath)}
                        >
                          {t('FlowCollector form')}
                        </Button>
                        {t(
                          // eslint-disable-next-line max-len
                          ', which includes more options such as:\n- Filtering options\n- Configuring custom exporters\n- Custom labels based on IP\n- Pod identification for secondary networks\n- Performance fine-tuning\nYou can always edit a FlowCollector later when you start with the simplified configuration.'
                        )}
                        <br /> <br />
                        {t('Operator configuration')}
                      </span>
                      {form(ctx.errors)}
                    </WizardStep>
                    <WizardStep name={t('Processing')} id="processing">
                      {form(ctx.errors)}
                    </WizardStep>
                    <WizardStep name={t('Loki')} id="loki">
                      {form(ctx.errors)}
                    </WizardStep>
                    <WizardStep
                      name={t('Consumption')}
                      id="consumption"
                      footer={
                        <WizardFooterWrapper>
                          <Button variant="primary" onClick={() => ctx.onSubmit(data)}>
                            {t('Submit')}
                          </Button>
                          <Button variant="link" onClick={() => navigate('/')}>
                            {t('Cancel')}
                          </Button>
                        </WizardFooterWrapper>
                      }
                    >
                      <Consumption flowCollector={data} setSampling={setSampling} />
                      <>{!_.isEmpty(ctx.errors) && <ErrorTemplate errors={ctx.errors} />}</>
                    </WizardStep>
                  </Wizard>
                </div>
              </PageSection>
            );
          }}
        </Consumer>
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorWizard;
