export const extensionsMock = [
  {
    type: 'console.flag/model',
    properties: {
      flag: 'DEVWORKSPACE',
      model: {
        group: 'workspace.devfile.io',
        version: 'v1alpha1',
        kind: 'DevWorkspace'
      }
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/app',
    pluginName: '@console/app',
    uid: '@console/app[16]'
  },
  {
    type: 'console.flag/model',
    properties: {
      flag: 'v1alpha2DEVWORKSPACE',
      model: {
        group: 'workspace.devfile.io',
        version: 'v1alpha2',
        kind: 'DevWorkspace'
      }
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/app',
    pluginName: '@console/app',
    uid: '@console/app[17]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'secscan.quay.redhat.com',
        version: 'v1alpha1',
        kind: 'ImageManifestVuln'
      },
      flag: 'SECURITY_LABELLER'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/container-security',
    pluginName: '@console/container-security',
    uid: '@console/container-security[7]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'operator.knative.dev',
        version: 'v1alpha1',
        kind: 'KnativeServing'
      },
      flag: 'KNATIVE_SERVING'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[8]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'operator.knative.dev',
        version: 'v1alpha1',
        kind: 'KnativeEventing'
      },
      flag: 'KNATIVE_EVENTING'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[9]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'serving.knative.dev',
        version: 'v1',
        kind: 'Configuration'
      },
      flag: 'KNATIVE_SERVING_CONFIGURATION'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[10]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'serving.knative.dev',
        version: 'v1',
        kind: 'Revision'
      },
      flag: 'KNATIVE_SERVING_REVISION'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[11]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'serving.knative.dev',
        version: 'v1',
        kind: 'Route'
      },
      flag: 'KNATIVE_SERVING_ROUTE'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[12]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'serving.knative.dev',
        version: 'v1',
        kind: 'Service'
      },
      flag: 'KNATIVE_SERVING_SERVICE'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[13]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'eventing.knative.dev',
        version: 'v1',
        kind: 'Broker'
      },
      flag: 'FLAG_KNATIVE_EVENTING_BROKER'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[14]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'messaging.knative.dev',
        version: 'v1',
        kind: 'Channel'
      },
      flag: 'FLAG_KNATIVE_EVENTING_CHANNEL'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[15]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'eventing.knative.dev',
        version: 'v1',
        kind: 'Trigger'
      },
      flag: 'FLAG_KNATIVE_EVENTING_TRIGGER'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[16]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'messaging.knative.dev',
        version: 'v1',
        kind: 'Subscription'
      },
      flag: 'FLAG_KNATIVE_EVENTING_SUBSCRIPTION'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[17]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'camel.apache.org',
        version: 'v1alpha1',
        kind: 'Kamelet'
      },
      flag: 'FLAG_CAMEL_KAMELETS'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/knative-plugin',
    pluginName: '@console/knative-plugin',
    uid: '@console/knative-plugin[18]'
  },
  {
    type: 'console.flag/model',
    properties: {
      flag: 'KUBEVIRT_CDI',
      model: {
        group: 'cdi.kubevirt.io',
        version: 'v1beta1',
        kind: 'CDIConfig'
      }
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/kubevirt-plugin',
    pluginName: '@console/kubevirt-plugin',
    uid: '@console/kubevirt-plugin[1]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'pipelinesascode.tekton.dev',
        version: 'v1alpha1',
        kind: 'Repository'
      },
      flag: 'OPENSHIFT_PIPELINE_AS_CODE'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/pipelines-plugin',
    pluginName: '@console/pipelines-plugin',
    uid: '@console/pipelines-plugin[13]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'tekton.dev',
        version: 'v1beta1',
        kind: 'Pipeline'
      },
      flag: 'OPENSHIFT_PIPELINE'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/pipelines-plugin',
    pluginName: '@console/pipelines-plugin',
    uid: '@console/pipelines-plugin[14]'
  },
  {
    type: 'console.flag/model',
    properties: {
      flag: 'RHOAS_FLAG',
      model: {
        group: 'rhoas.redhat.com',
        version: 'v1alpha1',
        kind: 'CloudServiceAccountRequest'
      }
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/rhoas-plugin',
    pluginName: '@console/rhoas-plugin',
    uid: '@console/rhoas-plugin[4]'
  },
  {
    type: 'console.flag/model',
    properties: {
      model: {
        group: 'primer.gitops.io',
        version: 'v1alpha1',
        kind: 'Export'
      },
      flag: 'ALLOW_EXPORT_APP'
    },
    flags: {
      required: [],
      disallowed: []
    },
    pluginID: '@console/topology',
    pluginName: '@console/topology',
    uid: '@console/topology[12]'
  }
];
