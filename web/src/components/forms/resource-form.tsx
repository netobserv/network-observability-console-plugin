/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ResourceYAMLEditor
} from '@openshift-console/dynamic-plugin-sdk';
import { FormHelperText, PageSection, Title } from '@patternfly/react-core';
import { UiSchema } from '@rjsf/utils';
import validator from '@rjsf/validator-ajv8';
import React, { FC, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { netflowTrafficPath } from '../../utils/url';
import { safeYAMLToJS } from '../../utils/yaml';
import { navigate } from '../dynamic-loader/dynamic-loader';
import { DynamicForm } from './dynamic-form/dynamic-form';
import { EditorToggle, EditorType } from './editor-toggle';
import './forms.css';
import { Consumer } from './resource-watcher';

export type ResourceFormProms = {
  schema: any;
  uiSchema: UiSchema;
};

export const ResourceForm: FC<ResourceFormProms> = ({ schema, uiSchema }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [viewType, setViewType] = React.useState(EditorType.CUSTOM);
  const [data, setData] = React.useState<any>(null);

  const hasChanged = React.useCallback((existing: any) => {
    return data?.metadata?.resourceVersion !== existing?.metadata?.resourceVersion;
  }, [data?.metadata?.resourceVersion]);

  return (
    <Consumer>
      {({ isUpdate, kind, existing, defaultData, onSubmit }) => {
        // first init data when watch resource query got results
        if (data == null) {
          setData(existing || defaultData);
        }
        return (
          <PageSection id="pageSection">
            <div id="pageHeader">
              <Title headingLevel="h1" size="2xl">
                {isUpdate ? t('Update {{kind}}', { kind }) : t('Create {{kind}}', { kind })}
              </Title>
              <FormHelperText style={{ marginTop: 'var(--pf-t--global--spacer--xs)' }}>
                {isUpdate
                  ? t('Update by completing the form. Current values are from the existing resource.')
                  : t('Create by completing the form. Default values are provided as example.')}
              </FormHelperText>
            </div>
            <Suspense fallback={<></>}>
              <EditorToggle
                type={viewType}
                updated={hasChanged(existing)}
                onReload={() => setData(existing)}
                onChange={setViewType}
                onSubmit={() => onSubmit(data)}
                onCancel={() => navigate(netflowTrafficPath)}
                customChild={
                  <DynamicForm
                    showAlert
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
                yamlChild={
                  <ResourceYAMLEditor
                    initialResource={data}
                    onSave={(content) => {
                      setData(safeYAMLToJS(content));
                      onSubmit(data);
                    }}
                  />}
              />
            </Suspense>
          </PageSection>
        )
      }}
    </Consumer>

  );
};

export default ResourceForm;
