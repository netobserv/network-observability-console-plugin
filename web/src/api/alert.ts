import { Rule } from '@openshift-console/dynamic-plugin-sdk';

export interface AlertsResult {
  data: AlertsResultData;
  status: string;
}

export interface AlertsResultData {
  groups: AlertsGroups[];
}

export interface AlertsGroups {
  name?: string;
  file?: string;
  interval?: number;
  limit?: number;
  rules: Rule[];
}
