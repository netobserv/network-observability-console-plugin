/* eslint-disable @typescript-eslint/no-explicit-any */
import { dump, load } from 'js-yaml';

// Safely parse js obj to yaml. Returns fallback (emtpy string by default) on exception.
export const safeJSToYAML = (js: any, fallback = '', options: any = {}): string => {
  try {
    return dump(js, options);
  } catch (err) {
    console.error(err);
    return fallback;
  }
};

// Safely parse yaml to js object. Returns fallback (empty object by default) on exception.
export const safeYAMLToJS = (yaml: string, fallback: any = {}, options: any = {}): any => {
  try {
    return load(yaml, options);
  } catch (err) {
    console.error(err);
    return fallback;
  }
};
