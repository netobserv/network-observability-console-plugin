import { K8sResourceKind } from '@openshift-console/dynamic-plugin-sdk';
import { safeYAMLToJS } from '../src/utils/yaml';

export const FlowCollector = `
apiVersion: flows.netobserv.io/v1beta2
kind: FlowCollector
metadata:
  name: cluster
spec:
  namespace: netobserv
  deploymentModel: Direct
  networkPolicy:
    enable: false
    additionalNamespaces: []
  agent:
    type: eBPF
    ebpf:
      imagePullPolicy: IfNotPresent
      logLevel: info
      sampling: 50
      cacheActiveTimeout: 5s
      cacheMaxFlows: 100000
      privileged: false
      interfaces: []
      excludeInterfaces:
        - lo
      kafkaBatchSize: 1048576
      metrics:
        server:
          port: 9400
      resources:
        requests:
          memory: 50Mi
          cpu: 100m
        limits:
          memory: 800Mi
  kafka:
    address: kafka-cluster-kafka-bootstrap.netobserv
    topic: network-flows
    tls:
      enable: false
      caCert:
        type: secret
        name: kafka-cluster-cluster-ca-cert
        certFile: ca.crt
      userCert:
        type: secret
        name: flp-kafka
        certFile: user.crt
        certKey: user.key
  processor:
    imagePullPolicy: IfNotPresent
    logLevel: info
    logTypes: Flows
    metrics:
      server:
        port: 9401
      disableAlerts: []
    kafkaConsumerReplicas: 3
    kafkaConsumerAutoscaler: null
    kafkaConsumerQueueCapacity: 1000
    kafkaConsumerBatchSize: 10485760
    resources:
      requests:
        memory: 100Mi
        cpu: 100m
      limits:
        memory: 800Mi
  loki:
    enable: true
    mode: Monolithic
    monolithic:
      url: 'http://loki.netobserv.svc:3100/'
      tenantID: netobserv
      tls:
        enable: false
        caCert:
          type: configmap
          name: loki-gateway-ca-bundle
          certFile: service-ca.crt
    lokiStack:
      name: loki
    readTimeout: 30s
    writeTimeout: 10s
    writeBatchWait: 1s
    writeBatchSize: 10485760
  prometheus:
    querier:
      enable: true
      mode: Auto
      timeout: 30s
  consolePlugin:
    enable: true
    imagePullPolicy: IfNotPresent
    logLevel: info
    portNaming:
      enable: true
      portNames:
        '3100': loki
    quickFilters:
      - name: Applications
        filter:
          flow_layer: '"app"'
        default: true
      - name: Infrastructure
        filter:
          flow_layer: '"infra"'
      - name: Pods network
        filter:
          src_kind: '"Pod"'
          dst_kind: '"Pod"'
        default: true
      - name: Services network
        filter:
          dst_kind: '"Service"'
    resources:
      requests:
        memory: 50Mi
        cpu: 100m
      limits:
        memory: 100Mi
  exporters: []
`;

let flowCollectorJS: K8sResourceKind | null = null;
export const GetFlowCollectorJS = (): K8sResourceKind => {
  if (flowCollectorJS === null) {
    flowCollectorJS = safeYAMLToJS(FlowCollector);
  }
  return flowCollectorJS!;
};

export const FlowMetric = `
apiVersion: flows.netobserv.io/v1alpha1
kind: FlowMetric
metadata:
  labels:
    app.kubernetes.io/name: flowmetric
    app.kubernetes.io/instance: flowmetric-sample
    app.kubernetes.io/part-of: netobserv-operator
    app.kubernetes.io/managed-by: kustomize
    app.kubernetes.io/created-by: netobserv-operator
  name: flowmetric-sample
  namespace: netobserv
spec:
  metricName: cluster_external_ingress_bytes_total
  type: Counter
  valueField: Bytes
  direction: Ingress
  labels:
    - DstK8S_HostName
    - DstK8S_Namespace
    - DstK8S_OwnerName
    - DstK8S_OwnerType
  filters:
    - field: SrcSubnetLabel
      matchType: Absence
  charts:
    - dashboardName: Main
      title: External ingress traffic
      unit: Bps
      type: SingleStat
      queries:
        - promQL: 'sum(rate($METRIC[2m]))'
          legend: ''
    - dashboardName: Main
      sectionName: External
      title: Top external ingress traffic per workload
      unit: Bps
      type: StackArea
      queries:
        - promQL: >-
            sum(rate($METRIC{DstK8S_Namespace!=""}[2m])) by (DstK8S_Namespace,
            DstK8S_OwnerName)
          legend: '{{DstK8S_Namespace}} / {{DstK8S_OwnerName}}'
`;

// use an alternative sample for forms to avoid forcing the user to remove the filters / queries
export const FlowMetricDefaultForm = `
apiVersion: flows.netobserv.io/v1alpha1
kind: FlowMetric
metadata:
  name: flowmetric-sample
  namespace: netobserv
spec:
  type: Counter
  valueField: Bytes
  direction: Ingress
`;

let flowMetricJS: K8sResourceKind | null = null;
export const GetFlowMetricJS = (): K8sResourceKind => {
  if (flowMetricJS === null) {
    flowMetricJS = safeYAMLToJS(FlowMetricDefaultForm);
  }
  return flowMetricJS!;
};
