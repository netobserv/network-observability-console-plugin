export enum MetricFunctionOptions {
  SUM = 'sum',
  MAX = 'max',
  AVG = 'avg',
  RATE = 'rate'
}

export enum MetricTypeOptions {
  BYTES = 'bytes',
  PACKETS = 'packets'
}

export enum MetricScopeOptions {
  APP = 'app',
  HOST = 'host',
  NAMESPACE = 'namespace',
  OWNER = 'owner',
  RESOURCE = 'resource'
}
