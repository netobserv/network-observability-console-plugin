/* eslint-disable @typescript-eslint/no-explicit-any */
import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { UiSchema } from '@rjsf/utils';
import _ from 'lodash';
import { ClusterServiceVersionKind } from './types';

export const appendRecursive = (obj: any, key: string, value?: string) => {
  if (!obj) {
    return obj;
  }

  const originalKey = `${key}_original`;
  if (value !== undefined) {
    // backup original value if exists
    if (obj[key]) {
      obj[originalKey] = obj[key];
    }
    // set key / value
    obj[key] = value;
  } else if (obj[originalKey]) {
    // restore original key
    obj[key] = obj[originalKey];
  } else {
    // delete the key
    delete obj[key];
  }

  // recursively apply key and value on all children objects
  Object.keys(obj).forEach(k => {
    if (typeof obj[k] === 'object') {
      obj[k] = appendRecursive(obj[k], key, value);
    }
  });
  return obj;
};

export const setFlat = (obj: any) => {
  if (!obj) {
    return obj;
  }

  // show current object
  delete obj['ui:widget'];
  // hide accordion
  obj['ui:flat'] = 'true';
  return obj;
};

export const getFilteredUISchema = (ui: UiSchema, paths: string[]) => {
  // clone provided ui schema to avoid altering original object
  const clonedSchema = _.cloneDeep(ui);
  // hide all the fields
  const filteredUi = appendRecursive(clonedSchema, 'ui:widget', 'hidden');
  // show expected ones
  paths.forEach((path: string) => {
    const keys = path.split('.');
    let current = filteredUi;
    keys.forEach(key => {
      setFlat(current);
      // move to next item
      current = current[key];
    });
    setFlat(current);
    // show all the fields under specified path
    current = appendRecursive(current, 'ui:widget');
  });

  return filteredUi;
};

export const getUpdatedCR = (data: any, updatedData: any) => {
  // only update metadata and spec
  data.metadata = updatedData.metadata;
  data.spec = updatedData.spec;
  return data;
};

export const exampleForModel = (
  csv: ClusterServiceVersionKind,
  group: string,
  version: string,
  kind: string
) => {
  return parseALMExamples(csv).find((s: K8sResourceKind) => s.kind === kind && s.apiVersion === `${group}/${version}`);
}

export const parseALMExamples = (csv: ClusterServiceVersionKind): K8sResourceKind[] => {
  try {
    return JSON.parse(csv?.metadata?.annotations?.['alm-examples'] ?? '[]');
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('Unable to parse ALM expamples\n', e);
    return [];
  }
};
