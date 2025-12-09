import { Rule } from '@openshift-console/dynamic-plugin-sdk';

export type HealthRuleType = 'alert' | 'record' | 'all';

export interface HealthRulesResult {
  data: HealthRulesResultData;
  status: string;
}

export interface HealthRulesResultData {
  groups: HealthRulesGroups[];
}

export interface HealthRulesGroups {
  name?: string;
  file?: string;
  interval?: number;
  limit?: number;
  rules: Rule[];
}

export interface SilencedAlert {
  id: string;
  status: SilencedAlertStatus;
  matchers: SilenceMatcher[];
}

export interface SilencedAlertStatus {
  state: string;
}

export interface SilenceMatcher {
  name: string;
  value: string;
}
