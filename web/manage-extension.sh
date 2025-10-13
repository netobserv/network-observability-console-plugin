#!/bin/bash

if [ "$1" == "static" ]; then
  echo '[
  {
    "type": "console.page/route",
    "properties": {
      "path": "/k8s/ns/:namespace/operators.coreos.com~v1alpha1~ClusterServiceVersion/:operator/flows.netobserv.io~v1beta2~FlowCollector/~new",
      "component": {
        "$codeRef": "flowCollectorWizard.default"
      }
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "path": [
        "/k8s/cluster/flows.netobserv.io~v1beta2~FlowCollector/~new",
        "/k8s/cluster/flows.netobserv.io~v1beta2~FlowCollector/:name"
      ],
      "component": {
        "$codeRef": "flowCollectorForm.default"
      }
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "path": "/k8s/cluster/flows.netobserv.io~v1beta2~FlowCollector/status",
      "component": {
        "$codeRef": "flowCollectorStatus.default"
      }
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "path": "k8s/ns/:namespace/operators.coreos.com~v1alpha1~ClusterServiceVersion/:operator/flows.netobserv.io~v1alpha1~FlowMetric/~new",
      "component": {
        "$codeRef": "flowMetricWizard.default"
      }
    }
  },
  {
    "type": "console.page/route",
    "properties": {
      "path": [
        "/k8s/ns/:namespace/clusterserviceversions/:operator/flows.netobserv.io~v1alpha1~FlowMetric/:name",
        "/k8s/ns/:namespace/flows.netobserv.io~v1alpha1~FlowMetric/~new",
        "/k8s/ns/:namespace/flows.netobserv.io~v1alpha1~FlowMetric/:name"
      ],
      "component": {
        "$codeRef": "flowMetricForm.default"
      }
    }
  }
]' > console-extensions.json
  echo $(cat package.json | jq '.consolePlugin = {
    "name": "netobserv-plugin-static",
    "version": "0.1.0",
    "displayName": "NetObserv Static Plugin for OCP Console",
    "description": "This plugin adds custom forms for FlowCollector and FlowMetrics API",
    "exposedModules": {
      "flowCollectorWizard": "./components/forms/flowCollector-wizard.tsx",
      "flowCollectorForm": "./components/forms/flowCollector.tsx",
      "flowCollectorStatus": "./components/forms/flowCollector-status.tsx",
      "flowMetricWizard": "./components/forms/flowMetric-wizard.tsx",
      "flowMetricForm": "./components/forms/flowMetric.tsx"
    },
    "dependencies": {
      "@console/pluginAPI": "*"
    }
  }') > package.json
else
  echo '[
  {
    "type": "console.flag",
    "properties": {
      "handler": { "$codeRef": "netflowTab.featureFlagHandler" }
    }
  },
  {
    "type": "console.navigation/href",
    "properties": {
      "id": "netflow-traffic-link",
      "perspective": "admin",
      "section": "observe",
      "name": "%plugin__netobserv-plugin~Network Traffic%",
      "href": "/netflow-traffic"
    }
  },
  {
    "type": "console.navigation/href",
    "properties": {
      "id": "netflow-traffic-link-projectadmin",
      "perspective": "admin",
      "section": "observe-projectadmin",
      "name": "%plugin__netobserv-plugin~Network Traffic%",
      "href": "/netflow-traffic"
    },
    "flags": { "disallowed": ["CAN_LIST_NS"] }
  },
  {
    "type": "console.page/route",
    "properties": {
      "path": "/netflow-traffic",
      "component": {
        "$codeRef": "netflowParent.default"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "",
        "kind": "Pod"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    },
    "flags": { "required": ["NETOBSERV_LOKI_ENABLED"] }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "",
        "kind": "Service"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    },
    "flags": { "required": ["NETOBSERV_LOKI_ENABLED"] }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "",
        "kind": "Namespace"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "apps",
        "kind": "Deployment"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "apps",
        "kind": "StatefulSet"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "apps",
        "kind": "DaemonSet"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "apps",
        "kind": "ReplicaSet"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "",
        "kind": "Node"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "batch",
        "kind": "CronJob"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "batch",
        "kind": "Job"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v2beta2",
        "group": "autoscaling",
        "kind": "HorizontalPodAutoscaler"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "route.openshift.io",
        "kind": "Route"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "k8s.ovn.org",
        "kind": "ClusterUserDefinedNetwork"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab/horizontalNav",
    "properties": {
      "model": {
        "version": "v1",
        "group": "k8s.ovn.org",
        "kind": "UserDefinedNetwork"
      },
      "component": {
        "$codeRef": "netflowTab.default"
      },
      "page": {
        "name": "%plugin__netobserv-plugin~Network Traffic%",
        "href": "netflow"
      }
    }
  },
  {
    "type": "console.tab",
    "properties": {
      "contextId": "dev-console-observe",
      "name": "%plugin__netobserv-plugin~Network Traffic%",
      "href": "netflow-traffic",
      "component": {
        "$codeRef": "netflowDevTab.default"
      }
    }
  }
]' > console-extensions.json
  echo $(cat package.json | jq '.consolePlugin = {
    "name": "netobserv-plugin",
    "version": "0.1.0",
    "displayName": "NetObserv Plugin for Console",
    "description": "This plugin adds network observability functionality to Openshift console",
    "exposedModules": {
      "netflowParent": "./components/netflow-traffic-parent.tsx",
      "netflowTab": "./components/netflow-traffic-tab.tsx",
      "netflowDevTab": "./components/netflow-traffic-dev-tab.tsx"
    },
    "dependencies": {
      "@console/pluginAPI": "*"
    }
  }') > package.json
fi