/* eslint-disable @typescript-eslint/no-explicit-any */
import { k8sCreate, K8sResourceKind, k8sUpdate, useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner } from '@patternfly/react-core';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sModel } from '../../utils/k8s-models-hook';
import { ErrorComponent } from '../messages/error';
import { prune } from './dynamic-form/utils';
import './forms.css';

export type ResourceWatcherProps = {
  defaultData: K8sResourceKind;
  onSuccess?: (data: any) => void;
  children: JSX.Element;
};

export type ResourceWatcherContext = {
  group: string;
  version: string;
  kind: string;
  isUpdate: boolean;
  existing: K8sResourceKind | null;
  defaultData: K8sResourceKind;
  onSubmit: (data: K8sResourceKind) => void;
  errors: string[];
  setErrors: (errors: string[]) => void;
};

export const { Provider, Consumer } = React.createContext<ResourceWatcherContext>({
  group: '',
  version: '',
  kind: '',
  isUpdate: false,
  existing: null,
  defaultData: {},
  onSubmit: () => {
    console.error('onSubmit is not initialized !');
  },
  errors: [],
  setErrors: (errs: string[]) => {
    console.error('setErrors is not initialized !', errs);
  }
});

export const ResourceWatcher: FC<ResourceWatcherProps> = ({ defaultData, onSuccess, children }) => {
  if (!defaultData.apiVersion) {
    throw new Error('ResourceForm error: apiVersion must be provided');
  } else if (!defaultData.kind) {
    throw new Error('ResourceForm error: kind must be provided');
  } else if (!defaultData.metadata || !defaultData.metadata.name) {
    throw new Error('ResourceForm error: name must be provided');
  }
  const { t } = useTranslation('plugin__netobserv-plugin');
  const apiVersion = defaultData.apiVersion;
  const groupVersion = apiVersion.split('/');
  const group = groupVersion[0];
  const version = groupVersion[1];
  const kind = defaultData.kind;
  const model = useK8sModel(group, version, kind);
  const [resources, loaded, loadError] = useK8sWatchResource<K8sResourceKind[]>({
    groupVersionKind: {
      group: groupVersion[0],
      version: groupVersion[1],
      kind
    },
    name: defaultData.metadata.name,
    isList: true // use list to avoid object issue
  });
  const [errors, setErrors] = React.useState<string[]>([]);

  if (loadError) {
    return <ErrorComponent title={t('Unable to get {{kind}}', { kind })} error={loadError} isLokiRelated={false} />;
  } else if (!loaded) {
    return (
      <Bullseye data-test="loading-resource">
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return (
    <Provider
      value={{
        group,
        version,
        kind,
        isUpdate: resources?.length > 0,
        existing: resources?.length ? { apiVersion, kind, ...resources[0] } : null,
        defaultData,
        errors,
        setErrors,
        onSubmit: data => {
          const apiFunc = resources?.length > 0 ? k8sUpdate : k8sCreate;
          apiFunc({
            data: prune(data),
            model
          })
            .then(res => {
              onSuccess && onSuccess(res);
            })
            .catch(e => setErrors([e.message]));
        }
      }}
    >
      {children}
    </Provider>
  );
};

export default ResourceWatcher;
