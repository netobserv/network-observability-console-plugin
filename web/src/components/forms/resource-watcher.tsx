/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  k8sCreate,
  k8sDelete,
  K8sResourceKind,
  k8sUpdate,
  useK8sWatchResource
} from '@openshift-console/dynamic-plugin-sdk';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { JSONSchema7 } from 'json-schema';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { useK8sModel } from '../../utils/k8s-models-hook';
import { back } from '../dynamic-loader/dynamic-loader';
import { ErrorComponent } from '../messages/error';
import { prune } from './dynamic-form/utils';
import './forms.css';
import { ClusterServiceVersionList, CustomResourceDefinitionKind } from './types';
import { exampleForModel } from './utils';

export type ResourceWatcherProps = {
  group: string;
  version: string;
  kind: string;
  name?: string;
  namespace?: string;
  onSuccess?: (data: any) => void;
  children: JSX.Element;
  skipErrors?: boolean;
};

export type ResourceWatcherContext = {
  group: string;
  version: string;
  kind: string;
  isUpdate: boolean;
  schema: JSONSchema7 | null;
  data: K8sResourceKind;
  onSubmit: (data: K8sResourceKind, isDelete?: boolean) => void;
  loadError: any;
  errors: string[];
  setErrors: (errors: string[]) => void;
};

export const { Provider, Consumer } = React.createContext<ResourceWatcherContext>({
  group: '',
  version: '',
  kind: '',
  isUpdate: false,
  schema: null,
  data: {},
  onSubmit: () => {
    console.error('onSubmit is not initialized !');
  },
  loadError: null,
  errors: [],
  setErrors: (errs: string[]) => {
    console.error('setErrors is not initialized !', errs);
  }
});

export const ResourceWatcher: FC<ResourceWatcherProps> = ({
  group,
  version,
  kind,
  name,
  namespace,
  onSuccess,
  children,
  skipErrors
}) => {
  if (!group || !version || !kind) {
    throw new Error('ResourceForm error: apiVersion and kind must be provided');
  }
  const { t } = useTranslation('plugin__netobserv-plugin');

  const [matchingCSVs, csvLoaded, csvLoadError] = useK8sWatchResource<ClusterServiceVersionList>({
    groupVersionKind: {
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      kind: 'ClusterServiceVersion'
    },
    kind: 'ClusterServiceVersion',
    namespace: 'openshift-netobserv-operator'
  });
  const [crd, crdLoaded, crdLoadError] = useK8sWatchResource<CustomResourceDefinitionKind>({
    groupVersionKind: {
      group: 'apiextensions.k8s.io',
      version: 'v1',
      kind: 'CustomResourceDefinition'
    },
    kind: 'CustomResourceDefinition',
    name: kind === 'FlowCollector' ? 'flowcollectors.flows.netobserv.io' : 'flowmetrics.flows.netobserv.io',
    isList: false
  });
  const [cr, crLoaded, crLoadError] = useK8sWatchResource<K8sResourceKind>(
    name
      ? {
          groupVersionKind: {
            group,
            version,
            kind
          },
          kind,
          name,
          namespace,
          isList: false
        }
      : null
  );

  const model = useK8sModel(group, version, kind);
  const [errors, setErrors] = React.useState<string[]>([]);

  if (!skipErrors && (csvLoadError || crdLoadError || crLoadError)) {
    return (
      <ErrorComponent
        title={t('Unable to get {{kind}}', { kind })}
        error={`${csvLoadError || crdLoadError || crLoadError}`}
        isLokiRelated={false}
      />
    );
  } else if (!csvLoaded || !crdLoaded || !crLoaded) {
    return (
      <Bullseye data-test="loading-resource">
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  const data = cr
    ? { apiVersion: `${group}/${version}`, kind, ...cr }
    : matchingCSVs?.items?.length
    ? exampleForModel(
        matchingCSVs.items.find(csv => csv.spec.customresourcedefinitions?.owned?.some(crd => crd.kind === kind)),
        group,
        version,
        kind
      )
    : {};
  const schema = crd?.spec?.versions?.find(v => v.name === version)?.schema?.openAPIV3Schema || null;
  // force name and namespace to be present in the form when namespaced
  if (crd?.spec?.scope === 'Namespaced') {
    data.metadata = {
      ...data.metadata,
      namespace: namespace || 'default',
      name: name
    };
    if (schema?.properties?.metadata) {
      (schema.properties.metadata as any).properties = {
        name: { type: 'string' },
        namespace: { type: 'string' }
      };
    }
  }
  return (
    <Provider
      value={{
        group,
        version,
        kind,
        isUpdate: cr ? true : false,
        schema,
        data,
        loadError: csvLoadError || crdLoadError || crLoadError,
        errors,
        setErrors,
        onSubmit: (data, isDelete) => {
          if (isDelete) {
            k8sDelete({
              model,
              resource: {
                apiVersion: data.apiVersion,
                kind: data.kind,
                metadata: data.metadata
              }
            })
              .then(() => {
                back();
              })
              .catch(e => setErrors([e.message]));
          } else {
            const apiFunc = cr ? k8sUpdate : k8sCreate;
            apiFunc({
              data: prune(data),
              model
            })
              .then(res => {
                setErrors([]);
                onSuccess && onSuccess(res);
              })
              .catch(e => setErrors([e.message]));
          }
        }
      }}
    >
      {children}
    </Provider>
  );
};

export default ResourceWatcher;
