/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { PageSection, Title, Wizard, WizardStep, WizardStepType } from '@patternfly/react-core';
import { RJSFSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import { ContextSingleton } from '../../utils/context';
import { flowCollectorStatusPath } from '../../utils/url';
import { safeYAMLToJS } from '../../utils/yaml';
import DynamicLoader, { navigate } from '../dynamic-loader/dynamic-loader';
import { FlowCollectorUISchema } from './config/uiSchema';
import Consumption from './consumption';
import { DynamicForm } from './dynamic-form/dynamic-form';
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

  const form = React.useCallback(() => {
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
      />
    );
  }, [data, paths, schema]);

  const step = React.useCallback(
    (id, name: string) => {
      return (
        <WizardStep name={name} id={id} key={id}>
          {form()}
        </WizardStep>
      );
    },
    [form]
  );

  const onStepChange = React.useCallback((_event: React.MouseEvent<HTMLButtonElement>, step: WizardStepType) => {
    switch (step.id) {
      case 'overview':
        setPaths(defaultPaths);
        break;
      case 'capture':
        setPaths([
          'spec.agent.ebpf.sampling',
          'spec.agent.ebpf.privileged',
          'spec.agent.ebpf.features',
          'spec.processor.clusterName',
          'spec.processor.multiClusterDeployment',
          'spec.processor.addZone'
        ]);
        break;
      case 'pipeline':
        setPaths([
          'spec.deploymentModel',
          'spec.kafka',
          'spec.processor.advanced.secondaryNetworks.items',
          'spec.exporters.items'
        ]);
        break;
      case 'loki':
        setPaths(['spec.loki']);
        break;
      case 'prom':
        setPaths(['spec.prometheus.querier']);
        break;
      case 'console':
        setPaths(['spec.consolePlugin.enable', 'spec.consolePlugin.replicas']);
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
        name={params.name || props.name}
        onSuccess={() => {
          navigate(flowCollectorStatusPath);
        }}
      >
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
                    {t('Network Observability FlowCollector setup')}
                  </Title>
                </div>
                <Wizard onStepChange={onStepChange} onSave={() => ctx.onSubmit(data)}>
                  <WizardStep name={t('Overview')} id="overview">
                    <span className="co-pre-line">
                      {t(
                        // eslint-disable-next-line max-len
                        'Network Observability Operator deploys a monitoring pipeline that consists in:\n - an eBPF agent, that generates network flows from captured packets\n - flowlogs-pipeline, a component that collects, enriches and exports these flows\n - a Console plugin for flows visualization with powerful filtering options, a topology representation and more\n\nFlow data is then available in multiple ways, each optional:\n - As Prometheus metrics\n - As raw flow logs stored in Grafana Loki\n - As raw flow logs exported to a collector\n\nThe FlowCollector resource is used to configure the operator and its managed components.\nThis setup will guide you on the common aspects of the FlowCollector configuration.'
                      )}
                      <br /> <br />
                      {t('Operator configuration')}
                    </span>
                    {form()}
                  </WizardStep>
                  <WizardStep name={t('Capture')} id="capture">
                    {form()}
                  </WizardStep>
                  <WizardStep name={t('Pipeline')} id="pipeline">
                    {form()}
                  </WizardStep>
                  <WizardStep
                    name={t('Storage')}
                    id="storage"
                    steps={[step('loki', t('Loki')), step('prom', t('Prometheus'))]}
                  />
                  <WizardStep name={t('Integration')} id="console">
                    {form()}
                  </WizardStep>
                  <WizardStep name={t('Consumption')} id="consumption">
                    <Consumption flowCollector={data} setSampling={setSampling} />
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
              </PageSection>
            );
          }}
        </Consumer>
      </ResourceWatcher>
    </DynamicLoader>
  );
};

export default FlowCollectorWizard;
