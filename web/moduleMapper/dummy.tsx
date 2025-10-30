/* eslint-disable @typescript-eslint/no-explicit-any */
import { K8sGroupVersionKind, K8sModel, K8sResourceKindReference, PrometheusPollProps, PrometheusResponse, ResourceIconProps, ResourceLinkProps, ResourceYAMLEditorProps } from '@openshift-console/dynamic-plugin-sdk';
import { CodeEditor, Language } from '@patternfly/react-code-editor';
import _ from 'lodash';
import * as React from 'react';
import { useK8sModelsWithColors } from '../src/utils/k8s-models-hook';
import { safeJSToYAML } from '../src/utils/yaml';
import { k8sModels } from './k8s-models';
import { FlowCollectorSchema, FlowMetricSchema } from './schemas';
import { GetFlowCollectorJS, GetFlowMetricJS } from './templates';

// This dummy file is used to resolve @Console imports from @openshift-console for JEST / Standalone
// You can add any exports needed here
// Check "moduleNameMapper" in package.json for jest
// and "NormalModuleReplacementPlugin" in webpack.standalone.ts 
export class Dummy extends Error {
  constructor() {
    super('Dummy file for exports');
  }
}

export function isModelFeatureFlag(e: never) {
  return null;
}

export function useResolvedExtensions(isModelFeatureFlag: boolean) {
  return [
    [{
      flags: {
        required: ["dummy"],
      },
      model: "",
    }],
    undefined, undefined];
}

export function useK8sModels() {
  return [
    k8sModels,
    false
  ]
}

export function getK8sModel(k8s: any, k8sGroupVersionKind?: K8sResourceKindReference | K8sGroupVersionKind): K8sModel {
  const models = Object.keys(k8sModels);

  for (let i = 0; i < models.length; i++) {
    const model = (k8sModels as any)[models[i]];
    if (model.kind === k8s.kind) {
      return model;
    }
  }

  return {
    abbr: '',
    kind: '',
    label: '',
    labelPlural: '',
    plural: '',
    apiVersion: ''
  };
}


export function k8sGet(k8s: any): Promise<any> {
  console.log("k8sGet", k8s);
  return Promise.resolve(k8s);
}

export function k8sCreate(k8s: any): Promise<any> {
  console.log("k8sCreate", k8s);
  return Promise.resolve(k8s);
}

export function k8sUpdate(k8s: any): Promise<any> {
  console.log("k8sUpdate", k8s);
  return Promise.resolve(k8s);
}

export function k8sDelete(k8s: any): Promise<any> {
  console.log("k8sDelete", k8s);
  return Promise.resolve(k8s);
}

export function useK8sWatchResource(req: any) {
  console.log("useK8sWatchResource", req);

  const [loaded, setLoaded] = React.useState(false);
  const [resource, setResource] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!req) {
      console.error("useK8sWatchResource: No request provided");
      return;
    }

    const kind = req.kind || req.groupVersionKind.kind;
    // simulate a loading
    if (resource == null) {
      setTimeout(() => {
        switch (kind) {
          case 'CustomResourceDefinition':
            if (req.name === 'flowcollectors.flows.netobserv.io') {
              setResource({
                apiVersion: 'apiextensions.k8s.io/v1',
                kind: 'CustomResourceDefinition',
                metadata: {
                  name: req.name
                },
                spec: {
                  group: 'flows.netobserv.io',
                  names: {
                    kind: 'FlowCollector',
                    plural: 'flowcollectors'
                  },
                  scope: 'Cluster',
                  versions: [{
                    name: 'v1beta2',
                    served: true,
                    storage: true,
                    schema: {
                      openAPIV3Schema: FlowCollectorSchema,
                    }
                  }]
                }
              });
            } else {
              setResource({
                apiVersion: 'apiextensions.k8s.io/v1',
                kind: 'CustomResourceDefinition',
                metadata: {
                  name: req.name
                },
                spec: {
                  group: 'flows.netobserv.io',
                  names: {
                    kind: 'FlowMetric',
                    plural: 'flowmetrics'
                  },
                  scope: 'Namespaced',
                  versions: [{
                    name: 'v1alpha1',
                    served: true,
                    storage: true,
                    schema: {
                      openAPIV3Schema: FlowMetricSchema
                    }
                  }]
                }
              });
            }
            break;
          case 'FlowCollector':
            const fc = _.cloneDeep(GetFlowCollectorJS());
            fc.spec!.loki.enable = false;
            fc.spec!.exporters = [{ type: "Kafka" }, { type: "OpenTelemetry" }]
            fc.status = {
              "conditions": [
                {
                  "lastTransitionTime": "2025-04-08T09:01:44Z",
                  "message": "4 ready components, 0 with failure, 1 pending",
                  "reason": "Pending",
                  "status": "False",
                  "type": "Ready"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:44Z",
                  "message": "Deployment netobserv-plugin not ready: 1/1 (Deployment does not have minimum availability.)",
                  "reason": "DeploymentNotReady",
                  "status": "True",
                  "type": "WaitingFlowCollectorLegacy"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:44Z",
                  "message": "",
                  "reason": "Ready",
                  "status": "False",
                  "type": "WaitingMonitoring"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:43Z",
                  "message": "",
                  "reason": "Ready",
                  "status": "False",
                  "type": "WaitingNetworkPolicy"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:43Z",
                  "message": "",
                  "reason": "Valid",
                  "status": "False",
                  "type": "ConfigurationIssue"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:43Z",
                  "message": "Loki is not configured in LokiStack mode",
                  "reason": "Unused",
                  "status": "Unknown",
                  "type": "LokiIssue"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:45Z",
                  "message": "",
                  "reason": "Ready",
                  "status": "False",
                  "type": "WaitingFLPParent"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:45Z",
                  "message": "",
                  "reason": "Ready",
                  "status": "False",
                  "type": "WaitingFLPMonolith"
                },
                {
                  "lastTransitionTime": "2025-04-08T09:01:44Z",
                  "message": "Transformer only used with Kafka",
                  "reason": "ComponentUnused",
                  "status": "Unknown",
                  "type": "WaitingFLPTransformer"
                }
              ]
            }
            setResource(fc);
            break;
          case 'FlowMetric':
            if (req.name === 'flowmetric-sample') {
              const fm = _.cloneDeep(GetFlowMetricJS());
              fm.spec!.metricName = 'test_metric';
              setResource(fm);
            }
            break;
        }
        setLoaded(true);
      }, 1000);
    }
  }, [req, resource]);

  return React.useMemo(() => {
    if (!resource) {
      return [null, loaded, null];
    } else {
      return [resource, loaded, null];
    }
  }, [loaded, resource]);
}

export const ResourceIcon: React.FC<ResourceIconProps> = ({
  className,
  kind,
  children,
}) => {
  const k8sModels = useK8sModelsWithColors();

  return (
    <span className={className}>
      {k8sModels[kind!] && <span
        className="co-m-resource-icon"
        style={{ backgroundColor: k8sModels[kind!].color }}
        title={kind}>
        {k8sModels[kind!].abbr}
      </span>}
      {children}
    </span>
  );
};

export const ResourceLink: React.FC<ResourceLinkProps> = ({
  className,
  displayName,
  kind,
  name,
  children,
  dataTest,
}) => {
  const k8sModels = useK8sModelsWithColors();
  const value = displayName ? displayName : name;

  return (
    <span className={className}>
      {k8sModels[kind!] && <span
        className="co-m-resource-icon"
        style={{ backgroundColor: k8sModels[kind!].color }}
        title={kind}>
        {k8sModels[kind!].abbr}
      </span>}
      <span className="co-resource-item__resource-name" data-test-id={value} data-test={dataTest}>
        {value}
      </span>
      {children}
    </span>
  );
};


export const ResourceYAMLEditor: React.FC<ResourceYAMLEditorProps> = ({
  initialResource,
  header,
  onSave,
}) => {
  const containerHeight = document.getElementById("editor-content-container")?.clientHeight || 800;
  const footerHeight = document.getElementById("editor-toggle-footer")?.clientHeight || 0;
  return (<>
    <CodeEditor
      isLineNumbersVisible={true}
      isReadOnly={false}
      isMinimapVisible={true}
      isLanguageLabelVisible
      code={safeJSToYAML(initialResource)}
      language={Language.yaml}
      height={`${containerHeight - footerHeight}px`}
      onChange={(value) => onSave && onSave(value)}
    />
  </>);
};

export enum K8sResourceConditionStatus {
  True = "True",
  False = "False",
  Unknown = "Unknown"
}

export enum PrometheusEndpoint {
  label = "api/v1/label",
  query = "api/v1/query",
  queryRange = "api/v1/query_range",
  rules = "api/v1/rules",
  targets = "api/v1/targets"
}

export function usePrometheusPoll(props: PrometheusPollProps) {
  console.log("usePrometheusPoll", props);

  const [response, setResponse] = React.useState<PrometheusResponse | null>(null);

  React.useEffect(() => {
    // simulate a loading
    if (response == null) {
      setTimeout(() => {
        setResponse({
          status: "success",
          data: {
            resultType: "vector",
            result: [
              {
                metric: {
                  node: "node-1",
                  namespace: "ns-1",
                  pod: "pod-1",
                },
                value: [
                  1745832954.698,
                  "2000"
                ]
              },
              {
                metric: {
                  node: "node-2",
                  namespace: "ns-2",
                  pod: "pod-1",
                },
                value: [
                  1745832954.698,
                  "100"
                ]
              },
              {
                metric: {
                  node: "node-3",
                  namespace: "ns-1",
                  pod: "pod-1",
                },
                value: [
                  1745832954.698,
                  "400"
                ]
              },
            ],
          }
        });
      }, 1000);
    }
  }, [response]);

  return React.useMemo(() => {
    if (response == null) {
      return [null, false, null];
    } else {
      return [response, true, null];
    }
  }, [response]);
}
