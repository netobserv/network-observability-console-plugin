/* eslint-disable @typescript-eslint/no-explicit-any */
import { UiSchema } from '@rjsf/utils';
import _ from 'lodash';

export const appendRecursive = (obj: any, key: string, value?: string) => {
  if (!obj) {
    return obj;
  }

  // set key / value
  if (value !== undefined) {
    obj[key] = value;
  } else {
    // delete the key if value is undefined
    delete obj[key];
  }

  // recursively apply key and value on all children objects
  Object.keys(obj).forEach((k) => {
    if (typeof obj[k] === 'object') {
      obj[k] = appendRecursive(obj[k], key, value)
    }
  });
  return obj;
}

export const setFlat = (obj: any) => {
  if (!obj) {
    return obj;
  }

  // show current object
  delete obj['ui:widget']
  // hide accordion
  obj['ui:flat'] = 'true';
  return obj;
}

export const getFilteredUISchema = (ui: UiSchema, paths: string[]) => {
  // clone provided ui schema to avoid altering original object
  const clonedSchema = _.cloneDeep(ui);
  // hide all the fields
  const filteredUi = appendRecursive(clonedSchema, 'ui:widget', 'hidden');

  // show expected ones
  paths.forEach((path: string) => {
    const keys = path.split('.');
    let current = filteredUi;
    keys.forEach((key) => {
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