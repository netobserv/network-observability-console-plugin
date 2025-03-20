/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  k8sCreate,
  K8sResourceKind,
  k8sUpdate,
  ResourceYAMLEditor,
  useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, FormHelperText, PageSection, Spinner, Title } from '@patternfly/react-core';
import { UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import React, { FC, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sModel } from '../../utils/k8s-models-hook';
import { netflowTrafficPath } from '../../utils/url';
import { safeYAMLToJS } from '../../utils/yaml';
import { navigate } from '../dynamic-loader/dynamic-loader';
import { ErrorComponent } from '../messages/error';
import { DynamicForm } from './dynamic-form/dynamic-form';
import { prune } from './dynamic-form/utils';
import { EditorToggle, EditorType } from './editor-toggle';
import './forms.css';

export type ResourceFormProms = {
  defaultData: K8sResourceKind;
  schema: any;
  uiSchema: UiSchema;
};

export const ResourceForm: FC<ResourceFormProms> = ({ defaultData, schema, uiSchema }) => {
  if (!defaultData.apiVersion) {
    throw new Error('ResourceForm error: apiVersion must be provided');
  } else if (!defaultData.kind) {
    throw new Error('ResourceForm error: kind must be provided');
  } else if (!defaultData.metadata || !defaultData.metadata.name) {
    throw new Error('ResourceForm error: name must be provided');
  }

  const { t } = useTranslation('plugin__netobserv-plugin');
  const [viewType, setViewType] = React.useState(EditorType.CUSTOM);
  const groupVersion = defaultData.apiVersion.split('/');
  const kind = defaultData.kind;
  const model = useK8sModel(groupVersion[0], groupVersion[1], kind);
  const [resources, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: {
      group: groupVersion[0],
      version: groupVersion[1],
      kind
    },
    name: defaultData.metadata.name,
    isList: true // use list to avoid object issue
  });
  const [data, setData] = React.useState<any>(null);

  const isUpdate = React.useCallback(() => {
    return resources?.length > 0;
  }, [resources?.length]);

  const getExistingData = React.useCallback(() => {
    return resources?.length ? resources[0] : null;
  }, [resources]);

  const hasChanged = React.useCallback(() => {
    return data?.metadata?.resourceVersion !== getExistingData()?.metadata?.resourceVersion;
  }, [data?.metadata?.resourceVersion, getExistingData]);

  const switchView = React.useCallback(
    (type: EditorType) => {
      setData(prune(data, defaultData));
      setViewType(type);
    },
    [data, defaultData]
  );

  const onSubmit = React.useCallback(() => {
    const apiFunc = isUpdate() ? k8sUpdate : k8sCreate;
    apiFunc({
      data,
      model
    })
      .then(res => {
        console.log('k8sCreate', res);
      })
      .catch(err => {
        console.error('k8sCreate', err);
      });
  }, [data, isUpdate, model]);

  const onReload = React.useCallback(() => {
    setData(getExistingData());
  }, [getExistingData]);

  const onYAMLSave = React.useCallback(
    (content: string) => {
      setData(safeYAMLToJS(content));
      onSubmit();
    },
    [onSubmit]
  );

  React.useEffect(() => {
    // first init data when watch resource query got results
    if (data == null && loaded) {
      setData(getExistingData() || defaultData);
    }
  }, [data, defaultData, getExistingData, loaded]);

  if (loadError) {
    return <ErrorComponent title={t('Unable to get {{kind}}', { kind })} error={loadError} isLokiRelated={false} />;
  } else if (!loaded || data == null) {
    return (
      <Bullseye data-test="loading-resource">
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return (
    <PageSection id="pageSection">
      <div id="pageHeader">
        <Title headingLevel="h1" size="2xl">
          {isUpdate() ? t('Update {{kind}}', { kind }) : t('Create {{kind}}', { kind })}
        </Title>
        <FormHelperText style={{ marginTop: 'var(--pf-t--global--spacer--xs)' }}>
          {isUpdate()
            ? t('Update by completing the form. Current values are from the existing resource.')
            : t('Create by completing the form. Default values are provided as example.')}
        </FormHelperText>
      </div>
      <Suspense fallback={<></>}>
        <EditorToggle
          type={viewType}
          updated={hasChanged()}
          onReload={onReload}
          onChange={switchView}
          onSubmit={onSubmit}
          onCancel={() => navigate(netflowTrafficPath)}
          customChild={
            <DynamicForm
              formData={data}
              schema={schema}
              uiSchema={uiSchema} // see if we can regenerate this from CSV
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
          }
          yamlChild={<ResourceYAMLEditor initialResource={data} onSave={onYAMLSave} />}
        />
      </Suspense>
    </PageSection>
  );
};

export default ResourceForm;
