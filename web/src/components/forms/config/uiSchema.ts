import { UiSchema } from '@rjsf/utils';

export const FlowCollectorUISchema: UiSchema = {
  metadata: {
    namespace: {
      'ui:widget': 'hidden',
      'ui:options': {
        label: false
      }
    },
    name: {
      'ui:title': 'Name',
      'ui:widget': 'TextWidget'
    },
    labels: {
      'ui:title': 'Labels',
      'ui:field': 'LabelsField'
    },
    'ui:options': {
      label: false
    },
    'ui:order': ['name', 'labels', '*']
  },
  spec: {
    namespace: {
      'ui:title': 'Namespace',
    },
    deploymentModel: {
      'ui:description': 'defines the desired type of deployment for flow processing.',
      'ui:title': 'Deployment model',
    },
    kafka: {
      'ui:description': 'to use Kafka as a broker as part of the flow collection pipeline.',
      'ui:title': 'Kafka configuration',
      'ui:dependency': {
        controlFieldPath: ['deploymentModel'],
        controlFieldValue: 'Kafka',
        controlFieldName: 'deploymentModel'
      },
      address: {
        'ui:title': 'Address',
      },
      topic: {
        'ui:title': 'Topic',
      },
      tls: {
        'ui:title': 'TLS configuration',
        enable: {
        },
        insecureSkipVerify: {
          'ui:title': 'Insecure',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
        },
        userCert: {
          'ui:title': 'User certificate when using mTLS',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        caCert: {
          'ui:title': 'CA certificate',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        'ui:order': ['enable', 'insecureSkipVerify', 'userCert', 'caCert']
      },
      sasl: {
        'ui:widget': 'hidden',
        'ui:order': ['clientIDReference', 'clientSecretReference', 'type'],
        clientIDReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        clientSecretReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        }
      },
      'ui:order': ['address', 'topic', 'tls', 'sasl']
    },
    agent: {
      'ui:description': 'for flows extraction.',
      'ui:title': 'Agent configuration',
      type: {
        'ui:widget': 'hidden',
      },
      ipfix: {
        'ui:widget': 'hidden',
      },
      ebpf: {
        'ui:title': 'eBPF Agent configuration',
        'ui:description': 'Settings related to the eBPF-based flow reporter.',
        'ui:dependency': {
          controlFieldPath: ['agent', 'type'],
          controlFieldValue: 'eBPF',
          controlFieldName: 'type'
        },
        sampling: {
          'ui:title': 'Sampling',
        },
        privileged: {
          'ui:title': 'Privileged mode',
        },
        features: {
          'ui:title': 'Features',
        },
        flowFilter: {
          'ui:title': 'Filters',
          enable: {
            'ui:title': 'Enable flow filtering',
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
        },
        excludeInterfaces: {
          'ui:title': 'Exclude interfaces',
        },
        logLevel: {
          'ui:title': 'Log level',
        },
        imagePullPolicy: {
          'ui:title': 'Image pull policy',
        },
        metrics: {
          enable: {
            'ui:widget': 'hidden',
          },
          'ui:title': 'Metrics',
          disableAlerts: {
            'ui:title': 'Disable alerts',
          },
          server: {
            'ui:title': 'Server',
            port: {
              'ui:title': 'Port',
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
        },
        cacheActiveTimeout: {
          'ui:title': 'Cache active timeout',
        },
        kafkaBatchSize: {
          'ui:title': 'Kafka batch size',
          'ui:dependency': {
            controlFieldPath: ['deploymentModel'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'deploymentModel'
          },
        },
        resources: {
          'ui:title': 'Resource Requirements',
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
        'of the component that receives the flows from the agent, enriches them, generates metrics, and forwards them to the Loki persistence layer and/or any available exporter.',
      filters: {
        'ui:title': 'Filters',
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
      },
      clusterName: {
        'ui:title': 'Cluster name',
        'ui:dependency': {
          controlFieldPath: ['processor', 'multiClusterDeployment'],
          controlFieldValue: 'true',
          controlFieldName: 'multiClusterDeployment'
        },
      },
      addZone: {
        'ui:title': 'Availability zones',
      },
      subnetLabels: {
        openShiftAutoDetect: {
          'ui:widget': 'hidden',
        },
        'ui:title': 'Subnet labels',
        customLabels: {
          'ui:title': 'Custom labels',
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
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
      },
      deduper: {
        'ui:title': 'Deduper',
        mode: {
          'ui:title': 'Mode',
        },
        sampling: {
          'ui:title': 'Sampling',
        },
        'ui:order': ['mode', 'sampling']
      },
      kafkaConsumerQueueCapacity: {
        'ui:title': 'Kafka consumer queue capacity',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
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
        },
      },
      kafkaConsumerBatchSize: {
        'ui:title': 'Kafka consumer batch size',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
      },
      metrics: {
        'ui:title': 'Metrics configuration',
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
              },
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
            'ui:title': 'Port',
          },
          'ui:order': ['tls', 'port']
        },
        disableAlerts: {
          'ui:title': 'Disable alerts',
        },
        includeList: {
          'ui:title': 'Include list',
        },
        'ui:order': ['server', 'disableAlerts', 'includeList']
      },
      resources: {
        'ui:title': 'Resource Requirements',
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
        ],
        scheduling: {
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
        }
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
      querier: {
        'ui:title': 'Querier',
        enable: {
          'ui:title': 'Use Prometheus storage',
        },
        manual: {
          'ui:title': 'Manual',
          forwardUserToken: {
            'ui:title': 'Forward user token',
          },
          url: {
            'ui:title': 'Url',
          },
          'ui:order': ['forwardUserToken', 'url', 'tls'],
          tls: {
            'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
            caCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            }
          }
        },
        mode: {
          'ui:title': 'Mode',
        },
        timeout: {
          'ui:title': 'Timeout',
        },
        'ui:order': ['mode', 'enable', 'manual', 'timeout']
      }
    },
    loki: {
      'ui:title': 'Loki client settings',
      'ui:description': 'for the flow store.',
      enable: {
        'ui:title': 'Use Loki storage',
      },
      mode: {
        'ui:title': 'Mode',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      manual: {
        'ui:title': 'Manual',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Manual',
          controlFieldName: 'mode'
        },
        authToken: {
          'ui:title': 'Auth token',
        },
        ingesterUrl: {
          'ui:title': 'Ingester url',
        },
        querierUrl: {
          'ui:title': 'Querier url',
        },
        statusUrl: {
          'ui:title': 'Status url',
        },
        tenantID: {
          'ui:title': 'Tenant id',
        },
        'ui:order': ['authToken', 'ingesterUrl', 'querierUrl', 'statusUrl', 'tenantID', 'statusTls', 'tls'],
        statusTls: {
          'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
          caCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          }
        },
        tls: {
          'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
          caCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          }
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
          'ui:title': 'Tenant id',
        },
        url: {
          'ui:title': 'Url',
        },
        'ui:order': ['tenantID', 'url', 'tls'],
        tls: {
          'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
          caCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          }
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
          'ui:title': 'Ingester url',
        },
        querierUrl: {
          'ui:title': 'Querier url',
        },
        tenantID: {
          'ui:title': 'Tenant id',
        },
        'ui:order': ['ingesterUrl', 'querierUrl', 'tenantID', 'tls'],
        tls: {
          'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
          caCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          },
          userCert: {
            'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
          }
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
          'ui:title': 'Name',
        },
        namespace: {
          'ui:title': 'Namespace',
        },
        'ui:order': ['name', 'namespace']
      },
      readTimeout: {
        'ui:title': 'Read timeout',
      },
      writeTimeout: {
        'ui:title': 'Write timeout',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      writeBatchWait: {
        'ui:title': 'Write batch wait',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      writeBatchSize: {
        'ui:title': 'Write batch size',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      advanced: {
        'ui:title': 'Advanced configuration',
        'ui:order': ['staticLabels', 'writeMaxBackoff', 'writeMaxRetries', 'writeMinBackoff']
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
        'advanced',
      ],
    },
    consolePlugin: {
      'ui:title': 'Console plugin configuration',
      'ui:description': 'related to the OpenShift Console integration.',
      enable: {
        'ui:title': 'Deploy console plugin',
      },
      logLevel: {
        'ui:title': 'Log level',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      portNaming: {
        'ui:title': 'Port naming',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        enable: {
          'ui:title': 'Enable',
        },
        portNames: {
          'ui:title': 'Port names',
        },
        'ui:order': ['enable', 'portNames']
      },
      resources: {
        'ui:title': 'Resource Requirements',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:order': ['claims', 'limits', 'requests'],
        claims: {
          items: {
            'ui:order': ['name', 'request']
          }
        }
      },
      quickFilters: {
        'ui:title': 'Quick filters',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        items: {
          'ui:order': ['filter', 'name', 'default']
        }
      },
      replicas: {
        'ui:title': 'Replicas',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
      },
      autoscaler: {
        'ui:title': 'Horizontal pod autoscaler',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
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
      advanced: {
        'ui:title': 'Advanced configuration',
        'ui:order': ['args', 'env', 'port', 'register', 'scheduling'],
        scheduling: {
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
      enable: {
        'ui:title': 'Deploy policies',
      },
      additionalNamespaces: {
        'ui:title': 'Additional namespaces',
      },
      'ui:order': ['enable', 'additionalNamespaces']
    },
    exporters: {
      'ui:description': 'additional optional exporters for custom consumption or storage.',
      'ui:title': 'Exporters',
      items: {
        type: {
          'ui:title': 'Type',
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
          'ui:order': ['address', 'topic', 'sasl', 'tls'],
          sasl: {
            'ui:order': ['clientIDReference', 'clientSecretReference', 'type'],
            clientIDReference: {
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            clientSecretReference: {
              'ui:order': ['file', 'name', 'namespace', 'type']
            }
          },
          tls: {
            'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
            caCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            }
          }
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
            'ui:order': ['caCert', 'enable', 'insecureSkipVerify', 'userCert'],
            caCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            userCert: {
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            }
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
    ],
    'ui:options': {
      label: false
    },
    'ui:advanced': ['exporters']
  },
  'ui:order': ['metadata', 'spec', '*']
};

export const FlowMetricUISchema: UiSchema = {};