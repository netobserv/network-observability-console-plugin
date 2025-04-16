/* eslint-disable max-len */
import { UiSchema } from '@rjsf/utils';

// Keep the UISchemas ordered for form display

export const FlowCollectorUISchema: UiSchema = {
  'ui:title': 'FlowCollector',
  'ui:description': 'The API for the network flows collection, which pilots and configures the underlying deployments.',
  'ui:flat': 'true',
  metadata: {
    'ui:title': 'Metadata',
    'ui:widget': 'hidden',
    name: {
      'ui:title': 'Name',
      'ui:widget': 'hidden'
    },
    labels: {
      'ui:widget': 'hidden'
    },
    'ui:order': ['name', 'labels', '*']
  },
  spec: {
    namespace: {
      'ui:title': 'Namespace'
    },
    deploymentModel: {
      'ui:title': 'Deployment model',
      'ui:description': 'The desired type of deployment for flow processing.'
    },
    kafka: {
      'ui:title': 'Kafka configuration',
      'ui:description': 'Kafka as a broker as part of the flow collection pipeline.',
      'ui:dependency': {
        controlFieldPath: ['deploymentModel'],
        controlFieldValue: 'Kafka',
        controlFieldName: 'deploymentModel'
      },
      address: {
        'ui:title': 'Address'
      },
      topic: {
        'ui:title': 'Topic'
      },
      tls: {
        'ui:title': 'TLS configuration',
        enable: {
          'ui:title': 'Use TLS'
        },
        caCert: {
          'ui:title': 'CA certificate',
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        userCert: {
          'ui:title': 'User certificate when using mTLS',
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        insecureSkipVerify: {
          'ui:title': 'Insecure skip verify'
        },
        'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
      },
      sasl: {
        'ui:title': 'SASL',
        'ui:description': 'SASL authentication configuration. Unsupported.',
        clientIDReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        clientSecretReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        'ui:order': ['type', 'clientIDReference', 'clientSecretReference']
      },
      'ui:order': ['address', 'topic', 'tls', 'sasl']
    },
    agent: {
      'ui:title': 'Agent configuration',
      'ui:description': 'Flows extraction.',
      type: {
        'ui:widget': 'hidden'
      },
      ipfix: {
        'ui:widget': 'hidden'
      },
      ebpf: {
        'ui:title': 'eBPF Agent configuration',
        'ui:description': 'Settings related to the eBPF-based flow reporter.',
        'ui:dependency': {
          controlFieldPath: ['agent', 'type'],
          controlFieldValue: 'eBPF',
          controlFieldName: 'type'
        },
        'ui:flat': 'true',
        sampling: {
          'ui:title': 'Sampling'
        },
        privileged: {
          'ui:title': 'Privileged mode'
        },
        features: {
          'ui:title': 'Features'
        },
        flowFilter: {
          'ui:title': 'Filters',
          'ui:description': 'The eBPF agent configuration regarding flow filtering.',
          enable: {
            'ui:title': 'Enable flow filtering'
          },
          tcpFlags: {
            'ui:widget': 'hidden'
          },
          sampling: {
            'ui:widget': 'hidden'
          },
          peerIP: {
            'ui:widget': 'hidden'
          },
          icmpCode: {
            'ui:widget': 'hidden'
          },
          pktDrops: {
            'ui:widget': 'hidden'
          },
          destPorts: {
            'ui:widget': 'hidden'
          },
          ports: {
            'ui:widget': 'hidden'
          },
          cidr: {
            'ui:widget': 'hidden'
          },
          action: {
            'ui:widget': 'hidden'
          },
          peerCIDR: {
            'ui:widget': 'hidden'
          },
          sourcePorts: {
            'ui:widget': 'hidden'
          },
          icmpType: {
            'ui:widget': 'hidden'
          },
          protocol: {
            'ui:widget': 'hidden'
          },
          direction: {
            'ui:widget': 'hidden'
          },
          rules: {
            'ui:title': 'Rules',
            'ui:description':
              'A list of filtering rules on the eBPF Agents.\nWhen filtering is enabled, by default, flows that don\'t match any rule are rejected.\nTo change the default, you can define a rule that accepts everything: `{ action: "Accept", cidr: "0.0.0.0/0" }`, and then refine with rejecting rules. Unsupported.',
            items: {
              'ui:order': [
                'tcpFlags',
                'sampling',
                'peerIP',
                'icmpCode',
                'pktDrops',
                'destPorts',
                'ports',
                'cidr',
                'action',
                'peerCIDR',
                'sourcePorts',
                'icmpType',
                'protocol',
                'direction'
              ]
            }
          },
          'ui:order': [
            'enable',
            'rules',
            'tcpFlags',
            'sampling',
            'peerIP',
            'icmpCode',
            'pktDrops',
            'destPorts',
            'ports',
            'cidr',
            'action',
            'peerCIDR',
            'sourcePorts',
            'icmpType',
            'protocol',
            'direction'
          ]
        },
        interfaces: {
          'ui:title': 'Interfaces',
          'ui:description':
            'The interface names from where flows are collected. If empty, the agent\nfetches all the interfaces in the system, excepting the ones listed in `excludeInterfaces`.\nAn entry enclosed by slashes, such as `/br-/`, is matched as a regular expression.\nOtherwise it is matched as a case-sensitive string.'
        },
        excludeInterfaces: {
          'ui:title': 'Exclude interfaces',
          'ui:description':
            'The interface names that are excluded from flow tracing.\nAn entry enclosed by slashes, such as `/br-/`, is matched as a regular expression.\nOtherwise it is matched as a case-sensitive string.'
        },
        logLevel: {
          'ui:title': 'Log level',
          'ui:description': 'The log level for the network observability eBPF Agent'
        },
        imagePullPolicy: {
          'ui:title': 'Image pull policy',
          'ui:description': 'The Kubernetes pull policy for the image defined above'
        },
        metrics: {
          'ui:title': 'Metrics',
          'ui:description': 'The eBPF agent configuration regarding metrics.',
          enable: {
            'ui:widget': 'hidden'
          },
          disableAlerts: {
            'ui:title': 'Disable alerts'
          },
          server: {
            'ui:title': 'Server',
            port: {
              'ui:title': 'Port'
            },
            'ui:order': ['port', 'tls'],
            tls: {
              'ui:order': ['type', 'insecureSkipVerify', 'provided', 'providedCaFile'],
              provided: {
                'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
              },
              providedCaFile: {
                'ui:order': ['file', 'name', 'namespace', 'type']
              }
            }
          },
          'ui:order': ['enable', 'disableAlerts', 'server']
        },
        cacheMaxFlows: {
          'ui:title': 'Cache max flows',
          'ui:description':
            'The max number of flows in an aggregate; when reached, the reporter sends the flows.\nIncreasing `cacheMaxFlows` and `cacheActiveTimeout` can decrease the network traffic overhead and the CPU load,\nhowever you can expect higher memory consumption and an increased latency in the flow collection.'
        },
        cacheActiveTimeout: {
          'ui:title': 'Cache active timeout',
          'ui:description':
            'The max period during which the reporter aggregates flows before sending.\nIncreasing `cacheMaxFlows` and `cacheActiveTimeout` can decrease the network traffic overhead and the CPU load,\nhowever you can expect higher memory consumption and an increased latency in the flow collection.'
        },
        kafkaBatchSize: {
          'ui:title': 'Kafka batch size',
          'ui:description':
            'Limits the maximum size of a request in bytes before being sent to a partition. Ignored when not using Kafka. Default: 1MB.',
          'ui:dependency': {
            controlFieldPath: ['deploymentModel'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'deploymentModel'
          }
        },
        resources: {
          'ui:title': 'Resource Requirements',
          'ui:widget': 'hidden',
          'ui:order': ['claims', 'limits', 'requests'],
          claims: {
            items: {
              'ui:order': ['name', 'request']
            }
          }
        },
        advanced: {
          'ui:title': 'Advanced configuration',
          'ui:widget': 'hidden',
          'ui:order': ['env', 'scheduling'],
          scheduling: {
            'ui:widget': 'hidden',
            affinity: {
              'ui:order': ['nodeAffinity', 'podAffinity', 'podAntiAffinity'],
              nodeAffinity: {
                'ui:order': [
                  'preferredDuringSchedulingIgnoredDuringExecution',
                  'requiredDuringSchedulingIgnoredDuringExecution'
                ],
                preferredDuringSchedulingIgnoredDuringExecution: {
                  items: {
                    'ui:order': ['preference', 'weight'],
                    preference: {
                      'ui:order': ['matchExpressions', 'matchFields'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      },
                      matchFields: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                },
                requiredDuringSchedulingIgnoredDuringExecution: {
                  nodeSelectorTerms: {
                    items: {
                      'ui:order': ['matchExpressions', 'matchFields'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      },
                      matchFields: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              podAffinity: {
                'ui:order': [
                  'preferredDuringSchedulingIgnoredDuringExecution',
                  'requiredDuringSchedulingIgnoredDuringExecution'
                ],
                preferredDuringSchedulingIgnoredDuringExecution: {
                  items: {
                    'ui:order': ['podAffinityTerm', 'weight'],
                    podAffinityTerm: {
                      'ui:order': [
                        'topologyKey',
                        'labelSelector',
                        'matchLabelKeys',
                        'mismatchLabelKeys',
                        'namespaceSelector',
                        'namespaces'
                      ],
                      labelSelector: {
                        'ui:order': ['matchExpressions', 'matchLabels'],
                        matchExpressions: {
                          items: {
                            'ui:order': ['key', 'operator', 'values']
                          }
                        }
                      },
                      namespaceSelector: {
                        'ui:order': ['matchExpressions', 'matchLabels'],
                        matchExpressions: {
                          items: {
                            'ui:order': ['key', 'operator', 'values']
                          }
                        }
                      }
                    }
                  }
                },
                requiredDuringSchedulingIgnoredDuringExecution: {
                  items: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              podAntiAffinity: {
                'ui:order': [
                  'preferredDuringSchedulingIgnoredDuringExecution',
                  'requiredDuringSchedulingIgnoredDuringExecution'
                ],
                preferredDuringSchedulingIgnoredDuringExecution: {
                  items: {
                    'ui:order': ['podAffinityTerm', 'weight'],
                    podAffinityTerm: {
                      'ui:order': [
                        'topologyKey',
                        'labelSelector',
                        'matchLabelKeys',
                        'mismatchLabelKeys',
                        'namespaceSelector',
                        'namespaces'
                      ],
                      labelSelector: {
                        'ui:order': ['matchExpressions', 'matchLabels'],
                        matchExpressions: {
                          items: {
                            'ui:order': ['key', 'operator', 'values']
                          }
                        }
                      },
                      namespaceSelector: {
                        'ui:order': ['matchExpressions', 'matchLabels'],
                        matchExpressions: {
                          items: {
                            'ui:order': ['key', 'operator', 'values']
                          }
                        }
                      }
                    }
                  }
                },
                requiredDuringSchedulingIgnoredDuringExecution: {
                  items: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              }
            },
            tolerations: {
              items: {
                'ui:order': ['effect', 'key', 'operator', 'tolerationSeconds', 'value']
              }
            },
            'ui:order': ['affinity', 'nodeSelector', 'priorityClassName', 'tolerations']
          }
        },
        'ui:order': [
          'sampling',
          'privileged',
          'features',
          'flowFilter',
          'interfaces',
          'excludeInterfaces',
          'logLevel',
          'imagePullPolicy',
          'metrics',
          'cacheMaxFlows',
          'cacheActiveTimeout',
          'kafkaBatchSize',
          'resources',
          'advanced'
        ]
      },
      'ui:order': ['ipfix', 'type', 'ebpf']
    },
    processor: {
      'ui:title': 'Processor configuration',
      'ui:description':
        'The component that receives the flows from the agent, enriches them, generates metrics, and forwards them to the Loki persistence layer and/or any available exporter.',
      filters: {
        'ui:title': 'Filters',
        'ui:description':
          'Define custom filters to limit the amount of generated flows.\nThese filters provide more flexibility than the eBPF Agent filters (in `spec.agent.ebpf.flowFilter`), such as allowing to filter by Kubernetes namespace, but with a lesser improvement in performance. Unsupported.',
        items: {
          'ui:order': ['allOf', 'outputTarget', 'sampling'],
          allOf: {
            items: {
              'ui:order': ['field', 'matchType', 'value']
            }
          }
        }
      },
      multiClusterDeployment: {
        'ui:title': 'Multi-cluster deployment',
        'ui:description': 'Enable multi clusters feature. This adds `clusterName` label to flows data'
      },
      clusterName: {
        'ui:title': 'Cluster name',
        'ui:description':
          'The name of the cluster to appear in the flows data. This is useful in a multi-cluster context. When using OpenShift, leave empty to make it automatically',
        'ui:dependency': {
          controlFieldPath: ['processor', 'multiClusterDeployment'],
          controlFieldValue: 'true',
          controlFieldName: 'multiClusterDeployment'
        }
      },
      addZone: {
        'ui:title': 'Availability zones',
        'ui:description':
          'Allows availability zone awareness by labelling flows with their source and destination zones.\nThis feature requires the "topology.kubernetes.io/zone" label to be set on nodes.'
      },
      subnetLabels: {
        'ui:title': 'Subnet labels',
        'ui:description':
          'Allows to define custom labels on subnets and IPs or to enable automatic labelling of recognized subnets in OpenShift, which is used to identify cluster external traffic.\nWhen a subnet matches the source or destination IP of a flow, a corresponding field is added: `SrcSubnetLabel` or `DstSubnetLabel`.',
        openShiftAutoDetect: {
          'ui:widget': 'hidden'
        },
        customLabels: {
          'ui:title': 'Custom labels',
          'ui:description':
            'allows to customize subnets and IPs labelling, such as to identify cluster-external workloads or web services.\nIf you enable `openShiftAutoDetect`, `customLabels` can override the detected subnets in case they overlap.',
          items: {
            'ui:order': ['cidrs', 'name']
          }
        },
        'ui:order': ['openShiftAutoDetect', 'customLabels']
      },
      logTypes: {
        'ui:title': 'Log types',
        'ui:widget': 'hidden'
      },
      logLevel: {
        'ui:title': 'Log level',
        'ui:description': 'The log level of the processor runtime'
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
        'ui:description': 'The Kubernetes pull policy for the image defined above'
      },
      deduper: {
        'ui:title': 'Deduper',
        'ui:description':
          'Allows you to sample or drop flows identified as duplicates, in order to save on resource usage. Unsupported.',
        mode: {
          'ui:title': 'Mode'
        },
        sampling: {
          'ui:title': 'Sampling'
        },
        'ui:order': ['mode', 'sampling']
      },
      kafkaConsumerQueueCapacity: {
        'ui:title': 'Kafka consumer queue capacity',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        }
      },
      kafkaConsumerAutoscaler: {
        'ui:title': 'kafka consumer autoscaler',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
        'ui:order': ['maxReplicas', 'metrics', 'minReplicas', 'status'],
        metrics: {
          items: {
            'ui:order': ['type', 'containerResource', 'external', 'object', 'pods', 'resource'],
            containerResource: {
              'ui:order': ['container', 'name', 'target'],
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            external: {
              'ui:order': ['metric', 'target'],
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            object: {
              'ui:order': ['describedObject', 'metric', 'target'],
              describedObject: {
                'ui:order': ['kind', 'name', 'apiVersion']
              },
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            pods: {
              'ui:order': ['metric', 'target'],
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            resource: {
              'ui:order': ['name', 'target'],
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            }
          }
        }
      },
      kafkaConsumerReplicas: {
        'ui:title': 'Kafka consumer replicas',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        }
      },
      kafkaConsumerBatchSize: {
        'ui:title': 'Kafka consumer batch size',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        }
      },
      metrics: {
        'ui:title': 'Metrics configuration',
        'ui:description': 'The processor configuration regarding metrics',
        server: {
          'ui:title': 'Server configuration',
          tls: {
            'ui:title': 'TLS configuration',
            insecureSkipVerify: {
              'ui:title': 'Insecure',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              }
            },
            provided: {
              'ui:title': 'Cert',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              },
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            providedCaFile: {
              'ui:title': 'CA',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              },
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            'ui:order': ['type', 'insecureSkipVerify', 'provided', 'providedCaFile']
          },
          port: {
            'ui:title': 'Port'
          },
          'ui:order': ['tls', 'port']
        },
        disableAlerts: {
          'ui:title': 'Disable alerts',
          'ui:description':
            'List of alerts that should be disabled.\nPossible values are:\n`NetObservNoFlows`, which is triggered when no flows are being observed for a certain period.\n`NetObservLokiError`, which is triggered when flows are being dropped due to Loki errors.'
        },
        includeList: {
          'ui:title': 'Include list',
          'ui:description':
            'List of metric names to specify which ones to generate.\nThe names correspond to the names in Prometheus without the prefix. For example,\n`namespace_egress_packets_total` shows up as `netobserv_namespace_egress_packets_total` in Prometheus.\nNote that the more metrics you add, the bigger is the impact on Prometheus workload resources.\nMetrics enabled by default are:\n`namespace_flows_total`, `node_ingress_bytes_total`, `node_egress_bytes_total`, `workload_ingress_bytes_total`,\n`workload_egress_bytes_total`, `namespace_drop_packets_total` (when `PacketDrop` feature is enabled),\n`namespace_rtt_seconds` (when `FlowRTT` feature is enabled), `namespace_dns_latency_seconds` (when `DNSTracking` feature is enabled),\n`namespace_network_policy_events_total` (when `NetworkEvents` feature is enabled).\nMore information, with full list of available metrics: https://github.com/netobserv/network-observability-operator/blob/main/docs/Metrics.md'
        },
        'ui:order': ['server', 'disableAlerts', 'includeList']
      },
      resources: {
        'ui:title': 'Resource Requirements',
        'ui:widget': 'hidden',
        'ui:order': ['claims', 'limits', 'requests'],
        claims: {
          items: {
            'ui:order': ['name', 'request']
          }
        }
      },
      advanced: {
        'ui:title': 'Advanced configuration',
        scheduling: {
          'ui:widget': 'hidden',
          'ui:order': ['affinity', 'nodeSelector', 'priorityClassName', 'tolerations'],
          affinity: {
            'ui:order': ['nodeAffinity', 'podAffinity', 'podAntiAffinity'],
            nodeAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['preference', 'weight'],
                  preference: {
                    'ui:order': ['matchExpressions', 'matchFields'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    },
                    matchFields: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: {
                  items: {
                    'ui:order': ['matchExpressions', 'matchFields'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    },
                    matchFields: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            },
            podAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['podAffinityTerm', 'weight'],
                  podAffinityTerm: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': [
                    'topologyKey',
                    'labelSelector',
                    'matchLabelKeys',
                    'mismatchLabelKeys',
                    'namespaceSelector',
                    'namespaces'
                  ],
                  labelSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  },
                  namespaceSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            },
            podAntiAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['podAffinityTerm', 'weight'],
                  podAffinityTerm: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': [
                    'topologyKey',
                    'labelSelector',
                    'matchLabelKeys',
                    'mismatchLabelKeys',
                    'namespaceSelector',
                    'namespaces'
                  ],
                  labelSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  },
                  namespaceSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            }
          },
          tolerations: {
            items: {
              'ui:order': ['effect', 'key', 'operator', 'tolerationSeconds', 'value']
            }
          }
        },
        secondaryNetworks: {
          items: {
            'ui:order': ['index', 'name']
          }
        },
        'ui:order': [
          'port',
          'conversationTerminatingTimeout',
          'conversationEndTimeout',
          'profilePort',
          'env',
          'enableKubeProbes',
          'scheduling',
          'secondaryNetworks',
          'healthPort',
          'dropUnusedFields',
          'conversationHeartbeatInterval'
        ]
      },
      'ui:order': [
        'filters',
        'multiClusterDeployment',
        'clusterName',
        'addZone',
        'subnetLabels',
        'logTypes',
        'logLevel',
        'imagePullPolicy',
        'deduper',
        'kafkaConsumerReplicas',
        'kafkaConsumerAutoscaler',
        'kafkaConsumerQueueCapacity',
        'kafkaConsumerBatchSize',
        'metrics',
        'resources',
        'advanced'
      ]
    },
    prometheus: {
      'ui:title': 'Prometheus',
      'ui:flat': 'true',
      querier: {
        'ui:title': 'Prometheus querier configuration',
        enable: {
          'ui:title': 'Use Prometheus storage',
          'ui:description':
            'When enabled, the Console plugin queries flow metrics from Prometheus instead of Loki whenever possible.\nIt is enbaled by default: set it to `false` to disable this feature.\nThe Console plugin can use either Loki or Prometheus as a data source for metrics (see also `spec.loki`), or both.\nNot all queries are transposable from Loki to Prometheus. Hence, if Loki is disabled, some features of the plugin are disabled as well,\nsuch as getting per-pod information or viewing raw flows.\nIf both Prometheus and Loki are enabled, Prometheus takes precedence and Loki is used as a fallback for queries that Prometheus cannot handle.\nIf they are both disabled, the Console plugin is not deployed.'
        },
        mode: {
          'ui:title': 'Mode',
          'ui:description':
            'Must be set according to the type of Prometheus installation that stores network observability metrics:\n- Use `Auto` to try configuring automatically. In OpenShift, it uses the Thanos querier from OpenShift Cluster Monitoring\n- Use `Manual` for a manual setup'
        },
        manual: {
          'ui:title': 'Manual',
          'ui:description': 'Prometheus configuration for manual mode.',
          'ui:dependency': {
            controlFieldPath: ['prometheus', 'querier', 'mode'],
            controlFieldValue: 'Manual',
            controlFieldName: 'mode'
          },
          forwardUserToken: {
            'ui:title': 'Forward user token'
          },
          url: {
            'ui:title': 'Url'
          },
          tls: {
            'ui:title': 'TLS configuration',
            enable: {
              'ui:title': 'Use TLS'
            },
            caCert: {
              'ui:title': 'CA certificate',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:title': 'User certificate when using mTLS',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            insecureSkipVerify: {
              'ui:title': 'Insecure skip verify'
            },
            'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
          },
          'ui:order': ['forwardUserToken', 'url', 'tls']
        },
        timeout: {
          'ui:title': 'Timeout',
          'ui:description':
            'The read timeout for console plugin queries to Prometheus.\nA timeout of zero means no timeout.'
        },
        'ui:order': ['enable', 'mode', 'manual', 'timeout']
      }
    },
    loki: {
      'ui:title': 'Loki client settings',
      'ui:description': 'Flow logs storage.',
      enable: {
        'ui:title': 'Use Loki storage'
      },
      mode: {
        'ui:title': 'Mode'
      },
      manual: {
        'ui:title': 'Manual',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Manual',
          controlFieldName: 'mode'
        },
        authToken: {
          'ui:title': 'Auth token'
        },
        ingesterUrl: {
          'ui:title': 'Ingester url'
        },
        querierUrl: {
          'ui:title': 'Querier url'
        },
        statusUrl: {
          'ui:title': 'Status url'
        },
        tenantID: {
          'ui:title': 'Tenant id'
        },
        'ui:order': ['authToken', 'ingesterUrl', 'querierUrl', 'statusUrl', 'tenantID', 'statusTls', 'tls'],
        statusTls: {
          'ui:title': 'TLS configuration',
          enable: {
            'ui:title': 'Use TLS'
          },
          caCert: {
            'ui:title': 'CA certificate',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:title': 'User certificate when using mTLS',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          insecureSkipVerify: {
            'ui:title': 'Insecure skip verify'
          },
          'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
        },
        tls: {
          'ui:title': 'TLS configuration',
          enable: {
            'ui:title': 'Use TLS'
          },
          caCert: {
            'ui:title': 'CA certificate',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:title': 'User certificate when using mTLS',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          insecureSkipVerify: {
            'ui:title': 'Insecure skip verify'
          },
          'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
        }
      },
      monolithic: {
        'ui:title': 'Monolithic',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Monolithic',
          controlFieldName: 'mode'
        },
        tenantID: {
          'ui:title': 'Tenant id'
        },
        url: {
          'ui:title': 'Url'
        },
        'ui:order': ['tenantID', 'url', 'tls'],
        tls: {
          'ui:title': 'TLS configuration',
          enable: {
            'ui:title': 'Use TLS'
          },
          caCert: {
            'ui:title': 'CA certificate',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:title': 'User certificate when using mTLS',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          insecureSkipVerify: {
            'ui:title': 'Insecure skip verify'
          },
          'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
        }
      },
      microservices: {
        'ui:title': 'Microservices',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Microservices',
          controlFieldName: 'mode'
        },
        ingesterUrl: {
          'ui:title': 'Ingester url'
        },
        querierUrl: {
          'ui:title': 'Querier url'
        },
        tenantID: {
          'ui:title': 'Tenant id'
        },
        'ui:order': ['ingesterUrl', 'querierUrl', 'tenantID', 'tls'],
        tls: {
          'ui:title': 'TLS configuration',
          enable: {
            'ui:title': 'Use TLS'
          },
          caCert: {
            'ui:title': 'CA certificate',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:title': 'User certificate when using mTLS',
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          insecureSkipVerify: {
            'ui:title': 'Insecure skip verify'
          },
          'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
        }
      },
      lokiStack: {
        'ui:title': 'Loki stack',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'LokiStack',
          controlFieldName: 'mode'
        },
        name: {
          'ui:title': 'Name'
        },
        namespace: {
          'ui:title': 'Namespace'
        },
        'ui:order': ['name', 'namespace']
      },
      readTimeout: {
        'ui:title': 'Read timeout',
        'ui:description': 'The maximum console plugin loki query total time limit.\nA timeout of zero means no timeout.'
      },
      writeTimeout: {
        'ui:title': 'Write timeout',
        'ui:description': 'The maximum Loki time connection / request limit.\nA timeout of zero means no timeout.'
      },
      writeBatchWait: {
        'ui:title': 'Write batch wait',
        'ui:description': 'The maximum time to wait before sending a Loki batch.'
      },
      writeBatchSize: {
        'ui:title': 'Write batch size',
        'ui:description': 'The maximum batch size (in bytes) of Loki logs to accumulate before sending.'
      },
      advanced: {
        'ui:title': 'Advanced configuration',
        'ui:description':
          'Internal configuration of the Loki clients.\nThis section is aimed mostly for debugging and fine-grained performance optimizations.',
        staticLabels: {
          'ui:title': 'Static labels',
          'ui:description': 'A map of common labels to set on each flow in Loki storage.'
        },
        writeMaxRetries: {
          'ui:title': 'Write max retries',
          'ui:description': 'The maximum number of retries for Loki client connections.'
        },
        writeMaxBackoff: {
          'ui:title': 'Write max backoff',
          'ui:description': 'The maximum backoff time for Loki client connection between retries.'
        },
        writeMinBackoff: {
          'ui:title': 'Write min backoff',
          'ui:description': 'The initial backoff time for Loki client connection between retries.'
        },
        'ui:order': ['staticLabels', 'writeMaxRetries', 'writeMaxBackoff', 'writeMinBackoff']
      },
      'ui:order': [
        'enable',
        'mode',
        'manual',
        'monolithic',
        'microservices',
        'lokiStack',
        'readTimeout',
        'writeTimeout',
        'writeBatchWait',
        'writeBatchSize',
        'advanced'
      ]
    },
    consolePlugin: {
      'ui:title': 'Console plugin configuration',
      'ui:description': 'The OpenShift Console integration.',
      enable: {
        'ui:title': 'Deploy console plugin'
      },
      logLevel: {
        'ui:title': 'Log level',
        'ui:description': 'Log level for the console plugin backend'
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
        'ui:description': 'The Kubernetes pull policy for the image defined above'
      },
      portNaming: {
        'ui:title': 'Port naming',
        'ui:description': 'The configuration of the port-to-service name translation',
        enable: {
          'ui:title': 'Enable'
        },
        portNames: {
          'ui:title': 'Port names'
        },
        'ui:order': ['enable', 'portNames']
      },
      resources: {
        'ui:title': 'Resource Requirements',
        'ui:widget': 'hidden',
        'ui:order': ['claims', 'limits', 'requests'],
        claims: {
          items: {
            'ui:order': ['name', 'request']
          }
        }
      },
      quickFilters: {
        'ui:title': 'Quick filters',
        'ui:description': 'Configure quick filter presets for the Console plugin',
        items: {
          'ui:order': ['filter', 'name', 'default']
        }
      },
      replicas: {
        'ui:title': 'Replicas',
        'ui:description': 'The number of replicas (pods) to start.'
      },
      autoscaler: {
        'ui:title': 'Horizontal pod autoscaler',
        'ui:widget': 'hidden',
        'ui:order': ['maxReplicas', 'metrics', 'minReplicas', 'status'],
        metrics: {
          items: {
            'ui:order': ['type', 'containerResource', 'external', 'object', 'pods', 'resource'],
            containerResource: {
              'ui:order': ['container', 'name', 'target'],
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            external: {
              'ui:order': ['metric', 'target'],
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            object: {
              'ui:order': ['describedObject', 'metric', 'target'],
              describedObject: {
                'ui:order': ['kind', 'name', 'apiVersion']
              },
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            pods: {
              'ui:order': ['metric', 'target'],
              metric: {
                'ui:order': ['name', 'selector'],
                selector: {
                  'ui:order': ['matchExpressions', 'matchLabels'],
                  matchExpressions: {
                    items: {
                      'ui:order': ['key', 'operator', 'values']
                    }
                  }
                }
              },
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            },
            resource: {
              'ui:order': ['name', 'target'],
              target: {
                'ui:order': ['type', 'averageUtilization', 'averageValue', 'value']
              }
            }
          }
        }
      },
      advanced: {
        'ui:title': 'Advanced configuration',
        'ui:description':
          'Internal configuration of the console plugin.\nThis section is aimed mostly for debugging and fine-grained performance optimizations, such as `GOGC` and `GOMAXPROCS` env vars. Set these values at your own risk.',
        'ui:order': ['args', 'env', 'port', 'register', 'scheduling'],
        scheduling: {
          'ui:widget': 'hidden',
          affinity: {
            'ui:order': ['nodeAffinity', 'podAffinity', 'podAntiAffinity'],
            nodeAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['preference', 'weight'],
                  preference: {
                    'ui:order': ['matchExpressions', 'matchFields'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    },
                    matchFields: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: {
                  items: {
                    'ui:order': ['matchExpressions', 'matchFields'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    },
                    matchFields: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            },
            podAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['podAffinityTerm', 'weight'],
                  podAffinityTerm: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': [
                    'topologyKey',
                    'labelSelector',
                    'matchLabelKeys',
                    'mismatchLabelKeys',
                    'namespaceSelector',
                    'namespaces'
                  ],
                  labelSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  },
                  namespaceSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            },
            podAntiAffinity: {
              'ui:order': [
                'preferredDuringSchedulingIgnoredDuringExecution',
                'requiredDuringSchedulingIgnoredDuringExecution'
              ],
              preferredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': ['podAffinityTerm', 'weight'],
                  podAffinityTerm: {
                    'ui:order': [
                      'topologyKey',
                      'labelSelector',
                      'matchLabelKeys',
                      'mismatchLabelKeys',
                      'namespaceSelector',
                      'namespaces'
                    ],
                    labelSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    },
                    namespaceSelector: {
                      'ui:order': ['matchExpressions', 'matchLabels'],
                      matchExpressions: {
                        items: {
                          'ui:order': ['key', 'operator', 'values']
                        }
                      }
                    }
                  }
                }
              },
              requiredDuringSchedulingIgnoredDuringExecution: {
                items: {
                  'ui:order': [
                    'topologyKey',
                    'labelSelector',
                    'matchLabelKeys',
                    'mismatchLabelKeys',
                    'namespaceSelector',
                    'namespaces'
                  ],
                  labelSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  },
                  namespaceSelector: {
                    'ui:order': ['matchExpressions', 'matchLabels'],
                    matchExpressions: {
                      items: {
                        'ui:order': ['key', 'operator', 'values']
                      }
                    }
                  }
                }
              }
            }
          },
          tolerations: {
            items: {
              'ui:order': ['effect', 'key', 'operator', 'tolerationSeconds', 'value']
            }
          },
          'ui:order': ['affinity', 'nodeSelector', 'priorityClassName', 'tolerations']
        }
      },
      'ui:order': [
        'enable',
        'logLevel',
        'imagePullPolicy',
        'portNaming',
        'quickFilters',
        'replicas',
        'autoscaler',
        'resources',
        'advanced'
      ]
    },
    networkPolicy: {
      'ui:title': 'Network policy',
      'ui:description': 'Ingress network policy settings for network observability components isolation.',
      enable: {
        'ui:title': 'Deploy policies'
      },
      additionalNamespaces: {
        'ui:title': 'Additional namespaces',
        'ui:description':
          'Namespaces allowed to connect to the network observability namespace.\nIt provides flexibility in the network policy configuration, but if you need a more specific\nconfiguration, you can disable it and install your own instead.',
        'ui:dependency': {
          controlFieldPath: ['networkPolicy', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        }
      },
      'ui:order': ['enable', 'additionalNamespaces']
    },
    exporters: {
      'ui:title': 'Exporters',
      'ui:description': 'Additional optional exporters for custom consumption or storage.',
      items: {
        type: {
          'ui:title': 'Type',
          'ui:description': 'Type of exporters. The available options are `Kafka`, `IPFIX`, and `OpenTelemetry`.'
        },
        ipfix: {
          'ui:title': 'IPFIX configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'IPFIX',
            controlFieldName: 'type'
          },
          'ui:order': ['targetHost', 'targetPort', 'transport']
        },
        kafka: {
          'ui:title': 'Kafka configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'type'
          },
          tls: {
            'ui:title': 'TLS configuration',
            enable: {
              'ui:title': 'Use TLS'
            },
            caCert: {
              'ui:title': 'CA certificate',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:title': 'User certificate when using mTLS',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            insecureSkipVerify: {
              'ui:title': 'Insecure skip verify'
            },
            'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
          },
          sasl: {
            'ui:title': 'SASL',
            'ui:description': 'SASL authentication configuration. Unsupported.',
            clientIDReference: {
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            clientSecretReference: {
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            'ui:order': ['type', 'clientIDReference', 'clientSecretReference']
          },
          'ui:order': ['address', 'topic', 'tls', 'sasl']
        },
        openTelemetry: {
          'ui:title': 'OpenTelemetry configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'OpenTelemetry',
            controlFieldName: 'type'
          },
          'ui:order': ['targetHost', 'targetPort', 'fieldsMapping', 'headers', 'logs', 'metrics', 'protocol', 'tls'],
          fieldsMapping: {
            items: {
              'ui:order': ['input', 'multiplier', 'output']
            }
          },
          metrics: {
            'ui:order': ['enable', 'pushTimeInterval']
          },
          tls: {
            'ui:title': 'TLS configuration',
            enable: {
              'ui:title': 'Use TLS'
            },
            caCert: {
              'ui:title': 'CA certificate',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:title': 'User certificate when using mTLS',
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            insecureSkipVerify: {
              'ui:title': 'Insecure skip verify'
            },
            'ui:order': ['enable', 'caCert', 'userCert', 'insecureSkipVerify']
          }
        },
        'ui:order': ['type', 'ipfix', 'kafka', 'openTelemetry']
      }
    },
    'ui:order': [
      'namespace',
      'deploymentModel',
      'kafka',
      'agent',
      'processor',
      'prometheus',
      'loki',
      'consolePlugin',
      'networkPolicy',
      'exporters'
    ]
  },
  'ui:order': ['metadata', 'spec', '*']
};

export const FlowMetricUISchema: UiSchema = {
  'ui:title': 'FlowMetric',
  'ui:description': 'The API allowing to create custom metrics from the collected flow logs.',
  'ui:flat': 'true',
  metadata: {
    'ui:title': 'Metadata',
    'ui:flat': 'true',
    name: {
      'ui:title': 'Name'
    },
    namespace: {
      'ui:title': 'Namespace'
    },
    labels: {
      'ui:widget': 'hidden'
    },
    'ui:order': ['name', 'namespace', 'labels', '*']
  },
  spec: {
    metricName: {
      'ui:title': 'Metric name',
      'ui:description': 'Name of the metric. In Prometheus, it is automatically prefixed with "netobserv_".'
    },
    type: {
      'ui:title': 'Type',
      'ui:description':
        'Metric type: "Counter" or "Histogram".\nUse "Counter" for any value that increases over time and on which you can compute a rate, such as Bytes or Packets.\nUse "Histogram" for any value that must be sampled independently, such as latencies.'
    },
    buckets: {
      'ui:title': 'Buckets',
      'ui:description':
        'A list of buckets to use when `type` is "Histogram". The list must be parsable as floats. When not set, Prometheus default buckets are used.',
      'ui:dependency': {
        controlFieldPath: ['type'],
        controlFieldValue: 'Histogram',
        controlFieldName: 'type'
      }
    },
    valueField: {
      'ui:title': 'Value field',
      'ui:description':
        'Flow field that must be used as a value for this metric. This field must hold numeric values.\nLeave empty to count flows rather than a specific value per flow.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.'
    },
    divider: {
      'ui:title': 'Divider',
      'ui:description': 'When nonzero, scale factor (divider) of the value. Metric value = Flow value / Divider.'
    },
    labels: {
      'ui:title': 'Labels',
      'ui:description':
        'List of fields that should be used as Prometheus labels, also known as dimensions.\nFrom choosing labels results the level of granularity of this metric, and the available aggregations at query time.\nIt must be done carefully as it impacts the metric cardinality (cf https://rhobs-handbook.netlify.app/products/openshiftmonitoring/telemetry.md/#what-is-the-cardinality-of-a-metric).\nIn general, avoid setting very high cardinality labels such as IP or MAC addresses.\n"SrcK8S_OwnerName" or "DstK8S_OwnerName" should be preferred over "SrcK8S_Name" or "DstK8S_Name" as much as possible.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.'
    },
    flatten: {
      'ui:title': 'Flatten',
      'ui:description':
        'List of array-type fields that must be flattened, such as Interfaces or NetworkEvents. Flattened fields generate one metric per item in that field.\nFor instance, when flattening `Interfaces` on a bytes counter, a flow having Interfaces [br-ex, ens5] increases one counter for `br-ex` and another for `ens5`.'
    },
    remap: {
      'ui:title': 'Remap',
      'ui:description':
        'Use different names for the generated metric labels than the flow fields. Use the origin flow fields as keys, and the desired label names as values.',
      'ui:widget': 'map'
    },
    direction: {
      'ui:title': 'Direction',
      'ui:description':
        'Filter for ingress, egress or any direction flows.\nWhen set to `Ingress`, it is equivalent to adding the regular expression filter on `FlowDirection`: `0|2`.\nWhen set to `Egress`, it is equivalent to adding the regular expression filter on `FlowDirection`: `1|2`.'
    },
    filters: {
      'ui:title': 'Filters',
      'ui:description':
        'A list of fields and values used to restrict which flows are taken into account. Oftentimes, these filters must\nbe used to eliminate duplicates: `Duplicate != "true"` and `FlowDirection = "0"`.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.',
      items: {
        field: {
          'ui:title': 'Field',
          'ui:description': 'Name of the field to filter on'
        },
        matchType: {
          'ui:title': 'Match type',
          'ui:description': 'Type of matching to apply'
        },
        value: {
          'ui:title': 'Value',
          'ui:description':
            'Value to filter on. When `matchType` is `Equal` or `NotEqual`, you can use field injection with `$(SomeField)` to refer to any other field of the flow.'
        },
        'ui:order': ['field', 'matchType', 'value']
      }
    },
    charts: {
      'ui:title': 'Charts',
      'ui:description': 'Charts configuration, for the OpenShift Console in the administrator view, Dashboards menu.',
      items: {
        dashboardName: {
          'ui:title': 'Dashboard name',
          'ui:description':
            'Name of the containing dashboard. If this name does not refer to an existing dashboard, a new dashboard is created.'
        },
        sectionName: {
          'ui:title': 'Section name',
          'ui:description':
            'Name of the containing dashboard section. If this name does not refer to an existing section, a new section is created.\nIf `sectionName` is omitted or empty, the chart is placed in the global top section.'
        },
        title: {
          'ui:title': 'Title',
          'ui:description': 'Title of the chart.'
        },
        unit: {
          'ui:title': 'Unit',
          'ui:description':
            'Unit of this chart. Only a few units are currently supported. Leave empty to use generic number.'
        },
        type: {
          'ui:title': 'Type',
          'ui:description': 'Type of the chart.'
        },
        queries: {
          'ui:title': 'Queries',
          'ui:description':
            'List of queries to be displayed on this chart. If `type` is `SingleStat` and multiple queries are provided,\nthis chart is automatically expanded in several panels (one per query).',
          items: {
            promQL: {
              'ui:title': 'Query',
              'ui:description':
                'The `promQL` query to be run against Prometheus. If the chart `type` is `SingleStat`, this query should only return\na single timeseries. For other types, a top 7 is displayed.\nYou can use `$METRIC` to refer to the metric defined in this resource. For example: `sum(rate($METRIC[2m]))`.\nTo learn more about `promQL`, refer to the Prometheus documentation: https://prometheus.io/docs/prometheus/latest/querying/basics/'
            },
            legend: {
              'ui:title': 'Legend',
              'ui:description':
                'The query legend that applies to each timeseries represented in this chart. When multiple timeseries are displayed, you should set a legend\nthat distinguishes each of them. It can be done with the following format: `{{ Label }}`. For example, if the `promQL` groups timeseries per\nlabel such as: `sum(rate($METRIC[2m])) by (Label1, Label2)`, you may write as the legend: `Label1={{ Label1 }}, Label2={{ Label2 }}`.'
            },
            top: {
              'ui:title': 'Top',
              'ui:description': 'Top N series to display per timestamp. Does not apply to `SingleStat` chart type.'
            },
            'ui:order': ['promQL', 'legend', 'top']
          }
        },
        'ui:order': ['dashboardName', 'sectionName', 'title', 'unit', 'type', 'queries']
      }
    },
    'ui:order': [
      'metricName',
      'type',
      'buckets',
      'valueField',
      'divider',
      'flatten',
      'remap',
      'direction',
      'labels',
      'filters',
      'charts'
    ]
  },
  'ui:order': ['metadata', 'spec', '*']
};
