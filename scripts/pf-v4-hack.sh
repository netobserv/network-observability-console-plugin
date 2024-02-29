#!/usr/bin/env bash

set -eux

echo "Overriding Console Plugin Manifest..."

cat >./web/dist/plugin-manifest.json << EOL
{
  "name": "netobserv-plugin",
  "version": "0.1.0",
  "displayName": "NetObserv Plugin for Console",
  "description": "This plugin adds network observability functionality to Openshift console",
  "dependencies": {
    "@console/pluginAPI": "*"
  },
  "extensions": [
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
      "type": "console.navigation/section",
      "properties": {
        "perspective": "admin",
        "id": "observe-projectadmin",
        "insertBefore": [
          "compute",
          "usermanagement"
        ],
        "name": "%plugin__netobserv-plugin~Observe%"
      },
      "flags": {
        "disallowed": [
          "CAN_LIST_NS"
        ]
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
      "flags": {
        "disallowed": [
          "CAN_LIST_NS"
        ]
      }
    },
    {
      "type": "console.page/route",
      "properties": {
        "path": "/netflow-traffic",
        "component": {
          "\$codeRef": "netflowParent.default"
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
          "\$codeRef": "netflowTab.default"
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
          "kind": "Service"
        },
        "component": {
          "\$codeRef": "netflowTab.default"
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
          "kind": "Namespace"
        },
        "component": {
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
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
          "\$codeRef": "netflowTab.default"
        },
        "page": {
          "name": "%plugin__netobserv-plugin~Network Traffic%",
          "href": "netflow"
        }
      }
    }
  ]
}
EOL

echo "Replacing PF5 references"

for f in ./web/dist/*.js; do
  sed -i -e 's/pf-v5/pf/g' $f
done

echo "Renaming plugin entry..."

find ./web/dist -name 'plugin-entry.*.min.js' -type f -exec /bin/sh -c "mv \"\$1\" \"./web/dist/plugin-entry.js\"" -- {} \;

echo "Done"
