/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title, Wizard, WizardStep, WizardStepType } from '@patternfly/react-core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ContextSingleton } from '../../utils/context';
import { safeYAMLToJS } from '../../utils/yaml';
import DynamicLoader from '../dynamic-loader/dynamic-loader';
import { FlowMetricUISchema } from './config/uiSchema';
import { DynamicForm } from './dynamic-form/dynamic-form';
import './forms.css';
import ResourceWatcher, { Consumer } from './resource-watcher';
import { getFilteredUISchema } from './utils';

export type FlowMetricWizardProps = {
  name?: string;
};

const defaultPaths = ['metadata.namespace', 'metadata.name'];

export const FlowMetricWizard: FC<FlowMetricWizardProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [schema, setSchema] = React.useState<RJSFSchema | null>(null);

  const [data, setData] = React.useState<any>(null);
  const [paths, setPaths] = React.useState<string[]>(defaultPaths);
  const params = useParams();

  const form = React.useCallback(() => {
    if (!schema) {
      return <></>;
    }
    const filteredSchema = getFilteredUISchema(FlowMetricUISchema, paths);
    return (
      <DynamicForm
        formData={data}
        schema={schema}
        uiSchema={filteredSchema} // see if we can regenerate this from CSV
        validator={validator}
        onChange={event => {
          setData(event.formData);
        }}
      />
    );
  }, [data, paths, schema]);

  const onStepChange = React.useCallback((_event: React.MouseEvent<HTMLButtonElement>, step: WizardStepType) => {
    switch (step.id) {
      case 'overview':
        setPaths(defaultPaths);
        break;
      case 'metric':
        setPaths(['spec.metricName', 'spec.type', 'spec.buckets', 'spec.valueField', 'spec.divider', 'spec.labels']);
        break;
      case 'data':
        setPaths(['spec.flatten', 'spec.remap', 'spec.direction', 'spec.filters']);
        break;
      case 'charts':
        setPaths(['spec.charts']);
        break;
      default:
        setPaths([]);
    }
  }, []);

  return (
    <DynamicLoader>
      <ResourceWatcher group="flows.netobserv.io" version="v1alpha1" kind="FlowMetric" name={params.name || props.name}>
        <Consumer>
          {ctx => {
            // first init schema & data when watch resource query got results
            if (schema == null) {
              setSchema(ctx.schema);
            }
            if (data == null) {
              setData(ctx.data);
            }
            return (
              <PageSection id="pageSection">
                <div id="pageHeader">
                  <Title headingLevel="h1" size="2xl">
                    {t('Network Observability FlowMetric setup')}
                  </Title>
                </div>
                <div id="wizard-container">
                  <Wizard id="flowMetricWizard" onStepChange={onStepChange} onSave={() => ctx.onSubmit(data)}>
                    <WizardStep name={t('Overview')} id="overview">
                      <span className="co-pre-line">
                        {t(
                          // eslint-disable-next-line max-len
                          'You can create custom metrics out of the flowlogs data using the FlowMetric API. In every flowlogs data that is collected, there are a number of fields labeled per log, such as source name and destination name. These fields can be leveraged as Prometheus labels to enable the customization of cluster information on your dashboard.\nThis setup will guide you on the common aspects of the FlowMetric configuration.'
                        )}
                        <br /> <br />
                        {t('General configuration')}
                      </span>
                      {form()}
                    </WizardStep>
                    <WizardStep name={t('Metric')} id="metric">
                      {form()}
                    </WizardStep>
                    <WizardStep name={t('Data')} id="data">
                      {form()}
                    </WizardStep>
                    <WizardStep name={t('Charts')} id="charts">
                      {form()}
                    </WizardStep>
                    <WizardStep
                      name={t('Review')}
                      id="review-step"
                      body={{ className: 'wizard-editor-container' }}
                      footer={ContextSingleton.isStandalone() ? undefined : <></>}
                    >
                      <ResourceYAMLEditor
                        initialResource={data}
                        onSave={content => {
                          const updatedData = safeYAMLToJS(content);
                          setData(updatedData);
                          ctx.onSubmit(updatedData);
                        }}
                      />
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

export default FlowMetricWizard;
