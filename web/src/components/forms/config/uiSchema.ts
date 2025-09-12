/* eslint-disable max-len */
import { UiSchema } from '@rjsf/utils';

// Keep the UISchemas ordered for form display

export const FlowCollectorUISchema: UiSchema = {
  'ui:title': 'FlowCollector',
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
      'ui:title': 'Deployment model'
    },
    kafka: {
      'ui:title': 'Kafka configuration',
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
        type: {
          'ui:title': 'Type'
        },
        clientIDReference: {
          'ui:title': 'Client ID reference',
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        clientSecretReference: {
          'ui:title': 'Client secret reference',
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        'ui:order': ['type', 'clientIDReference', 'clientSecretReference']
      },
      'ui:order': ['address', 'topic', 'tls', 'sasl']
    },
    agent: {
      'ui:title': 'Agent configuration',
      type: {
        'ui:widget': 'hidden'
      },
      ipfix: {
        'ui:widget': 'hidden'
      },
      ebpf: {
        'ui:title': 'eBPF Agent configuration',
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
          'ui:title': 'Features',
          'ui:widget': 'arrayCheckboxes',
          'ui:descriptionFirst': 'true'
        },
        flowFilter: {
          'ui:title': 'Filters',
          'ui:widget': 'hidden',
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
          'ui:title': 'Interfaces'
        },
        excludeInterfaces: {
          'ui:title': 'Exclude interfaces'
        },
        logLevel: {
          'ui:title': 'Log level'
        },
        imagePullPolicy: {
          'ui:title': 'Image pull policy'
        },
        metrics: {
          'ui:title': 'Metrics',
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
          'ui:title': 'Cache max flows'
        },
        cacheActiveTimeout: {
          'ui:title': 'Cache active timeout'
        },
        kafkaBatchSize: {
          'ui:title': 'Kafka batch size',
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
      filters: {
        'ui:title': 'Filters',
        'ui:widget': 'hidden',
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
        'ui:title': 'Multi-cluster deployment'
      },
      clusterName: {
        'ui:title': 'Cluster name',
        'ui:dependency': {
          controlFieldPath: ['processor', 'multiClusterDeployment'],
          controlFieldValue: 'true',
          controlFieldName: 'multiClusterDeployment'
        }
      },
      addZone: {
        'ui:title': 'Availability zones'
      },
      subnetLabels: {
        'ui:title': 'Subnet labels',
        openShiftAutoDetect: {
          'ui:widget': 'hidden'
        },
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
        'ui:title': 'Log level'
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy'
      },
      deduper: {
        'ui:title': 'Deduper',
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
          'ui:title': 'Disable alerts'
        },
        includeList: {
          'ui:title': 'Include list'
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
        port: {
          'ui:widget': 'hidden'
        },
        conversationTerminatingTimeout: {
          'ui:widget': 'hidden'
        },
        conversationEndTimeout: {
          'ui:widget': 'hidden'
        },
        profilePort: {
          'ui:widget': 'hidden'
        },
        env: {
          'ui:widget': 'hidden'
        },
        enableKubeProbes: {
          'ui:widget': 'hidden'
        },
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
          'ui:title': 'Secondary networks',
          items: {
            name: {
              'ui:title': 'Name'
            },
            index: {
              'ui:title': 'Index',
              'ui:widget': 'arrayCheckboxes'
            },
            'ui:order': ['name', 'index']
          }
        },
        healthPort: {
          'ui:widget': 'hidden'
        },
        dropUnusedFields: {
          'ui:widget': 'hidden'
        },
        conversationHeartbeatInterval: {
          'ui:widget': 'hidden'
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
          'ui:title': 'Use Prometheus storage'
        },
        mode: {
          'ui:title': 'Mode'
        },
        manual: {
          'ui:title': 'Manual',
          'ui:flat': 'true',
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
          'ui:title': 'Timeout'
        },
        'ui:order': ['enable', 'mode', 'manual', 'timeout']
      }
    },
    loki: {
      'ui:title': 'Loki client settings',
      enable: {
        'ui:title': 'Use Loki storage'
      },
      clientType: {
        'ui:title': 'Client type',
        'ui:description': 'Protocol to use for sending flows to Loki: http or grpc. gRPC may provide better performance for high-throughput scenarios.'
      },
      grpcConfig: {
        'ui:title': 'gRPC configuration',
        'ui:description': 'gRPC-specific configuration for the Loki writer. Only used when clientType is set to grpc.',
        'ui:dependency': {
          controlFieldPath: ['loki', 'clientType'],
          controlFieldValue: 'grpc',
          controlFieldName: 'clientType'
        },
        keepAlive: {
          'ui:title': 'Keep alive',
          'ui:description': 'gRPC keep-alive interval'
        },
        keepAliveTimeout: {
          'ui:title': 'Keep alive timeout',
          'ui:description': 'gRPC keep-alive timeout'
        },
        maxRecvMsgSize: {
          'ui:title': 'Max receive message size',
          'ui:description': 'Maximum message size in bytes the gRPC client can receive'
        },
        maxSendMsgSize: {
          'ui:title': 'Max send message size',
          'ui:description': 'Maximum message size in bytes the gRPC client can send'
        },
        useStreaming: {
          'ui:title': 'Use streaming',
          'ui:description': 'Enable streaming mode for real-time log pushing when using gRPC'
        },
        'ui:order': ['keepAlive', 'keepAliveTimeout', 'maxRecvMsgSize', 'maxSendMsgSize', 'useStreaming']
      },
      mode: {
        'ui:title': 'Mode'
      },
      manual: {
        'ui:title': 'Manual',
        'ui:flat': 'true',
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
        'ui:flat': 'true',
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
        'ui:flat': 'true',
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
        'ui:flat': 'true',
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
        'ui:widget': 'hidden'
      },
      writeTimeout: {
        'ui:title': 'Write timeout',
        'ui:widget': 'hidden'
      },
      writeBatchWait: {
        'ui:title': 'Write batch wait',
        'ui:widget': 'hidden'
      },
      writeBatchSize: {
        'ui:title': 'Write batch size',
        'ui:widget': 'hidden'
      },
      advanced: {
        'ui:title': 'Advanced configuration',
        'ui:widget': 'hidden',
        staticLabels: {
          'ui:title': 'Static labels'
        },
        writeMaxRetries: {
          'ui:title': 'Write max retries'
        },
        writeMaxBackoff: {
          'ui:title': 'Write max backoff'
        },
        writeMinBackoff: {
          'ui:title': 'Write min backoff'
        },
        'ui:order': ['staticLabels', 'writeMaxRetries', 'writeMaxBackoff', 'writeMinBackoff']
      },
      'ui:order': [
        'enable',
        'clientType',
        'grpcConfig',
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
      enable: {
        'ui:title': 'Deploy console plugin'
      },
      logLevel: {
        'ui:title': 'Log level'
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy'
      },
      portNaming: {
        'ui:title': 'Port naming',
        'ui:widget': 'hidden',
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
        'ui:widget': 'hidden',
        items: {
          'ui:order': ['filter', 'name', 'default']
        }
      },
      replicas: {
        'ui:title': 'Replicas'
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
        'ui:widget': 'hidden',
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
      enable: {
        'ui:title': 'Deploy policies'
      },
      additionalNamespaces: {
        'ui:title': 'Additional namespaces',
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
      items: {
        type: {
          'ui:title': 'Type'
        },
        ipfix: {
          'ui:title': 'IPFIX configuration',
          'ui:flat': 'true',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'IPFIX',
            controlFieldName: 'type'
          },
          targetHost: {
            'ui:title': 'Target host'
          },
          targetPort: {
            'ui:title': 'Target port'
          },
          transport: {
            'ui:title': 'Transport'
          },
          'ui:order': ['targetHost', 'targetPort', 'transport']
        },
        kafka: {
          'ui:title': 'Kafka configuration',
          'ui:flat': 'true',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'type'
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
            type: {
              'ui:title': 'Type'
            },
            clientIDReference: {
              'ui:title': 'Client ID reference',
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            clientSecretReference: {
              'ui:title': 'Client secret reference',
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            'ui:order': ['type', 'clientIDReference', 'clientSecretReference']
          },
          'ui:order': ['address', 'topic', 'tls', 'sasl']
        },
        openTelemetry: {
          'ui:title': 'OpenTelemetry configuration',
          'ui:flat': 'true',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'OpenTelemetry',
            controlFieldName: 'type'
          },
          targetHost: {
            'ui:title': 'Target host'
          },
          targetPort: {
            'ui:title': 'Target port'
          },
          protocol: {
            'ui:title': 'Protocol'
          },
          fieldsMapping: {
            'ui:title': 'Fields mapping',
            items: {
              input: {
                'ui:title': 'Input field'
              },
              multiplier: {
                'ui:title': 'Multiplier'
              },
              output: {
                'ui:title': 'Output field'
              },
              'ui:order': ['input', 'multiplier', 'output']
            }
          },
          metrics: {
            'ui:title': 'Metrics',
            enable: {
              'ui:title': 'Enable'
            },
            pushTimeInterval: {
              'ui:title': 'Push time interval'
            },
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
          },
          'ui:order': ['targetHost', 'targetPort', 'protocol', 'fieldsMapping', 'headers', 'logs', 'metrics', 'tls']
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
      'ui:title': 'Metric name'
    },
    type: {
      'ui:title': 'Type'
    },
    buckets: {
      'ui:title': 'Buckets',
      'ui:dependency': {
        controlFieldPath: ['type'],
        controlFieldValue: 'Histogram',
        controlFieldName: 'type'
      }
    },
    valueField: {
      'ui:title': 'Value field'
    },
    divider: {
      'ui:title': 'Divider'
    },
    labels: {
      'ui:title': 'Labels'
    },
    flatten: {
      'ui:title': 'Flatten'
    },
    remap: {
      'ui:title': 'Remap',
      'ui:widget': 'map'
    },
    direction: {
      'ui:title': 'Direction'
    },
    filters: {
      'ui:title': 'Filters',
      items: {
        field: {
          'ui:title': 'Field'
        },
        matchType: {
          'ui:title': 'Match type'
        },
        value: {
          'ui:title': 'Value'
        },
        'ui:order': ['field', 'matchType', 'value']
      }
    },
    charts: {
      'ui:title': 'Charts',
      items: {
        dashboardName: {
          'ui:title': 'Dashboard name'
        },
        sectionName: {
          'ui:title': 'Section name'
        },
        title: {
          'ui:title': 'Title'
        },
        unit: {
          'ui:title': 'Unit'
        },
        type: {
          'ui:title': 'Type'
        },
        queries: {
          'ui:title': 'Queries',
          items: {
            promQL: {
              'ui:title': 'Query'
            },
            legend: {
              'ui:title': 'Legend'
            },
            top: {
              'ui:title': 'Top'
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
