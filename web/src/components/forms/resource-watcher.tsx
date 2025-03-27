/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  k8sCreate,
  K8sResourceKind,
  k8sUpdate,
  useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner } from '@patternfly/react-core';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sModel } from '../../utils/k8s-models-hook';
import { ErrorComponent } from '../messages/error';
import { prune } from './dynamic-form/utils';
import './forms.css';

export type ResourceWatcherProps = {
  defaultData: K8sResourceKind;
  children: JSX.Element
};

export type ResourceWatcherContext = {
  kind: string;
  isUpdate: boolean;
  existing: K8sResourceKind | null
  defaultData: K8sResourceKind;
  onSubmit: (data: K8sResourceKind) => void;
}

export const { Provider, Consumer } = React.createContext<ResourceWatcherContext>({
  kind: '',
  isUpdate: false,
  existing: null,
  defaultData: {},
  onSubmit: () => {
    console.error("onSubmit is not initialized !");
  },
});

export const ResourceWatcher: FC<ResourceWatcherProps> = ({ defaultData, children }) => {
  if (!defaultData.apiVersion) {
    throw new Error('ResourceForm error: apiVersion must be provided');
  } else if (!defaultData.kind) {
    throw new Error('ResourceForm error: kind must be provided');
  } else if (!defaultData.metadata || !defaultData.metadata.name) {
    throw new Error('ResourceForm error: name must be provided');
  }
  const { t } = useTranslation('plugin__netobserv-plugin');
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

  if (loadError) {
    return <ErrorComponent
      title={t('Unable to get {{kind}}', { kind })}
      error={loadError}
      isLokiRelated={false} />;
  } else if (!loaded) {
    return (
      <Bullseye data-test="loading-resource">
        <Spinner size="xl" />
      </Bullseye>
    );
  }
  return (
    <Provider value={{
      kind,
      isUpdate: resources?.length > 0,
      existing: resources?.length ? resources[0] : null,
      defaultData,
      onSubmit: (data) => {
        const apiFunc = resources?.length > 0 ? k8sUpdate : k8sCreate;
        apiFunc({
          data: prune(data),
          model
        })
          .then(res => {
            console.log('k8sCreate ok', res);
          })
          .catch(err => {
            console.error('k8sCreate error', err);
          });
      }
    }}>
      {children}
    </Provider>
  );
}

export default ResourceWatcher;
