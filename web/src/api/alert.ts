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
  rules: AlertsRule[];
}

export interface AlertsRule {
  name?: string;
  type?: string;
  query?: string;
  health?: string;
  duration?: number;
  annotations: AlertsAnnotations;
  labels: AlertsLabels;
  state: string;
  id?: string;
}

export interface AlertsAnnotations {
  description?: string;
  summary?: string;
}

export interface AlertsLabels {
  severity?: string;
  prometheus?: string;
  namespace?: string;
}
