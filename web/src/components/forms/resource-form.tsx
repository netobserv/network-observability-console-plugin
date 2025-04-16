/* eslint-disable @typescript-eslint/no-explicit-any */
import { ResourceYAMLEditor } from '@openshift-console/dynamic-plugin-sdk';
import { FormHelperText, PageSection, Title } from '@patternfly/react-core';
import { UiSchema } from '@rjsf/utils';
import _ from 'lodash';
import React, { FC, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { netflowTrafficPath } from '../../utils/url';
import { safeYAMLToJS } from '../../utils/yaml';
import { navigate } from '../dynamic-loader/dynamic-loader';
import { SchemaValidator } from './config/validator';
import { DynamicForm } from './dynamic-form/dynamic-form';
import { EditorToggle, EditorType } from './editor-toggle';
import './forms.css';
import { Consumer } from './resource-watcher';

export type ResourceFormProps = {
  schema: any;
  uiSchema: UiSchema;
};

export const ResourceForm: FC<ResourceFormProps> = ({ schema, uiSchema }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [viewType, setViewType] = React.useState(EditorType.CUSTOM);
  const [data, setData] = React.useState<any>(null);

  const hasChanged = React.useCallback(
    (existing: any) => {
      return data?.metadata?.resourceVersion !== existing?.metadata?.resourceVersion;
    },
    [data?.metadata?.resourceVersion]
  );

  return (
    <Consumer>
      {({ kind, isUpdate, existing, defaultData, onSubmit, errors, setErrors }) => {
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
                isUpdate={isUpdate}
                onReload={() => setData(existing)}
                onChange={type => {
                  setViewType(type);
                }}
                onSubmit={() => {
                  onSubmit(data);
                }}
                onCancel={() => navigate(netflowTrafficPath)}
                customChild={
                  <DynamicForm
                    showAlert
                    formData={data}
                    schema={schema}
                    uiSchema={uiSchema} // see if we can regenerate this from CSV
                    validator={SchemaValidator}
                    errors={errors}
                    onError={errs => setErrors(_.map(errs, error => error.stack))}
                    onChange={(event, id) => {
                      console.log('onChange', event, id);
                      setData(event.formData);
                    }}
                  />
                }
                yamlChild={
                  <ResourceYAMLEditor
                    initialResource={data}
                    onSave={content => {
                      const updatedData = safeYAMLToJS(content);
                      setData(updatedData);
                      onSubmit(updatedData);
                    }}
                  />
                }
              />
            </Suspense>
          </PageSection>
        );
      }}
    </Consumer>
  );
};

export default ResourceForm;
