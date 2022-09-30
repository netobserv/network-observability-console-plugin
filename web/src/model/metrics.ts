export enum MetricFunctionOptions {
  LAST = 'last',
  AVG = 'avg',
  MAX = 'max',
  SUM = 'sum'
}

export enum MetricTypeOptions {
  BYTES = 'bytes',
  PACKETS = 'packets'
}

export enum MetricScopeOptions {
  HOST = 'host',
  NAMESPACE = 'namespace',
  OWNER = 'owner',
  RESOURCE = 'resource'
}
