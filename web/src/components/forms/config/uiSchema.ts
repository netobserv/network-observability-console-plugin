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
      'ui:sortOrder': 92
    },
    deploymentModel: {
      'ui:description': 'defines the desired type of deployment for flow processing.',
      'ui:title': 'Deployment model',
      'ui:sortOrder': 1
    },
    kafka: {
      'ui:description': 'to use Kafka as a broker as part of the flow collection pipeline.',
      'ui:title': 'Kafka configuration',
      'ui:dependency': {
        controlFieldPath: ['deploymentModel'],
        controlFieldValue: 'Kafka',
        controlFieldName: 'deploymentModel'
      },
      'ui:sortOrder': 16,
      tls: {
        'ui:title': 'TLS configuration',
        'ui:sortOrder': 17,
        enable: {
          'ui:sortOrder': 18
        },
        insecureSkipVerify: {
          'ui:title': 'Insecure',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
          'ui:sortOrder': 19
        },
        userCert: {
          'ui:title': 'User certificate when using mTLS',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
          'ui:sortOrder': 20,
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        caCert: {
          'ui:title': 'CA certificate',
          'ui:dependency': {
            controlFieldPath: ['kafka', 'tls', 'enable'],
            controlFieldValue: 'true',
            controlFieldName: 'enable'
          },
          'ui:sortOrder': 21,
          'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
        },
        'ui:order': ['enable', 'insecureSkipVerify', 'userCert', 'caCert']
      },
      sasl: {
        'ui:widget': 'hidden',
        'ui:sortOrder': 22,
        'ui:order': ['clientIDReference', 'clientSecretReference', 'type'],
        clientIDReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        },
        clientSecretReference: {
          'ui:order': ['file', 'name', 'namespace', 'type']
        }
      },
      address: {
        'ui:title': 'Address',
        'ui:sortOrder': 77
      },
      topic: {
        'ui:title': 'Topic',
        'ui:sortOrder': 78
      },
      'ui:order': ['address', 'topic', 'tls', 'sasl']
    },
    agent: {
      'ui:description': 'for flows extraction.',
      'ui:title': 'Agent configuration',
      'ui:sortOrder': 2,
      type: {
        'ui:widget': 'hidden',
        'ui:sortOrder': 3
      },
      ipfix: {
        'ui:widget': 'hidden',
        'ui:sortOrder': 4,
        'ui:order': [
          'cacheActiveTimeout',
          'cacheMaxFlows',
          'clusterNetworkOperator',
          'forceSampleAll',
          'ovnKubernetes',
          'sampling'
        ],
        ovnKubernetes: {
          'ui:order': ['containerName', 'daemonSetName', 'namespace']
        }
      },
      ebpf: {
        'ui:title': 'eBPF Agent configuration',
        'ui:description': 'Settings related to the eBPF-based flow reporter.',
        sampling: {
          'ui:title': 'Sampling',
          'ui:sortOrder': 74
        },
        privileged: {
          'ui:title': 'Privileged mode',
          'ui:sortOrder': 6
        },
        features: {
          'ui:title': 'Features',
          'ui:sortOrder': 68
        },
        flowFilter: {
          'ui:title': 'Filters',
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
          'ui:sortOrder': 14,
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
          'ui:sortOrder': 69
        },
        excludeInterfaces: {
          'ui:title': 'Exclude interfaces',
          'ui:sortOrder': 67
        },
        logLevel: {
          'ui:title': 'Log level',
          'ui:sortOrder': 10
        },
        imagePullPolicy: {
          'ui:title': 'Image pull policy',
          'ui:sortOrder': 11
        },
        metrics: {
          enable: {
            'ui:widget': 'hidden',
            'ui:sortOrder': 15
          },
          'ui:title': 'Metrics',
          'ui:sortOrder': 70,
          disableAlerts: {
            'ui:title': 'Disable alerts',
            'ui:sortOrder': 71
          },
          server: {
            'ui:title': 'Server',
            'ui:sortOrder': 72,
            port: {
              'ui:title': 'Port',
              'ui:sortOrder': 73
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
          'ui:sortOrder': 8
        },
        cacheActiveTimeout: {
          'ui:title': 'Cache active timeout',
          'ui:sortOrder': 7
        },
        kafkaBatchSize: {
          'ui:title': 'Kafka batch size',
          'ui:dependency': {
            controlFieldPath: ['deploymentModel'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'deploymentModel'
          },
          'ui:sortOrder': 9
        },
        resources: {
          'ui:title': 'Resource Requirements',
          'ui:sortOrder': 12,
          'ui:order': ['claims', 'limits', 'requests'],
          claims: {
            items: {
              'ui:order': ['name', 'request']
            }
          }
        },
        'ui:sortOrder': 5,
        'ui:dependency': {
          controlFieldPath: ['agent', 'type'],
          controlFieldValue: 'eBPF',
          controlFieldName: 'type'
        },
        advanced: {
          'ui:widget': 'hidden',
          'ui:sortOrder': 13,
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
      logLevel: {
        'ui:title': 'Log level',
        'ui:sortOrder': 39
      },
      advanced: {
        'ui:widget': 'hidden',
        'ui:sortOrder': 27,
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
      metrics: {
        'ui:title': 'Metrics configuration',
        'ui:sortOrder': 28,
        server: {
          'ui:title': 'Server configuration',
          'ui:sortOrder': 29,
          tls: {
            'ui:title': 'TLS configuration',
            'ui:sortOrder': 30,
            insecureSkipVerify: {
              'ui:title': 'Insecure',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              },
              'ui:sortOrder': 31
            },
            provided: {
              'ui:title': 'Cert',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              },
              'ui:sortOrder': 32,
              'ui:order': ['certFile', 'certKey', 'name', 'namespace', 'type']
            },
            providedCaFile: {
              'ui:title': 'CA',
              'ui:dependency': {
                controlFieldPath: ['processor', 'metrics', 'server', 'tls', 'type'],
                controlFieldValue: 'Provided',
                controlFieldName: 'type'
              },
              'ui:sortOrder': 33,
              'ui:order': ['file', 'name', 'namespace', 'type']
            },
            'ui:order': ['type', 'insecureSkipVerify', 'provided', 'providedCaFile']
          },
          port: {
            'ui:title': 'Port',
            'ui:sortOrder': 103
          },
          'ui:order': ['tls', 'port']
        },
        disableAlerts: {
          'ui:title': 'Disable alerts',
          'ui:sortOrder': 101
        },
        includeList: {
          'ui:title': 'Include list',
          'ui:sortOrder': 102
        },
        'ui:order': ['server', 'disableAlerts', 'includeList']
      },
      resources: {
        'ui:title': 'Resource Requirements',
        'ui:sortOrder': 41,
        'ui:order': ['claims', 'limits', 'requests'],
        claims: {
          items: {
            'ui:order': ['name', 'request']
          }
        }
      },
      clusterName: {
        'ui:title': 'Cluster name',
        'ui:dependency': {
          controlFieldPath: ['processor', 'multiClusterDeployment'],
          controlFieldValue: 'true',
          controlFieldName: 'multiClusterDeployment'
        },
        'ui:sortOrder': 25
      },
      multiClusterDeployment: {
        'ui:title': 'Multi-cluster deployment',
        'ui:sortOrder': 24
      },
      'ui:advanced': [
        'multiClusterDeployment',
        'clusterName',
        'kafkaConsumerReplicas',
        'kafkaConsumerAutoscaler',
        'kafkaConsumerQueueCapacity',
        'kafkaConsumerBatchSize',
        'logLevel',
        'imagePullPolicy'
      ],
      'ui:sortOrder': 23,
      deduper: {
        'ui:title': 'Deduper',
        'ui:sortOrder': 96,
        mode: {
          'ui:title': 'Mode',
          'ui:sortOrder': 97
        },
        sampling: {
          'ui:title': 'Sampling',
          'ui:sortOrder': 98
        },
        'ui:order': ['mode', 'sampling']
      },
      addZone: {
        'ui:title': 'Availability zones',
        'ui:sortOrder': 26
      },
      kafkaConsumerQueueCapacity: {
        'ui:title': 'Kafka consumer queue capacity',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
        'ui:sortOrder': 36
      },
      'ui:title': 'Processor configuration',
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
        'ui:sortOrder': 40
      },
      kafkaConsumerAutoscaler: {
        'ui:title': 'kafka consumer autoscaler',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
        'ui:sortOrder': 35,
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
      logTypes: {
        'ui:title': 'Log types',
        'ui:sortOrder': 100
      },
      'ui:description':
        'of the component that receives the flows from the agent, enriches them, generates metrics, and forwards them to the Loki persistence layer and/or any available exporter.',
      kafkaConsumerReplicas: {
        'ui:title': 'Kafka consumer replicas',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
        'ui:sortOrder': 34
      },
      filters: {
        'ui:title': 'Filters',
        'ui:sortOrder': 99,
        items: {
          'ui:order': ['allOf', 'outputTarget', 'sampling'],
          allOf: {
            items: {
              'ui:order': ['field', 'matchType', 'value']
            }
          }
        }
      },
      subnetLabels: {
        openShiftAutoDetect: {
          'ui:widget': 'hidden',
          'ui:sortOrder': 38
        },
        'ui:title': 'Subnet labels',
        'ui:sortOrder': 104,
        customLabels: {
          'ui:title': 'Custom labels',
          'ui:sortOrder': 105,
          items: {
            'ui:order': ['cidrs', 'name']
          }
        },
        'ui:order': ['openShiftAutoDetect', 'customLabels']
      },
      kafkaConsumerBatchSize: {
        'ui:title': 'Kafka consumer batch size',
        'ui:dependency': {
          controlFieldPath: ['deploymentModel'],
          controlFieldValue: 'Kafka',
          controlFieldName: 'deploymentModel'
        },
        'ui:sortOrder': 37
      },
      'ui:order': [
        'addZone',
        'advanced',
        'metrics',
        'kafkaConsumerReplicas',
        'kafkaConsumerAutoscaler',
        'kafkaConsumerQueueCapacity',
        'kafkaConsumerBatchSize',
        'logLevel',
        'imagePullPolicy',
        'resources',
        'deduper',
        'filters',
        'logTypes',
        'subnetLabels',
        'multiClusterDeployment',
        'clusterName'
      ]
    },
    prometheus: {
      'ui:title': 'Prometheus',
      'ui:sortOrder': 106,
      querier: {
        'ui:title': 'Querier',
        'ui:sortOrder': 107,
        enable: {
          'ui:title': 'Enable',
          'ui:sortOrder': 108
        },
        manual: {
          'ui:title': 'Manual',
          'ui:sortOrder': 109,
          forwardUserToken: {
            'ui:title': 'Forward user token',
            'ui:sortOrder': 110
          },
          url: {
            'ui:title': 'Url',
            'ui:sortOrder': 111
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
          'ui:sortOrder': 112
        },
        timeout: {
          'ui:title': 'Timeout',
          'ui:sortOrder': 113
        },
        'ui:order': ['mode', 'enable', 'manual', 'timeout']
      }
    },
    loki: {
      advanced: {
        'ui:widget': 'hidden',
        'ui:sortOrder': 52,
        'ui:order': ['staticLabels', 'writeMaxBackoff', 'writeMaxRetries', 'writeMinBackoff']
      },
      writeTimeout: {
        'ui:title': 'Write timeout',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 51
      },
      microservices: {
        'ui:title': 'Microservices',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Microservices',
          controlFieldName: 'mode'
        },
        'ui:sortOrder': 47,
        ingesterUrl: {
          'ui:title': 'Ingester url',
          'ui:sortOrder': 86
        },
        querierUrl: {
          'ui:title': 'Querier url',
          'ui:sortOrder': 87
        },
        tenantID: {
          'ui:title': 'Tenant id',
          'ui:sortOrder': 88
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
      enable: {
        'ui:title': 'Enable',
        'ui:sortOrder': 43
      },
      mode: {
        'ui:title': 'Mode',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 44
      },
      manual: {
        'ui:title': 'Manual',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Manual',
          controlFieldName: 'mode'
        },
        'ui:sortOrder': 48,
        authToken: {
          'ui:title': 'Auth token',
          'ui:sortOrder': 81
        },
        ingesterUrl: {
          'ui:title': 'Ingester url',
          'ui:sortOrder': 82
        },
        querierUrl: {
          'ui:title': 'Querier url',
          'ui:sortOrder': 83
        },
        statusUrl: {
          'ui:title': 'Status url',
          'ui:sortOrder': 84
        },
        tenantID: {
          'ui:title': 'Tenant id',
          'ui:sortOrder': 85
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
      lokiStack: {
        'ui:title': 'Loki stack',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'LokiStack',
          controlFieldName: 'mode'
        },
        'ui:sortOrder': 45,
        name: {
          'ui:title': 'Name',
          'ui:sortOrder': 79
        },
        namespace: {
          'ui:title': 'Namespace',
          'ui:sortOrder': 80
        },
        'ui:order': ['name', 'namespace']
      },
      'ui:advanced': ['writeBatchWait', 'writeBatchSize', 'writeTimeout'],
      'ui:sortOrder': 42,
      readTimeout: {
        'ui:title': 'Read timeout',
        'ui:sortOrder': 91
      },
      monolithic: {
        'ui:title': 'Monolithic',
        'ui:dependency': {
          controlFieldPath: ['loki', 'mode'],
          controlFieldValue: 'Monolithic',
          controlFieldName: 'mode'
        },
        'ui:sortOrder': 46,
        tenantID: {
          'ui:title': 'Tenant id',
          'ui:sortOrder': 89
        },
        url: {
          'ui:title': 'Url',
          'ui:sortOrder': 90
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
      writeBatchWait: {
        'ui:title': 'Write batch wait',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 49
      },
      'ui:title': 'Loki client settings',
      'ui:description': 'for the flow store.',
      writeBatchSize: {
        'ui:title': 'Write batch size',
        'ui:dependency': {
          controlFieldPath: ['loki', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 50
      },
      'ui:order': [
        'advanced',
        'readTimeout',
        'enable',
        'writeBatchWait',
        'writeBatchSize',
        'writeTimeout',
        'mode',
        'lokiStack',
        'monolithic',
        'microservices',
        'manual'
      ]
    },
    consolePlugin: {
      'ui:title': 'Console plugin configuration',
      'ui:description': 'related to the OpenShift Console integration.',
      enable: {
        'ui:title': 'Enable',
        'ui:sortOrder': 54
      },
      logLevel: {
        'ui:title': 'Log level',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 59
      },
      imagePullPolicy: {
        'ui:title': 'Image pull policy',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 60
      },
      portNaming: {
        'ui:title': 'Port naming',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 55,
        enable: {
          'ui:title': 'Enable',
          'ui:sortOrder': 75
        },
        portNames: {
          'ui:title': 'Port names',
          'ui:sortOrder': 76
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
        'ui:sortOrder': 61,
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
        'ui:sortOrder': 56,
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
        'ui:sortOrder': 57
      },
      autoscaler: {
        'ui:title': 'Horizontal pod autoscaler',
        'ui:dependency': {
          controlFieldPath: ['consolePlugin', 'enable'],
          controlFieldValue: 'true',
          controlFieldName: 'enable'
        },
        'ui:sortOrder': 58,
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
        'ui:sortOrder': 62,
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
      'ui:sortOrder': 53,
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
      'ui:sortOrder': 93,
      additionalNamespaces: {
        'ui:title': 'Additional namespaces',
        'ui:sortOrder': 94
      },
      enable: {
        'ui:title': 'Enable',
        'ui:sortOrder': 95
      },
      'ui:order': ['additionalNamespaces', 'enable']
    },
    exporters: {
      'ui:description': 'additional optional exporters for custom consumption or storage.',
      'ui:title': 'Exporters',
      'ui:sortOrder': 63,
      items: {
        type: {
          'ui:title': 'Type',
          'ui:sortOrder': 64
        },
        ipfix: {
          'ui:title': 'IPFIX configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'IPFIX',
            controlFieldName: 'type'
          },
          'ui:sortOrder': 65,
          'ui:order': ['targetHost', 'targetPort', 'transport']
        },
        kafka: {
          'ui:title': 'Kafka configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'Kafka',
            controlFieldName: 'type'
          },
          'ui:sortOrder': 66,
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
        'ui:order': ['type', 'ipfix', 'kafka', 'openTelemetry'],
        openTelemetry: {
          'ui:title': 'OpenTelemetry configuration',
          'ui:dependency': {
            controlFieldPath: ['exporters', 'type'],
            controlFieldValue: 'OpenTelemetry',
            controlFieldName: 'type'
          },
          'ui:sortOrder': 67,
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
        }
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
