import _ from 'lodash';
import * as React from 'react';

export const LOCAL_STORAGE_PLUGIN_KEY = 'netobserv-plugin-settings';
export const LOCAL_STORAGE_COLS_KEY = 'netflow-traffic-columns';
export const LOCAL_STORAGE_EXPORT_COLS_KEY = 'netflow-traffic-export-columns';
export const LOCAL_STORAGE_REFRESH_KEY = 'netflow-traffic-refresh';
export const LOCAL_STORAGE_SIZE_KEY = 'netflow-traffic-size-size';
export const LOCAL_STORAGE_VIEW_ID_KEY = 'netflow-traffic-view-id';
export const LOCAL_STORAGE_TOPOLOGY_OPTIONS_KEY = 'netflow-traffic-topology-options';
export const LOCAL_STORAGE_QUERY_PARAMS_KEY = 'netflow-traffic-query-params';
export const LOCAL_STORAGE_DISABLED_FILTERS_KEY = 'netflow-traffic-disabled-filters';
export const LOCAL_STORAGE_SORT_ID_KEY = 'netflow-traffic-sort-id';
export const LOCAL_STORAGE_SORT_DIRECTION_KEY = 'netflow-traffic-sort-direction';
export const LOCAL_STORAGE_OVERVIEW_IDS_KEY = 'netflows-traffic-overview-ids';
export const LOCAL_STORAGE_LAST_LIMIT_KEY = 'netflow-traffic-limit';
export const LOCAL_STORAGE_LAST_TOP_KEY = 'netflow-traffic-top';
export const LOCAL_STORAGE_METRIC_SCOPE_KEY = 'netflow-traffic-metric-scope';
export const LOCAL_STORAGE_METRIC_FUNCTION_KEY = 'netflow-traffic-metric-function';
export const LOCAL_STORAGE_METRIC_TYPE_KEY = 'netflow-traffic-metric-type';

export interface ArraySelectionOptions {
  id: string;
  criteria: string;
}

export function useLocalStorage<T>(
  key: string,
  initialValue?: T,
  opts?: ArraySelectionOptions
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    // Get localStorage item if available, else fallback on initialValue
    try {
      const item = window.localStorage.getItem(LOCAL_STORAGE_PLUGIN_KEY);
      const param = item ? JSON.parse(item)[key] : undefined;

      // Manage array selection by ids if opts is set
      if (opts && Array.isArray(initialValue) && Array.isArray(param)) {
        return !_.isEmpty(param)
          ? initialValue.map(item => {
              item[opts.criteria] = param.includes(item[opts.id]);
              return item;
            })
          : initialValue;
      } else {
        // Return parsed item if available
        return param ? param : initialValue;
      }
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;

      // Save state and then localStorage
      setStoredValue(valueToStore);

      // Reload from localStorage
      const item = window.localStorage.getItem(LOCAL_STORAGE_PLUGIN_KEY);
      const parsedItem = item ? JSON.parse(item) : {};

      // Set key values
      if (opts) {
        parsedItem[key] = valueToStore
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .filter((item: any) => item[opts.criteria])
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((item: any) => item[opts.id]);
      } else {
        parsedItem[key] = valueToStore;
      }

      // Save to localStorage
      window.localStorage.setItem(LOCAL_STORAGE_PLUGIN_KEY, JSON.stringify(parsedItem));
    } catch (error) {
      console.error(error);
    }
  };
  return [storedValue, setValue];
}
