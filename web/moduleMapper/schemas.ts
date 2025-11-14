// File only used in tests or dev console

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */
import { RJSFSchema } from '@rjsf/utils';

// flowCollectorSchema is only used in tests or dev console
export const flowCollectorSchema: RJSFSchema | any = {
  title: 'FlowCollector',
  description:
    'The schema for the network flows collection API, which pilots and configures the underlying deployments.',
  type: 'object',
  properties: {
    apiVersion: {
      type: 'string',
      description:
        'APIVersion defines the versioned schema of this representation of an object.\nServers should convert recognized schemas to the latest internal value, and\nmay reject unrecognized values.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources'
    },
    kind: {
      type: 'string',
      description:
        'Kind is a string value representing the REST resource this object represents.\nServers may infer this from the endpoint the client submits requests to.\nCannot be updated.\nIn CamelCase.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds'
    },
    metadata: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string'
        },
        name: {
          type: 'string',
          default: 'cluster'
        },
        labels: {
          type: 'object',
          properties: {},
          additionalProperties: {
            type: 'string'
          }
        }
      },
      required: ['name']
    },
    spec: {
      type: 'object',
      description:
        'Defines the desired state of the FlowCollector resource.\n\n*: the mention of "unsupported" or "deprecated" for a feature throughout this document means that this feature\nis not officially supported by Red Hat. It might have been, for example, contributed by the community\nand accepted without a formal agreement for maintenance. The product maintainers might provide some support\nfor these features as a best effort only.',
      properties: {
        namespace: {
          description: 'Namespace where network observability pods are deployed.',
          type: 'string',
          default: 'netobserv',
          format: 'k8s-name'
        },
        deploymentModel: {
          description:
            '`deploymentModel` defines the desired type of deployment for flow processing. Possible values are:\n - `Direct` (default) to make the flow processor listen directly from the agents using the host network, backed by a DaemonSet.\n - `Service` to make the flow processor listen as a Kubernetes Service, backed by a scalable Deployment.\n - `Kafka` to make flows sent to a Kafka pipeline before consumption by the processor.\n Kafka can provide better scalability, resiliency, and high availability (for more details, see https://www.redhat.com/en/topics/integration/what-is-apache-kafka).<br> `Direct` is not recommended on large clusters as it is less memory efficient.',
          type: 'string',
          default: 'Direct',
          enum: ['Direct', 'Service', 'Kafka']
        },
        kafka: {
          description:
            'Kafka configuration, allowing to use Kafka as a broker as part of the flow collection pipeline. Available when the `spec.deploymentModel` is `Kafka`.',
          type: 'object',
          required: ['address', 'topic'],
          properties: {
            address: {
              description: 'Address of the Kafka server',
              type: 'string',
              default: ''
            },
            sasl: {
              description: 'SASL authentication configuration. [Unsupported (*)].',
              type: 'object',
              properties: {
                clientIDReference: {
                  description: 'Reference to the secret or config map containing the client ID',
                  type: 'object',
                  properties: {
                    file: {
                      description: 'File name within the config map or secret.',
                      type: 'string'
                    },
                    name: {
                      description: 'Name of the config map or secret containing the file.',
                      type: 'string'
                    },
                    namespace: {
                      description:
                        'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                      type: 'string',
                      default: ''
                    },
                    type: {
                      description: 'Type for the file reference: `configmap` or `secret`.',
                      type: 'string',
                      enum: ['configmap', 'secret']
                    }
                  }
                },
                clientSecretReference: {
                  description: 'Reference to the secret or config map containing the client secret',
                  type: 'object',
                  properties: {
                    file: {
                      description: 'File name within the config map or secret.',
                      type: 'string'
                    },
                    name: {
                      description: 'Name of the config map or secret containing the file.',
                      type: 'string'
                    },
                    namespace: {
                      description:
                        'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                      type: 'string',
                      default: ''
                    },
                    type: {
                      description: 'Type for the file reference: `configmap` or `secret`.',
                      type: 'string',
                      enum: ['configmap', 'secret']
                    }
                  }
                },
                type: {
                  description: 'Type of SASL authentication to use, or `Disabled` if SASL is not used',
                  type: 'string',
                  default: 'Disabled',
                  enum: ['Disabled', 'Plain', 'ScramSHA512']
                }
              }
            },
            tls: {
              description:
                'TLS client configuration. When using TLS, verify that the address matches the Kafka port used for TLS, generally 9093.',
              type: 'object',
              properties: {
                caCert: {
                  description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                  type: 'object',
                  properties: {
                    certFile: {
                      description:
                        '`certFile` defines the path to the certificate file name within the config map or secret.',
                      type: 'string'
                    },
                    certKey: {
                      description:
                        '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                      type: 'string'
                    },
                    name: {
                      description: 'Name of the config map or secret containing certificates.',
                      type: 'string'
                    },
                    namespace: {
                      description:
                        'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                      type: 'string',
                      default: ''
                    },
                    type: {
                      description: 'Type for the certificate reference: `configmap` or `secret`.',
                      type: 'string',
                      enum: ['configmap', 'secret']
                    }
                  }
                },
                enable: {
                  description: 'Enable TLS',
                  type: 'boolean',
                  default: false
                },
                insecureSkipVerify: {
                  description:
                    '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                  type: 'boolean',
                  default: false
                },
                userCert: {
                  description:
                    '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                  type: 'object',
                  properties: {
                    certFile: {
                      description:
                        '`certFile` defines the path to the certificate file name within the config map or secret.',
                      type: 'string'
                    },
                    certKey: {
                      description:
                        '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                      type: 'string'
                    },
                    name: {
                      description: 'Name of the config map or secret containing certificates.',
                      type: 'string'
                    },
                    namespace: {
                      description:
                        'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                      type: 'string',
                      default: ''
                    },
                    type: {
                      description: 'Type for the certificate reference: `configmap` or `secret`.',
                      type: 'string',
                      enum: ['configmap', 'secret']
                    }
                  }
                }
              }
            },
            topic: {
              description: 'Kafka topic to use. It must exist. network observability does not create it.',
              type: 'string',
              default: ''
            }
          }
        },
        agent: {
          description: 'Agent configuration for flows extraction.',
          type: 'object',
          properties: {
            ebpf: {
              description:
                '`ebpf` describes the settings related to the eBPF-based flow reporter when `spec.agent.type`\nis set to `eBPF`.',
              type: 'object',
              properties: {
                sampling: {
                  description:
                    'Sampling interval of the flow reporter. 100 means one flow on 100 is sent. 0 or 1 means all flows are sampled.',
                  type: 'integer',
                  format: 'int32',
                  default: 50,
                  minimum: 0
                },
                privileged: {
                  description:
                    'Privileged mode for the eBPF Agent container. When ignored or set to `false`, the operator sets\ngranular capabilities (BPF, PERFMON, NET_ADMIN, SYS_RESOURCE) to the container.\nIf for some reason these capabilities cannot be set, such as if an old kernel version not knowing CAP_BPF\nis in use, then you can turn on this mode for more global privileges.\nSome agent features require the privileged mode, such as packet drops tracking (see `features`) and SR-IOV support.',
                  type: 'boolean'
                },
                features: {
                  description:
                    'List of additional features to enable. They are all disabled by default. Enabling additional features might have performance impacts. Possible values are:\n- `PacketDrop`: Enable the packets drop flows logging feature. This feature requires mounting\nthe kernel debug filesystem, so the eBPF agent pods must run as privileged.\nIf the `spec.agent.ebpf.privileged` parameter is not set, an error is reported.\n- `DNSTracking`: Enable the DNS tracking feature.\n- `FlowRTT`: Enable flow latency (sRTT) extraction in the eBPF agent from TCP traffic.\n- `NetworkEvents`: Enable the network events monitoring feature, such as correlating flows and network policies.\nThis feature requires mounting the kernel debug filesystem, so the eBPF agent pods must run as privileged.\nIt requires using the OVN-Kubernetes network plugin with the Observability feature.\nIMPORTANT: This feature is available as a Technology Preview.\n- `PacketTranslation`: Enable enriching flows with packet translation information, such as Service NAT.\n- `EbpfManager`: [Unsupported (*)]. Use eBPF Manager to manage network observability eBPF programs. Pre-requisite: the eBPF Manager operator (or upstream bpfman operator) must be installed.\n- `UDNMapping`: [Unsupported (*)]. Enable interfaces mapping to User Defined Networks (UDN). \nThis feature requires mounting the kernel debug filesystem, so the eBPF agent pods must run as privileged.\nIt requires using the OVN-Kubernetes network plugin with the Observability feature.',
                  type: 'array',
                  items: {
                    description:
                      'Agent feature, can be one of:\n- `PacketDrop`, to track packet drops.\n- `DNSTracking`, to track specific information on DNS traffic.\n- `FlowRTT`, to track TCP latency.\n- `NetworkEvents`, to track network events [Technology Preview].\n- `PacketTranslation`, to enrich flows with packets translation information, such as Service NAT.\n- `EbpfManager`, to enable using eBPF Manager to manage network observability eBPF programs. [Unsupported (*)].\n- `UDNMapping`, to enable interfaces mapping to UDN. [Unsupported (*)].',
                    type: 'string',
                    enum: [
                      'PacketDrop',
                      'DNSTracking',
                      'FlowRTT',
                      'NetworkEvents',
                      'PacketTranslation',
                      'EbpfManager',
                      'UDNMapping'
                    ]
                  }
                },
                flowFilter: {
                  description: '`flowFilter` defines the eBPF agent configuration regarding flow filtering.',
                  type: 'object',
                  properties: {
                    enable: {
                      description: 'Set `enable` to `true` to enable the eBPF flow filtering feature.',
                      type: 'boolean'
                    },
                    tcpFlags: {
                      description:
                        '`tcpFlags` optionally defines TCP flags to filter flows by.\nIn addition to the standard flags (RFC-9293), you can also filter by one of the three following combinations: `SYN-ACK`, `FIN-ACK`, and `RST-ACK`.',
                      type: 'string',
                      enum: ['SYN', 'SYN-ACK', 'ACK', 'FIN', 'RST', 'URG', 'ECE', 'CWR', 'FIN-ACK', 'RST-ACK']
                    },
                    sampling: {
                      description:
                        '`sampling` sampling interval for the matched flows, overriding the global sampling defined at `spec.agent.ebpf.sampling`.',
                      type: 'integer',
                      format: 'int32'
                    },
                    peerIP: {
                      description:
                        '`peerIP` optionally defines the remote IP address to filter flows by.\nExample: `10.10.10.10`.',
                      type: 'string'
                    },
                    icmpCode: {
                      description:
                        '`icmpCode`, for Internet Control Message Protocol (ICMP) traffic, optionally defines the ICMP code to filter flows by.',
                      type: 'integer'
                    },
                    pktDrops: {
                      description: '`pktDrops` optionally filters only flows containing packet drops.',
                      type: 'boolean'
                    },
                    destPorts: {
                      description:
                        '`destPorts` optionally defines the destination ports to filter flows by.\nTo filter a single port, set a single port as an integer value. For example, `destPorts: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `destPorts: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                      anyOf: [
                        {
                          type: 'integer'
                        },
                        {
                          type: 'string'
                        }
                      ],
                      'x-kubernetes-int-or-string': true
                    },
                    ports: {
                      description:
                        '`ports` optionally defines the ports to filter flows by. It is used both for source and destination ports.\nTo filter a single port, set a single port as an integer value. For example, `ports: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `ports: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                      anyOf: [
                        {
                          type: 'integer'
                        },
                        {
                          type: 'string'
                        }
                      ],
                      'x-kubernetes-int-or-string': true
                    },
                    cidr: {
                      description:
                        '`cidr` defines the IP CIDR to filter flows by.\nExamples: `10.10.10.0/24` or `100:100:100:100::/64`',
                      type: 'string'
                    },
                    action: {
                      description:
                        '`action` defines the action to perform on the flows that match the filter. The available options are `Accept`, which is the default, and `Reject`.',
                      type: 'string',
                      enum: ['Accept', 'Reject']
                    },
                    peerCIDR: {
                      description:
                        '`peerCIDR` defines the Peer IP CIDR to filter flows by.\nExamples: `10.10.10.0/24` or `100:100:100:100::/64`',
                      type: 'string'
                    },
                    sourcePorts: {
                      description:
                        '`sourcePorts` optionally defines the source ports to filter flows by.\nTo filter a single port, set a single port as an integer value. For example, `sourcePorts: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `sourcePorts: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                      anyOf: [
                        {
                          type: 'integer'
                        },
                        {
                          type: 'string'
                        }
                      ],
                      'x-kubernetes-int-or-string': true
                    },
                    rules: {
                      description:
                        '`rules` defines a list of filtering rules on the eBPF Agents.\nWhen filtering is enabled, by default, flows that don\'t match any rule are rejected.\nTo change the default, you can define a rule that accepts everything: `{ action: "Accept", cidr: "0.0.0.0/0" }`, and then refine with rejecting rules.\n[Unsupported (*)].',
                      type: 'array',
                      maxItems: 16,
                      minItems: 1,
                      items: {
                        description:
                          '`EBPFFlowFilterRule` defines the desired eBPF agent configuration regarding flow filtering rule.',
                        type: 'object',
                        properties: {
                          tcpFlags: {
                            description:
                              '`tcpFlags` optionally defines TCP flags to filter flows by.\nIn addition to the standard flags (RFC-9293), you can also filter by one of the three following combinations: `SYN-ACK`, `FIN-ACK`, and `RST-ACK`.',
                            type: 'string',
                            enum: ['SYN', 'SYN-ACK', 'ACK', 'FIN', 'RST', 'URG', 'ECE', 'CWR', 'FIN-ACK', 'RST-ACK']
                          },
                          sampling: {
                            description:
                              '`sampling` sampling interval for the matched flows, overriding the global sampling defined at `spec.agent.ebpf.sampling`.',
                            type: 'integer',
                            format: 'int32'
                          },
                          peerIP: {
                            description:
                              '`peerIP` optionally defines the remote IP address to filter flows by.\nExample: `10.10.10.10`.',
                            type: 'string'
                          },
                          icmpCode: {
                            description:
                              '`icmpCode`, for Internet Control Message Protocol (ICMP) traffic, optionally defines the ICMP code to filter flows by.',
                            type: 'integer'
                          },
                          pktDrops: {
                            description: '`pktDrops` optionally filters only flows containing packet drops.',
                            type: 'boolean'
                          },
                          destPorts: {
                            description:
                              '`destPorts` optionally defines the destination ports to filter flows by.\nTo filter a single port, set a single port as an integer value. For example, `destPorts: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `destPorts: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                            anyOf: [
                              {
                                type: 'integer'
                              },
                              {
                                type: 'string'
                              }
                            ],
                            'x-kubernetes-int-or-string': true
                          },
                          ports: {
                            description:
                              '`ports` optionally defines the ports to filter flows by. It is used both for source and destination ports.\nTo filter a single port, set a single port as an integer value. For example, `ports: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `ports: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                            anyOf: [
                              {
                                type: 'integer'
                              },
                              {
                                type: 'string'
                              }
                            ],
                            'x-kubernetes-int-or-string': true
                          },
                          cidr: {
                            description:
                              '`cidr` defines the IP CIDR to filter flows by.\nExamples: `10.10.10.0/24` or `100:100:100:100::/64`',
                            type: 'string'
                          },
                          action: {
                            description:
                              '`action` defines the action to perform on the flows that match the filter. The available options are `Accept`, which is the default, and `Reject`.',
                            type: 'string',
                            enum: ['Accept', 'Reject']
                          },
                          peerCIDR: {
                            description:
                              '`peerCIDR` defines the Peer IP CIDR to filter flows by.\nExamples: `10.10.10.0/24` or `100:100:100:100::/64`',
                            type: 'string'
                          },
                          sourcePorts: {
                            description:
                              '`sourcePorts` optionally defines the source ports to filter flows by.\nTo filter a single port, set a single port as an integer value. For example, `sourcePorts: 80`.\nTo filter a range of ports, use a "start-end" range in string format. For example, `sourcePorts: "80-100"`.\nTo filter two ports, use a "port1,port2" in string format. For example, `ports: "80,100"`.',
                            anyOf: [
                              {
                                type: 'integer'
                              },
                              {
                                type: 'string'
                              }
                            ],
                            'x-kubernetes-int-or-string': true
                          },
                          icmpType: {
                            description:
                              '`icmpType`, for ICMP traffic, optionally defines the ICMP type to filter flows by.',
                            type: 'integer'
                          },
                          protocol: {
                            description:
                              '`protocol` optionally defines a protocol to filter flows by. The available options are `TCP`, `UDP`, `ICMP`, `ICMPv6`, and `SCTP`.',
                            type: 'string',
                            enum: ['TCP', 'UDP', 'ICMP', 'ICMPv6', 'SCTP']
                          },
                          direction: {
                            description:
                              '`direction` optionally defines a direction to filter flows by. The available options are `Ingress` and `Egress`.',
                            type: 'string',
                            enum: ['Ingress', 'Egress']
                          }
                        }
                      }
                    },
                    icmpType: {
                      description: '`icmpType`, for ICMP traffic, optionally defines the ICMP type to filter flows by.',
                      type: 'integer'
                    },
                    protocol: {
                      description:
                        '`protocol` optionally defines a protocol to filter flows by. The available options are `TCP`, `UDP`, `ICMP`, `ICMPv6`, and `SCTP`.',
                      type: 'string',
                      enum: ['TCP', 'UDP', 'ICMP', 'ICMPv6', 'SCTP']
                    },
                    direction: {
                      description:
                        '`direction` optionally defines a direction to filter flows by. The available options are `Ingress` and `Egress`.',
                      type: 'string',
                      enum: ['Ingress', 'Egress']
                    }
                  }
                },
                interfaces: {
                  description:
                    '`interfaces` contains the interface names from where flows are collected. If empty, the agent\nfetches all the interfaces in the system, excepting the ones listed in `excludeInterfaces`.\nAn entry enclosed by slashes, such as `/br-/`, is matched as a regular expression.\nOtherwise it is matched as a case-sensitive string.',
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                excludeInterfaces: {
                  description:
                    '`excludeInterfaces` contains the interface names that are excluded from flow tracing.\nAn entry enclosed by slashes, such as `/br-/`, is matched as a regular expression.\nOtherwise it is matched as a case-sensitive string.',
                  type: 'array',
                  default: ['lo'],
                  items: {
                    type: 'string'
                  }
                },
                logLevel: {
                  description: '`logLevel` defines the log level for the network observability eBPF Agent',
                  type: 'string',
                  default: 'info',
                  enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic']
                },
                imagePullPolicy: {
                  description: '`imagePullPolicy` is the Kubernetes pull policy for the image defined above',
                  type: 'string',
                  default: 'IfNotPresent',
                  enum: ['IfNotPresent', 'Always', 'Never']
                },
                metrics: {
                  description: '`metrics` defines the eBPF agent configuration regarding metrics.',
                  type: 'object',
                  properties: {
                    disableAlerts: {
                      description:
                        '`disableAlerts` is a list of alerts that should be disabled.\nPossible values are:\n`NetObservDroppedFlows`, which is triggered when the eBPF agent is missing packets or flows, such as when the BPF hashmap is busy or full, or the capacity limiter is being triggered.',
                      type: 'array',
                      items: {
                        description:
                          'Name of an eBPF agent alert.\nPossible values are:\n`NetObservDroppedFlows`, which is triggered when the eBPF agent is missing packets or flows, such as when the BPF hashmap is busy or full, or the capacity limiter is being triggered.',
                        type: 'string',
                        enum: ['NetObservDroppedFlows']
                      }
                    },
                    enable: {
                      description:
                        'Set `enable` to `false` to disable eBPF agent metrics collection. It is enabled by default.',
                      type: 'boolean'
                    },
                    server: {
                      description: 'Metrics server endpoint configuration for the Prometheus scraper.',
                      type: 'object',
                      properties: {
                        port: {
                          description: 'The metrics server HTTP port.',
                          type: 'integer',
                          format: 'int32',
                          maximum: 65535,
                          minimum: 1
                        },
                        tls: {
                          description: 'TLS configuration.',
                          type: 'object',
                          required: ['type'],
                          properties: {
                            insecureSkipVerify: {
                              description:
                                '`insecureSkipVerify` allows skipping client-side verification of the provided certificate.\nIf set to `true`, the `providedCaFile` field is ignored.',
                              type: 'boolean',
                              default: false
                            },
                            provided: {
                              description: 'TLS configuration when `type` is set to `Provided`.',
                              type: 'object',
                              properties: {
                                certFile: {
                                  description:
                                    '`certFile` defines the path to the certificate file name within the config map or secret.',
                                  type: 'string'
                                },
                                certKey: {
                                  description:
                                    '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                                  type: 'string'
                                },
                                name: {
                                  description: 'Name of the config map or secret containing certificates.',
                                  type: 'string'
                                },
                                namespace: {
                                  description:
                                    'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                                  type: 'string',
                                  default: ''
                                },
                                type: {
                                  description: 'Type for the certificate reference: `configmap` or `secret`.',
                                  type: 'string',
                                  enum: ['configmap', 'secret']
                                }
                              }
                            },
                            providedCaFile: {
                              description: 'Reference to the CA file when `type` is set to `Provided`.',
                              type: 'object',
                              properties: {
                                file: {
                                  description: 'File name within the config map or secret.',
                                  type: 'string'
                                },
                                name: {
                                  description: 'Name of the config map or secret containing the file.',
                                  type: 'string'
                                },
                                namespace: {
                                  description:
                                    'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                                  type: 'string',
                                  default: ''
                                },
                                type: {
                                  description: 'Type for the file reference: `configmap` or `secret`.',
                                  type: 'string',
                                  enum: ['configmap', 'secret']
                                }
                              }
                            },
                            type: {
                              description:
                                'Select the type of TLS configuration:\n- `Disabled` (default) to not configure TLS for the endpoint.\n- `Provided` to manually provide cert file and a key file. [Unsupported (*)].\n- `Auto` to use OpenShift auto generated certificate using annotations.',
                              type: 'string',
                              default: 'Disabled',
                              enum: ['Disabled', 'Provided', 'Auto']
                            }
                          }
                        }
                      }
                    }
                  }
                },
                cacheMaxFlows: {
                  description:
                    '`cacheMaxFlows` is the max number of flows in an aggregate; when reached, the reporter sends the flows.\nIncreasing `cacheMaxFlows` and `cacheActiveTimeout` can decrease the network traffic overhead and the CPU load,\nhowever you can expect higher memory consumption and an increased latency in the flow collection.',
                  type: 'integer',
                  format: 'int32',
                  default: 100000,
                  minimum: 1
                },
                cacheActiveTimeout: {
                  description:
                    '`cacheActiveTimeout` is the max period during which the reporter aggregates flows before sending.\nIncreasing `cacheMaxFlows` and `cacheActiveTimeout` can decrease the network traffic overhead and the CPU load,\nhowever you can expect higher memory consumption and an increased latency in the flow collection.',
                  type: 'string',
                  default: '5s',
                  pattern: '^\\d+(ns|ms|s|m)?$'
                },
                kafkaBatchSize: {
                  description:
                    '`kafkaBatchSize` limits the maximum size of a request in bytes before being sent to a partition. Ignored when not using Kafka. Default: 1MB.',
                  type: 'integer',
                  default: 1048576
                },
                resources: {
                  description:
                    '`resources` are the compute resources required by this container.\nFor more information, see https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                  type: 'object',
                  default: {
                    limits: {
                      memory: '800Mi'
                    },
                    requests: {
                      cpu: '100m',
                      memory: '50Mi'
                    }
                  },
                  properties: {
                    claims: {
                      description:
                        'Claims lists the names of resources, defined in spec.resourceClaims,\nthat are used by this container.\n\nThis is an alpha field and requires enabling the\nDynamicResourceAllocation feature gate.\n\nThis field is immutable. It can only be set for containers.',
                      type: 'array',
                      items: {
                        description: 'ResourceClaim references one entry in PodSpec.ResourceClaims.',
                        type: 'object',
                        required: ['name'],
                        properties: {
                          name: {
                            description:
                              'Name must match the name of one entry in pod.spec.resourceClaims of\nthe Pod where this field is used. It makes that resource available\ninside a container.',
                            type: 'string'
                          },
                          request: {
                            description:
                              'Request is the name chosen for a request in the referenced claim.\nIf empty, everything from the claim is made available, otherwise\nonly the result of this request.',
                            type: 'string'
                          }
                        }
                      },
                      'x-kubernetes-list-map-keys': ['name'],
                      'x-kubernetes-list-type': 'map'
                    },
                    limits: {
                      description:
                        'Limits describes the maximum amount of compute resources allowed.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                      type: 'object',
                      additionalProperties: {
                        pattern:
                          '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                        anyOf: [
                          {
                            type: 'integer'
                          },
                          {
                            type: 'string'
                          }
                        ],
                        'x-kubernetes-int-or-string': true
                      }
                    },
                    requests: {
                      description:
                        'Requests describes the minimum amount of compute resources required.\nIf Requests is omitted for a container, it defaults to Limits if that is explicitly specified,\notherwise to an implementation-defined value. Requests cannot exceed Limits.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                      type: 'object',
                      additionalProperties: {
                        pattern:
                          '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                        anyOf: [
                          {
                            type: 'integer'
                          },
                          {
                            type: 'string'
                          }
                        ],
                        'x-kubernetes-int-or-string': true
                      }
                    }
                  }
                },
                advanced: {
                  description:
                    '`advanced` allows setting some aspects of the internal configuration of the eBPF agent.\nThis section is aimed mostly for debugging and fine-grained performance optimizations,\nsuch as `GOGC` and `GOMAXPROCS` env vars. Set these values at your own risk.',
                  type: 'object',
                  properties: {
                    env: {
                      description:
                        '`env` allows passing custom environment variables to underlying components. Useful for passing\nsome very concrete performance-tuning options, such as `GOGC` and `GOMAXPROCS`, that should not be\npublicly exposed as part of the FlowCollector descriptor, as they are only useful\nin edge debug or support scenarios.',
                      type: 'object',
                      additionalProperties: {
                        type: 'string'
                      }
                    },
                    scheduling: {
                      description: 'scheduling controls how the pods are scheduled on nodes.',
                      type: 'object',
                      properties: {
                        affinity: {
                          description:
                            "If specified, the pod's scheduling constraints. For documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.",
                          type: 'object',
                          properties: {
                            nodeAffinity: {
                              description: 'Describes node affinity scheduling rules for the pod.',
                              type: 'object',
                              properties: {
                                preferredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node matches the corresponding matchExpressions; the\nnode(s) with the highest sum are the most preferred.',
                                  type: 'array',
                                  items: {
                                    description:
                                      "An empty preferred scheduling term matches all objects with implicit weight 0\n(i.e. it's a no-op). A null preferred scheduling term matches no objects (i.e. is also a no-op).",
                                    type: 'object',
                                    required: ['preference', 'weight'],
                                    properties: {
                                      preference: {
                                        description: 'A node selector term, associated with the corresponding weight.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description: "A list of node selector requirements by node's labels.",
                                            type: 'array',
                                            items: {
                                              description:
                                                'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'The label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchFields: {
                                            description: "A list of node selector requirements by node's fields.",
                                            type: 'array',
                                            items: {
                                              description:
                                                'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'The label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      weight: {
                                        description:
                                          'Weight associated with matching the corresponding nodeSelectorTerm, in the range 1-100.',
                                        type: 'integer',
                                        format: 'int32'
                                      }
                                    }
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                },
                                requiredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to an update), the system\nmay or may not try to eventually evict the pod from its node.',
                                  type: 'object',
                                  required: ['nodeSelectorTerms'],
                                  properties: {
                                    nodeSelectorTerms: {
                                      description: 'Required. A list of node selector terms. The terms are ORed.',
                                      type: 'array',
                                      items: {
                                        description:
                                          'A null or empty node selector term matches no objects. The requirements of\nthem are ANDed.\nThe TopologySelectorTerm type implements a subset of the NodeSelectorTerm.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description: "A list of node selector requirements by node's labels.",
                                            type: 'array',
                                            items: {
                                              description:
                                                'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'The label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchFields: {
                                            description: "A list of node selector requirements by node's fields.",
                                            type: 'array',
                                            items: {
                                              description:
                                                'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'The label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      'x-kubernetes-list-type': 'atomic'
                                    }
                                  },
                                  'x-kubernetes-map-type': 'atomic'
                                }
                              }
                            },
                            podAffinity: {
                              description:
                                'Describes pod affinity scheduling rules (e.g. co-locate this pod in the same node, zone, etc. as some other pod(s)).',
                              type: 'object',
                              properties: {
                                preferredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                    type: 'object',
                                    required: ['podAffinityTerm', 'weight'],
                                    properties: {
                                      podAffinityTerm: {
                                        description:
                                          'Required. A pod affinity term, associated with the corresponding weight.',
                                        type: 'object',
                                        required: ['topologyKey'],
                                        properties: {
                                          labelSelector: {
                                            description:
                                              "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                            type: 'object',
                                            properties: {
                                              matchExpressions: {
                                                description:
                                                  'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                                type: 'array',
                                                items: {
                                                  description:
                                                    'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                                  type: 'object',
                                                  required: ['key', 'operator'],
                                                  properties: {
                                                    key: {
                                                      description: 'key is the label key that the selector applies to.',
                                                      type: 'string'
                                                    },
                                                    operator: {
                                                      description:
                                                        "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                      type: 'string'
                                                    },
                                                    values: {
                                                      description:
                                                        'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                      type: 'array',
                                                      items: {
                                                        type: 'string'
                                                      },
                                                      'x-kubernetes-list-type': 'atomic'
                                                    }
                                                  }
                                                },
                                                'x-kubernetes-list-type': 'atomic'
                                              },
                                              matchLabels: {
                                                description:
                                                  'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                                type: 'object',
                                                additionalProperties: {
                                                  type: 'string'
                                                }
                                              }
                                            },
                                            'x-kubernetes-map-type': 'atomic'
                                          },
                                          matchLabelKeys: {
                                            description:
                                              "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          mismatchLabelKeys: {
                                            description:
                                              "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          namespaceSelector: {
                                            description:
                                              'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                            type: 'object',
                                            properties: {
                                              matchExpressions: {
                                                description:
                                                  'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                                type: 'array',
                                                items: {
                                                  description:
                                                    'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                                  type: 'object',
                                                  required: ['key', 'operator'],
                                                  properties: {
                                                    key: {
                                                      description: 'key is the label key that the selector applies to.',
                                                      type: 'string'
                                                    },
                                                    operator: {
                                                      description:
                                                        "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                      type: 'string'
                                                    },
                                                    values: {
                                                      description:
                                                        'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                      type: 'array',
                                                      items: {
                                                        type: 'string'
                                                      },
                                                      'x-kubernetes-list-type': 'atomic'
                                                    }
                                                  }
                                                },
                                                'x-kubernetes-list-type': 'atomic'
                                              },
                                              matchLabels: {
                                                description:
                                                  'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                                type: 'object',
                                                additionalProperties: {
                                                  type: 'string'
                                                }
                                              }
                                            },
                                            'x-kubernetes-map-type': 'atomic'
                                          },
                                          namespaces: {
                                            description:
                                              'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          topologyKey: {
                                            description:
                                              'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                            type: 'string'
                                          }
                                        }
                                      },
                                      weight: {
                                        description:
                                          'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                        type: 'integer',
                                        format: 'int32'
                                      }
                                    }
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                },
                                requiredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                }
                              }
                            },
                            podAntiAffinity: {
                              description:
                                'Describes pod anti-affinity scheduling rules (e.g. avoid putting this pod in the same node, zone, etc. as some other pod(s)).',
                              type: 'object',
                              properties: {
                                preferredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'The scheduler will prefer to schedule pods to nodes that satisfy\nthe anti-affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling anti-affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                    type: 'object',
                                    required: ['podAffinityTerm', 'weight'],
                                    properties: {
                                      podAffinityTerm: {
                                        description:
                                          'Required. A pod affinity term, associated with the corresponding weight.',
                                        type: 'object',
                                        required: ['topologyKey'],
                                        properties: {
                                          labelSelector: {
                                            description:
                                              "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                            type: 'object',
                                            properties: {
                                              matchExpressions: {
                                                description:
                                                  'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                                type: 'array',
                                                items: {
                                                  description:
                                                    'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                                  type: 'object',
                                                  required: ['key', 'operator'],
                                                  properties: {
                                                    key: {
                                                      description: 'key is the label key that the selector applies to.',
                                                      type: 'string'
                                                    },
                                                    operator: {
                                                      description:
                                                        "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                      type: 'string'
                                                    },
                                                    values: {
                                                      description:
                                                        'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                      type: 'array',
                                                      items: {
                                                        type: 'string'
                                                      },
                                                      'x-kubernetes-list-type': 'atomic'
                                                    }
                                                  }
                                                },
                                                'x-kubernetes-list-type': 'atomic'
                                              },
                                              matchLabels: {
                                                description:
                                                  'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                                type: 'object',
                                                additionalProperties: {
                                                  type: 'string'
                                                }
                                              }
                                            },
                                            'x-kubernetes-map-type': 'atomic'
                                          },
                                          matchLabelKeys: {
                                            description:
                                              "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          mismatchLabelKeys: {
                                            description:
                                              "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          namespaceSelector: {
                                            description:
                                              'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                            type: 'object',
                                            properties: {
                                              matchExpressions: {
                                                description:
                                                  'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                                type: 'array',
                                                items: {
                                                  description:
                                                    'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                                  type: 'object',
                                                  required: ['key', 'operator'],
                                                  properties: {
                                                    key: {
                                                      description: 'key is the label key that the selector applies to.',
                                                      type: 'string'
                                                    },
                                                    operator: {
                                                      description:
                                                        "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                      type: 'string'
                                                    },
                                                    values: {
                                                      description:
                                                        'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                      type: 'array',
                                                      items: {
                                                        type: 'string'
                                                      },
                                                      'x-kubernetes-list-type': 'atomic'
                                                    }
                                                  }
                                                },
                                                'x-kubernetes-list-type': 'atomic'
                                              },
                                              matchLabels: {
                                                description:
                                                  'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                                type: 'object',
                                                additionalProperties: {
                                                  type: 'string'
                                                }
                                              }
                                            },
                                            'x-kubernetes-map-type': 'atomic'
                                          },
                                          namespaces: {
                                            description:
                                              'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                            type: 'array',
                                            items: {
                                              type: 'string'
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          topologyKey: {
                                            description:
                                              'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                            type: 'string'
                                          }
                                        }
                                      },
                                      weight: {
                                        description:
                                          'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                        type: 'integer',
                                        format: 'int32'
                                      }
                                    }
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                },
                                requiredDuringSchedulingIgnoredDuringExecution: {
                                  description:
                                    'If the anti-affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the anti-affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                }
                              }
                            }
                          }
                        },
                        nodeSelector: {
                          description:
                            '`nodeSelector` allows scheduling of pods only onto nodes that have each of the specified labels.\nFor documentation, refer to https://kubernetes.io/docs/concepts/configuration/assign-pod-node/.',
                          type: 'object',
                          additionalProperties: {
                            type: 'string'
                          },
                          'x-kubernetes-map-type': 'atomic'
                        },
                        priorityClassName: {
                          description:
                            "If specified, indicates the pod's priority. For documentation, refer to https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#how-to-use-priority-and-preemption.\nIf not specified, default priority is used, or zero if there is no default.",
                          type: 'string'
                        },
                        tolerations: {
                          description:
                            '`tolerations` is a list of tolerations that allow the pod to schedule onto nodes with matching taints.\nFor documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.',
                          type: 'array',
                          items: {
                            description:
                              'The pod this Toleration is attached to tolerates any taint that matches\nthe triple <key,value,effect> using the matching operator <operator>.',
                            type: 'object',
                            properties: {
                              effect: {
                                description:
                                  'Effect indicates the taint effect to match. Empty means match all taint effects.\nWhen specified, allowed values are NoSchedule, PreferNoSchedule and NoExecute.',
                                type: 'string'
                              },
                              key: {
                                description:
                                  'Key is the taint key that the toleration applies to. Empty means match all taint keys.\nIf the key is empty, operator must be Exists; this combination means to match all values and all keys.',
                                type: 'string'
                              },
                              operator: {
                                description:
                                  "Operator represents a key's relationship to the value.\nValid operators are Exists and Equal. Defaults to Equal.\nExists is equivalent to wildcard for value, so that a pod can\ntolerate all taints of a particular category.",
                                type: 'string'
                              },
                              tolerationSeconds: {
                                description:
                                  'TolerationSeconds represents the period of time the toleration (which must be\nof effect NoExecute, otherwise this field is ignored) tolerates the taint. By default,\nit is not set, which means tolerate the taint forever (do not evict). Zero and\nnegative values will be treated as 0 (evict immediately) by the system.',
                                type: 'integer',
                                format: 'int64'
                              },
                              value: {
                                description:
                                  'Value is the taint value the toleration matches to.\nIf the operator is Exists, the value should be empty, otherwise just a regular string.',
                                type: 'string'
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            ipfix: {
              description:
                '`ipfix` [deprecated (*)] - describes the settings related to the IPFIX-based flow reporter when `spec.agent.type`\nis set to `IPFIX`.',
              type: 'object',
              properties: {
                cacheActiveTimeout: {
                  description:
                    '`cacheActiveTimeout` is the max period during which the reporter aggregates flows before sending.',
                  type: 'string',
                  default: '20s',
                  pattern: '^\\d+(ns|ms|s|m)?$'
                },
                cacheMaxFlows: {
                  description:
                    '`cacheMaxFlows` is the max number of flows in an aggregate; when reached, the reporter sends the flows.',
                  type: 'integer',
                  format: 'int32',
                  default: 400,
                  minimum: 0
                },
                clusterNetworkOperator: {
                  description:
                    '`clusterNetworkOperator` defines the settings related to the OpenShift Cluster Network Operator, when available.',
                  type: 'object',
                  properties: {
                    namespace: {
                      description: 'Namespace  where the config map is going to be deployed.',
                      type: 'string',
                      default: 'openshift-network-operator'
                    }
                  }
                },
                forceSampleAll: {
                  description:
                    '`forceSampleAll` allows disabling sampling in the IPFIX-based flow reporter.\nIt is not recommended to sample all the traffic with IPFIX, as it might generate cluster instability.\nIf you REALLY want to do that, set this flag to `true`. Use at your own risk.\nWhen it is set to `true`, the value of `sampling` is ignored.',
                  type: 'boolean',
                  default: false
                },
                ovnKubernetes: {
                  description:
                    "`ovnKubernetes` defines the settings of the OVN-Kubernetes network plugin, when available. This configuration is used when using OVN's IPFIX exports, without OpenShift. When using OpenShift, refer to the `clusterNetworkOperator` property instead.",
                  type: 'object',
                  properties: {
                    containerName: {
                      description: '`containerName` defines the name of the container to configure for IPFIX.',
                      type: 'string',
                      default: 'ovnkube-node'
                    },
                    daemonSetName: {
                      description:
                        '`daemonSetName` defines the name of the DaemonSet controlling the OVN-Kubernetes pods.',
                      type: 'string',
                      default: 'ovnkube-node'
                    },
                    namespace: {
                      description: 'Namespace where OVN-Kubernetes pods are deployed.',
                      type: 'string',
                      default: 'ovn-kubernetes'
                    }
                  }
                },
                sampling: {
                  description:
                    '`sampling` is the sampling interval on the reporter. 100 means one flow on 100 is sent.\nTo ensure cluster stability, it is not possible to set a value below 2.\nIf you really want to sample every packet, which might impact the cluster stability,\nrefer to `forceSampleAll`. Alternatively, you can use the eBPF Agent instead of IPFIX.',
                  type: 'integer',
                  format: 'int32',
                  default: 400,
                  minimum: 2
                }
              }
            },
            type: {
              description:
                '`type` [deprecated (*)] selects the flows tracing agent. Previously, this field allowed to select between `eBPF` or `IPFIX`.\nOnly `eBPF` is allowed now, so this field is deprecated and is planned for removal in a future version of the API.',
              type: 'string',
              default: 'eBPF',
              enum: ['eBPF', 'IPFIX']
            }
          }
        },
        processor: {
          description:
            '`processor` defines the settings of the component that receives the flows from the agent,\nenriches them, generates metrics, and forwards them to the Loki persistence layer and/or any available exporter.',
          type: 'object',
          properties: {
            logLevel: {
              description: '`logLevel` of the processor runtime',
              type: 'string',
              default: 'info',
              enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic']
            },
            advanced: {
              description:
                '`advanced` allows setting some aspects of the internal configuration of the flow processor.\nThis section is aimed mostly for debugging and fine-grained performance optimizations,\nsuch as `GOGC` and `GOMAXPROCS` env vars. Set these values at your own risk.',
              type: 'object',
              properties: {
                port: {
                  description:
                    'Port of the flow collector (host port).\nBy convention, some values are forbidden. It must be greater than 1024 and different from\n4500, 4789 and 6081.',
                  type: 'integer',
                  format: 'int32',
                  default: 2055,
                  maximum: 65535,
                  minimum: 1025
                },
                conversationTerminatingTimeout: {
                  description:
                    '`conversationTerminatingTimeout` is the time to wait from detected FIN flag to end a conversation. Only relevant for TCP flows.',
                  type: 'string',
                  default: '5s'
                },
                conversationEndTimeout: {
                  description:
                    '`conversationEndTimeout` is the time to wait after a network flow is received, to consider the conversation ended.\nThis delay is ignored when a FIN packet is collected for TCP flows (see `conversationTerminatingTimeout` instead).',
                  type: 'string',
                  default: '10s'
                },
                profilePort: {
                  description: '`profilePort` allows setting up a Go pprof profiler listening to this port',
                  type: 'integer',
                  format: 'int32',
                  default: 6060,
                  maximum: 65535,
                  minimum: 0
                },
                env: {
                  description:
                    '`env` allows passing custom environment variables to underlying components. Useful for passing\nsome very concrete performance-tuning options, such as `GOGC` and `GOMAXPROCS`, that should not be\npublicly exposed as part of the FlowCollector descriptor, as they are only useful\nin edge debug or support scenarios.',
                  type: 'object',
                  additionalProperties: {
                    type: 'string'
                  }
                },
                enableKubeProbes: {
                  description:
                    '`enableKubeProbes` is a flag to enable or disable Kubernetes liveness and readiness probes',
                  type: 'boolean',
                  default: true
                },
                scheduling: {
                  description: 'scheduling controls how the pods are scheduled on nodes.',
                  type: 'object',
                  properties: {
                    affinity: {
                      description:
                        "If specified, the pod's scheduling constraints. For documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.",
                      type: 'object',
                      properties: {
                        nodeAffinity: {
                          description: 'Describes node affinity scheduling rules for the pod.',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node matches the corresponding matchExpressions; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  "An empty preferred scheduling term matches all objects with implicit weight 0\n(i.e. it's a no-op). A null preferred scheduling term matches no objects (i.e. is also a no-op).",
                                type: 'object',
                                required: ['preference', 'weight'],
                                properties: {
                                  preference: {
                                    description: 'A node selector term, associated with the corresponding weight.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description: "A list of node selector requirements by node's labels.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchFields: {
                                        description: "A list of node selector requirements by node's fields.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  weight: {
                                    description:
                                      'Weight associated with matching the corresponding nodeSelectorTerm, in the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to an update), the system\nmay or may not try to eventually evict the pod from its node.',
                              type: 'object',
                              required: ['nodeSelectorTerms'],
                              properties: {
                                nodeSelectorTerms: {
                                  description: 'Required. A list of node selector terms. The terms are ORed.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'A null or empty node selector term matches no objects. The requirements of\nthem are ANDed.\nThe TopologySelectorTerm type implements a subset of the NodeSelectorTerm.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description: "A list of node selector requirements by node's labels.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchFields: {
                                        description: "A list of node selector requirements by node's fields.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                }
                              },
                              'x-kubernetes-map-type': 'atomic'
                            }
                          }
                        },
                        podAffinity: {
                          description:
                            'Describes pod affinity scheduling rules (e.g. co-locate this pod in the same node, zone, etc. as some other pod(s)).',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                type: 'object',
                                required: ['podAffinityTerm', 'weight'],
                                properties: {
                                  podAffinityTerm: {
                                    description:
                                      'Required. A pod affinity term, associated with the corresponding weight.',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  weight: {
                                    description:
                                      'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                              type: 'array',
                              items: {
                                description:
                                  'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                type: 'object',
                                required: ['topologyKey'],
                                properties: {
                                  labelSelector: {
                                    description:
                                      "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  matchLabelKeys: {
                                    description:
                                      "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  mismatchLabelKeys: {
                                    description:
                                      "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  namespaceSelector: {
                                    description:
                                      'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  namespaces: {
                                    description:
                                      'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  topologyKey: {
                                    description:
                                      'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                    type: 'string'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            }
                          }
                        },
                        podAntiAffinity: {
                          description:
                            'Describes pod anti-affinity scheduling rules (e.g. avoid putting this pod in the same node, zone, etc. as some other pod(s)).',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe anti-affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling anti-affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                type: 'object',
                                required: ['podAffinityTerm', 'weight'],
                                properties: {
                                  podAffinityTerm: {
                                    description:
                                      'Required. A pod affinity term, associated with the corresponding weight.',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  weight: {
                                    description:
                                      'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the anti-affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the anti-affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                              type: 'array',
                              items: {
                                description:
                                  'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                type: 'object',
                                required: ['topologyKey'],
                                properties: {
                                  labelSelector: {
                                    description:
                                      "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  matchLabelKeys: {
                                    description:
                                      "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  mismatchLabelKeys: {
                                    description:
                                      "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  namespaceSelector: {
                                    description:
                                      'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  namespaces: {
                                    description:
                                      'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  topologyKey: {
                                    description:
                                      'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                    type: 'string'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            }
                          }
                        }
                      }
                    },
                    nodeSelector: {
                      description:
                        '`nodeSelector` allows scheduling of pods only onto nodes that have each of the specified labels.\nFor documentation, refer to https://kubernetes.io/docs/concepts/configuration/assign-pod-node/.',
                      type: 'object',
                      additionalProperties: {
                        type: 'string'
                      },
                      'x-kubernetes-map-type': 'atomic'
                    },
                    priorityClassName: {
                      description:
                        "If specified, indicates the pod's priority. For documentation, refer to https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#how-to-use-priority-and-preemption.\nIf not specified, default priority is used, or zero if there is no default.",
                      type: 'string'
                    },
                    tolerations: {
                      description:
                        '`tolerations` is a list of tolerations that allow the pod to schedule onto nodes with matching taints.\nFor documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.',
                      type: 'array',
                      items: {
                        description:
                          'The pod this Toleration is attached to tolerates any taint that matches\nthe triple <key,value,effect> using the matching operator <operator>.',
                        type: 'object',
                        properties: {
                          effect: {
                            description:
                              'Effect indicates the taint effect to match. Empty means match all taint effects.\nWhen specified, allowed values are NoSchedule, PreferNoSchedule and NoExecute.',
                            type: 'string'
                          },
                          key: {
                            description:
                              'Key is the taint key that the toleration applies to. Empty means match all taint keys.\nIf the key is empty, operator must be Exists; this combination means to match all values and all keys.',
                            type: 'string'
                          },
                          operator: {
                            description:
                              "Operator represents a key's relationship to the value.\nValid operators are Exists and Equal. Defaults to Equal.\nExists is equivalent to wildcard for value, so that a pod can\ntolerate all taints of a particular category.",
                            type: 'string'
                          },
                          tolerationSeconds: {
                            description:
                              'TolerationSeconds represents the period of time the toleration (which must be\nof effect NoExecute, otherwise this field is ignored) tolerates the taint. By default,\nit is not set, which means tolerate the taint forever (do not evict). Zero and\nnegative values will be treated as 0 (evict immediately) by the system.',
                            type: 'integer',
                            format: 'int64'
                          },
                          value: {
                            description:
                              'Value is the taint value the toleration matches to.\nIf the operator is Exists, the value should be empty, otherwise just a regular string.',
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                },
                secondaryNetworks: {
                  description:
                    'Defines secondary networks to be checked for resources identification.\nTo guarantee a correct identification, indexed values must form an unique identifier across the cluster.\nIf the same index is used by several resources, those resources might be incorrectly labeled.',
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['index', 'name'],
                    properties: {
                      index: {
                        description:
                          "`index` is a list of fields to use for indexing the pods. They should form a unique Pod identifier across the cluster.\nCan be any of: `MAC`, `IP`, `Interface`.\nFields absent from the 'k8s.v1.cni.cncf.io/network-status' annotation must not be added to the index.",
                        type: 'array',
                        items: {
                          description:
                            'Field to index for secondary network pod identification, can be any of: `MAC`, `IP`, `Interface`.',
                          type: 'string',
                          enum: ['MAC', 'IP', 'Interface']
                        }
                      },
                      name: {
                        description:
                          "`name` should match the network name as visible in the pods annotation 'k8s.v1.cni.cncf.io/network-status'.",
                        type: 'string'
                      }
                    }
                  }
                },
                healthPort: {
                  description: '`healthPort` is a collector HTTP port in the Pod that exposes the health check API',
                  type: 'integer',
                  format: 'int32',
                  default: 8080,
                  maximum: 65535,
                  minimum: 1
                },
                dropUnusedFields: {
                  description: '`dropUnusedFields` [deprecated (*)] this setting is not used anymore.',
                  type: 'boolean',
                  default: true
                },
                conversationHeartbeatInterval: {
                  description:
                    '`conversationHeartbeatInterval` is the time to wait between "tick" events of a conversation',
                  type: 'string',
                  default: '30s'
                }
              }
            },
            metrics: {
              description: '`Metrics` define the processor configuration regarding metrics',
              type: 'object',
              properties: {
                disableAlerts: {
                  description:
                    '`disableAlerts` is a list of alerts that should be disabled.\nPossible values are:\n`NetObservNoFlows`, which is triggered when no flows are being observed for a certain period.\n`NetObservLokiError`, which is triggered when flows are being dropped due to Loki errors.',
                  type: 'array',
                  items: {
                    description:
                      'Name of a processor alert.\nPossible values are:\n- `NetObservNoFlows`, which is triggered when no flows are being observed for a certain period.\n- `NetObservLokiError`, which is triggered when flows are being dropped due to Loki errors.',
                    type: 'string',
                    enum: ['NetObservNoFlows', 'NetObservLokiError']
                  }
                },
                includeList: {
                  description:
                    '`includeList` is a list of metric names to specify which ones to generate.\nThe names correspond to the names in Prometheus without the prefix. For example,\n`namespace_egress_packets_total` shows up as `netobserv_namespace_egress_packets_total` in Prometheus.\nNote that the more metrics you add, the bigger is the impact on Prometheus workload resources.\nMetrics enabled by default are:\n`namespace_flows_total`, `node_ingress_bytes_total`, `node_egress_bytes_total`, `workload_ingress_bytes_total`,\n`workload_egress_bytes_total`, `namespace_drop_packets_total` (when `PacketDrop` feature is enabled),\n`namespace_rtt_seconds` (when `FlowRTT` feature is enabled), `namespace_dns_latency_seconds` (when `DNSTracking` feature is enabled),\n`namespace_network_policy_events_total` (when `NetworkEvents` feature is enabled).\nMore information, with full list of available metrics: https://github.com/netobserv/network-observability-operator/blob/main/docs/Metrics.md',
                  type: 'array',
                  items: {
                    description:
                      'Metric name. More information in https://github.com/netobserv/network-observability-operator/blob/main/docs/Metrics.md.',
                    type: 'string',
                    enum: [
                      'namespace_egress_bytes_total',
                      'namespace_egress_packets_total',
                      'namespace_ingress_bytes_total',
                      'namespace_ingress_packets_total',
                      'namespace_flows_total',
                      'node_egress_bytes_total',
                      'node_egress_packets_total',
                      'node_ingress_bytes_total',
                      'node_ingress_packets_total',
                      'node_flows_total',
                      'workload_egress_bytes_total',
                      'workload_egress_packets_total',
                      'workload_ingress_bytes_total',
                      'workload_ingress_packets_total',
                      'workload_flows_total',
                      'namespace_drop_bytes_total',
                      'namespace_drop_packets_total',
                      'node_drop_bytes_total',
                      'node_drop_packets_total',
                      'workload_drop_bytes_total',
                      'workload_drop_packets_total',
                      'namespace_rtt_seconds',
                      'node_rtt_seconds',
                      'workload_rtt_seconds',
                      'namespace_dns_latency_seconds',
                      'node_dns_latency_seconds',
                      'workload_dns_latency_seconds',
                      'node_network_policy_events_total',
                      'namespace_network_policy_events_total',
                      'workload_network_policy_events_total'
                    ]
                  }
                },
                server: {
                  description: 'Metrics server endpoint configuration for Prometheus scraper',
                  type: 'object',
                  properties: {
                    port: {
                      description: 'The metrics server HTTP port.',
                      type: 'integer',
                      format: 'int32',
                      maximum: 65535,
                      minimum: 1
                    },
                    tls: {
                      description: 'TLS configuration.',
                      type: 'object',
                      required: ['type'],
                      properties: {
                        insecureSkipVerify: {
                          description:
                            '`insecureSkipVerify` allows skipping client-side verification of the provided certificate.\nIf set to `true`, the `providedCaFile` field is ignored.',
                          type: 'boolean',
                          default: false
                        },
                        provided: {
                          description: 'TLS configuration when `type` is set to `Provided`.',
                          type: 'object',
                          properties: {
                            certFile: {
                              description:
                                '`certFile` defines the path to the certificate file name within the config map or secret.',
                              type: 'string'
                            },
                            certKey: {
                              description:
                                '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                              type: 'string'
                            },
                            name: {
                              description: 'Name of the config map or secret containing certificates.',
                              type: 'string'
                            },
                            namespace: {
                              description:
                                'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                              type: 'string',
                              default: ''
                            },
                            type: {
                              description: 'Type for the certificate reference: `configmap` or `secret`.',
                              type: 'string',
                              enum: ['configmap', 'secret']
                            }
                          }
                        },
                        providedCaFile: {
                          description: 'Reference to the CA file when `type` is set to `Provided`.',
                          type: 'object',
                          properties: {
                            file: {
                              description: 'File name within the config map or secret.',
                              type: 'string'
                            },
                            name: {
                              description: 'Name of the config map or secret containing the file.',
                              type: 'string'
                            },
                            namespace: {
                              description:
                                'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                              type: 'string',
                              default: ''
                            },
                            type: {
                              description: 'Type for the file reference: `configmap` or `secret`.',
                              type: 'string',
                              enum: ['configmap', 'secret']
                            }
                          }
                        },
                        type: {
                          description:
                            'Select the type of TLS configuration:\n- `Disabled` (default) to not configure TLS for the endpoint.\n- `Provided` to manually provide cert file and a key file. [Unsupported (*)].\n- `Auto` to use OpenShift auto generated certificate using annotations.',
                          type: 'string',
                          default: 'Disabled',
                          enum: ['Disabled', 'Provided', 'Auto']
                        }
                      }
                    }
                  }
                }
              }
            },
            resources: {
              description:
                '`resources` are the compute resources required by this container.\nFor more information, see https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
              type: 'object',
              default: {
                limits: {
                  memory: '800Mi'
                },
                requests: {
                  cpu: '100m',
                  memory: '100Mi'
                }
              },
              properties: {
                claims: {
                  description:
                    'Claims lists the names of resources, defined in spec.resourceClaims,\nthat are used by this container.\n\nThis is an alpha field and requires enabling the\nDynamicResourceAllocation feature gate.\n\nThis field is immutable. It can only be set for containers.',
                  type: 'array',
                  items: {
                    description: 'ResourceClaim references one entry in PodSpec.ResourceClaims.',
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: {
                        description:
                          'Name must match the name of one entry in pod.spec.resourceClaims of\nthe Pod where this field is used. It makes that resource available\ninside a container.',
                        type: 'string'
                      },
                      request: {
                        description:
                          'Request is the name chosen for a request in the referenced claim.\nIf empty, everything from the claim is made available, otherwise\nonly the result of this request.',
                        type: 'string'
                      }
                    }
                  },
                  'x-kubernetes-list-map-keys': ['name'],
                  'x-kubernetes-list-type': 'map'
                },
                limits: {
                  description:
                    'Limits describes the maximum amount of compute resources allowed.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                  type: 'object',
                  additionalProperties: {
                    pattern:
                      '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                    anyOf: [
                      {
                        type: 'integer'
                      },
                      {
                        type: 'string'
                      }
                    ],
                    'x-kubernetes-int-or-string': true
                  }
                },
                requests: {
                  description:
                    'Requests describes the minimum amount of compute resources required.\nIf Requests is omitted for a container, it defaults to Limits if that is explicitly specified,\notherwise to an implementation-defined value. Requests cannot exceed Limits.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                  type: 'object',
                  additionalProperties: {
                    pattern:
                      '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                    anyOf: [
                      {
                        type: 'integer'
                      },
                      {
                        type: 'string'
                      }
                    ],
                    'x-kubernetes-int-or-string': true
                  }
                }
              }
            },
            clusterName: {
              description:
                '`clusterName` is the name of the cluster to appear in the flows data. This is useful in a multi-cluster context. When using OpenShift, leave empty to make it automatically determined.',
              type: 'string',
              default: ''
            },
            multiClusterDeployment: {
              description:
                'Set `multiClusterDeployment` to `true` to enable multi clusters feature. This adds `clusterName` label to flows data',
              type: 'boolean',
              default: false
            },
            deduper: {
              description:
                '`deduper` allows you to sample or drop flows identified as duplicates, in order to save on resource usage.\n[Unsupported (*)].',
              type: 'object',
              properties: {
                mode: {
                  description:
                    'Set the Processor de-duplication mode. It comes in addition to the Agent-based deduplication because the Agent cannot de-duplicate same flows reported from different nodes.\n- Use `Drop` to drop every flow considered as duplicates, allowing saving more on resource usage but potentially losing some information such as the network interfaces used from peer, or network events.\n- Use `Sample` to randomly keep only one flow on 50, which is the default, among the ones considered as duplicates. This is a compromise between dropping every duplicate or keeping every duplicate. This sampling action comes in addition to the Agent-based sampling. If both Agent and Processor sampling values are `50`, the combined sampling is 1:2500.\n- Use `Disabled` to turn off Processor-based de-duplication.',
                  type: 'string',
                  default: 'Disabled',
                  enum: ['Disabled', 'Drop', 'Sample']
                },
                sampling: {
                  description: '`sampling` is the sampling interval when deduper `mode` is `Sample`.',
                  type: 'integer',
                  format: 'int32',
                  default: 50,
                  minimum: 0
                }
              }
            },
            addZone: {
              description:
                '`addZone` allows availability zone awareness by labelling flows with their source and destination zones.\nThis feature requires the "topology.kubernetes.io/zone" label to be set on nodes.',
              type: 'boolean'
            },
            kafkaConsumerQueueCapacity: {
              description:
                '`kafkaConsumerQueueCapacity` defines the capacity of the internal message queue used in the Kafka consumer client. Ignored when not using Kafka.',
              type: 'integer',
              default: 1000
            },
            imagePullPolicy: {
              description: '`imagePullPolicy` is the Kubernetes pull policy for the image defined above',
              type: 'string',
              default: 'IfNotPresent',
              enum: ['IfNotPresent', 'Always', 'Never']
            },
            kafkaConsumerAutoscaler: {
              description:
                '`kafkaConsumerAutoscaler` is the spec of a horizontal pod autoscaler to set up for `flowlogs-pipeline-transformer`, which consumes Kafka messages.\nThis setting is ignored when Kafka is disabled.',
              type: 'object',
              properties: {
                maxReplicas: {
                  description:
                    '`maxReplicas` is the upper limit for the number of pods that can be set by the autoscaler; cannot be smaller than MinReplicas.',
                  type: 'integer',
                  format: 'int32',
                  default: 3
                },
                metrics: {
                  description:
                    'Metrics used by the pod autoscaler. For documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/horizontal-pod-autoscaler-v2/',
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                      containerResource: {
                        type: 'object',
                        required: ['container', 'name', 'target'],
                        properties: {
                          container: {
                            type: 'string'
                          },
                          name: {
                            type: 'string'
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      external: {
                        type: 'object',
                        required: ['metric', 'target'],
                        properties: {
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      object: {
                        type: 'object',
                        required: ['describedObject', 'metric', 'target'],
                        properties: {
                          describedObject: {
                            type: 'object',
                            required: ['kind', 'name'],
                            properties: {
                              apiVersion: {
                                type: 'string'
                              },
                              kind: {
                                type: 'string'
                              },
                              name: {
                                type: 'string'
                              }
                            }
                          },
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      pods: {
                        type: 'object',
                        required: ['metric', 'target'],
                        properties: {
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      resource: {
                        type: 'object',
                        required: ['name', 'target'],
                        properties: {
                          name: {
                            type: 'string'
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    }
                  }
                },
                minReplicas: {
                  description:
                    '`minReplicas` is the lower limit for the number of replicas to which the autoscaler\ncan scale down. It defaults to 1 pod. minReplicas is allowed to be 0 if the\nalpha feature gate HPAScaleToZero is enabled and at least one Object or External\nmetric is configured. Scaling is active as long as at least one metric value is\navailable.',
                  type: 'integer',
                  format: 'int32'
                },
                status: {
                  description:
                    '`status` describes the desired status regarding deploying an horizontal pod autoscaler.\n- `Disabled` does not deploy an horizontal pod autoscaler.\n- `Enabled` deploys an horizontal pod autoscaler.',
                  type: 'string',
                  default: 'Disabled',
                  enum: ['Disabled', 'Enabled']
                }
              }
            },
            logTypes: {
              description:
                '`logTypes` defines the desired record types to generate. Possible values are:\n- `Flows` to export regular network flows. This is the default.\n- `Conversations` to generate events for started conversations, ended conversations as well as periodic "tick" updates.\n- `EndedConversations` to generate only ended conversations events.\n- `All` to generate both network flows and all conversations events. It is not recommended due to the impact on resources footprint.',
              type: 'string',
              default: 'Flows',
              enum: ['Flows', 'Conversations', 'EndedConversations', 'All']
            },
            unmanagedReplicas: {
              description:
                'If `unmanagedReplicas` is `true`, the operator will not reconcile `consumerReplicas`. This is useful when using a pod autoscaler.',
              type: 'boolean'
            },
            consumerReplicas: {
              description:
                '`consumerReplicas` defines the number of replicas (pods) to start for `flowlogs-pipeline`, default is 3. This setting is ignored when `spec.deploymentModel` is `Direct` or when `spec.processor.unmanagedReplicas` is `true`.',
              type: 'integer',
              format: 'int32',
              minimum: 0
            },
            kafkaConsumerReplicas: {
              description:
                '`kafkaConsumerAutoscaler` [deprecated (*)] is the spec of a horizontal pod autoscaler to set up for `flowlogs-pipeline-transformer`, which consumes Kafka messages. This setting is ignored when Kafka is disabled. Deprecation notice: managed autoscaler will be removed in a future version. You may configure instead an autoscaler of your choice, and set `spec.processor.unmanagedReplicas` to `true`.',
              type: 'integer',
              format: 'int32',
              default: 3,
              minimum: 0
            },
            filters: {
              description:
                '`filters` lets you define custom filters to limit the amount of generated flows.\nThese filters provide more flexibility than the eBPF Agent filters (in `spec.agent.ebpf.flowFilter`), such as allowing to filter by Kubernetes namespace,\nbut with a lesser improvement in performance.\n[Unsupported (*)].',
              type: 'array',
              items: {
                description:
                  '`FLPFilterSet` defines the desired configuration for FLP-based filtering satisfying all conditions.',
                type: 'object',
                properties: {
                  allOf: {
                    description: '`filters` is a list of matches that must be all satisfied in order to remove a flow.',
                    type: 'array',
                    items: {
                      description: '`FLPSingleFilter` defines the desired configuration for a single FLP-based filter.',
                      type: 'object',
                      required: ['field', 'matchType'],
                      properties: {
                        field: {
                          description:
                            'Name of the field to filter on.\nRefer to the documentation for the list of available fields: https://github.com/netobserv/network-observability-operator/blob/main/docs/flows-format.adoc.',
                          type: 'string'
                        },
                        matchType: {
                          description: 'Type of matching to apply.',
                          type: 'string',
                          default: 'Equal',
                          enum: ['Equal', 'NotEqual', 'Presence', 'Absence', 'MatchRegex', 'NotMatchRegex']
                        },
                        value: {
                          description:
                            'Value to filter on. When `matchType` is `Equal` or `NotEqual`, you can use field injection with `$(SomeField)` to refer to any other field of the flow.',
                          type: 'string'
                        }
                      }
                    }
                  },
                  outputTarget: {
                    description:
                      'If specified, these filters only target a single output: `Loki`, `Metrics` or `Exporters`. By default, all outputs are targeted.',
                    type: 'string',
                    enum: ['', 'Loki', 'Metrics', 'Exporters']
                  },
                  sampling: {
                    description: '`sampling` is an optional sampling interval to apply to this filter.',
                    type: 'integer',
                    format: 'int32',
                    minimum: 0
                  }
                }
              }
            },
            subnetLabels: {
              description:
                '`subnetLabels` allows to define custom labels on subnets and IPs or to enable automatic labelling of recognized subnets in OpenShift, which is used to identify cluster external traffic.\nWhen a subnet matches the source or destination IP of a flow, a corresponding field is added: `SrcSubnetLabel` or `DstSubnetLabel`.',
              type: 'object',
              properties: {
                customLabels: {
                  description:
                    '`customLabels` allows to customize subnets and IPs labelling, such as to identify cluster-external workloads or web services.\nIf you enable `openShiftAutoDetect`, `customLabels` can override the detected subnets in case they overlap.',
                  type: 'array',
                  items: {
                    description:
                      'SubnetLabel allows to label subnets and IPs, such as to identify cluster-external workloads or web services.',
                    type: 'object',
                    required: ['cidrs', 'name'],
                    properties: {
                      cidrs: {
                        description: 'List of CIDRs, such as `["1.2.3.4/32"]`.',
                        type: 'array',
                        items: {
                          type: 'string'
                        }
                      },
                      name: {
                        description: 'Label name, used to flag matching flows.',
                        type: 'string'
                      }
                    }
                  }
                },
                openShiftAutoDetect: {
                  description:
                    '`openShiftAutoDetect` allows, when set to `true`, to detect automatically the machines, pods and services subnets based on the\nOpenShift install configuration and the Cluster Network Operator configuration. Indirectly, this is a way to accurately detect\nexternal traffic: flows that are not labeled for those subnets are external to the cluster. Enabled by default on OpenShift.',
                  type: 'boolean'
                }
              }
            },
            kafkaConsumerBatchSize: {
              description:
                '`kafkaConsumerBatchSize` indicates to the broker the maximum batch size, in bytes, that the consumer accepts. Ignored when not using Kafka. Default: 10MB.',
              type: 'integer',
              default: 10485760
            }
          }
        },
        prometheus: {
          description:
            '`prometheus` defines Prometheus settings, such as querier configuration used to fetch metrics from the Console plugin.',
          type: 'object',
          properties: {
            querier: {
              description: 'Prometheus querying configuration, such as client settings, used in the Console plugin.',
              type: 'object',
              required: ['mode'],
              properties: {
                enable: {
                  description:
                    'When `enable` is `true`, the Console plugin queries flow metrics from Prometheus instead of Loki whenever possible.\nIt is enbaled by default: set it to `false` to disable this feature.\nThe Console plugin can use either Loki or Prometheus as a data source for metrics (see also `spec.loki`), or both.\nNot all queries are transposable from Loki to Prometheus. Hence, if Loki is disabled, some features of the plugin are disabled as well,\nsuch as getting per-pod information or viewing raw flows.\nIf both Prometheus and Loki are enabled, Prometheus takes precedence and Loki is used as a fallback for queries that Prometheus cannot handle.\nIf they are both disabled, the Console plugin is not deployed.',
                  type: 'boolean'
                },
                manual: {
                  description: 'Prometheus configuration for `Manual` mode.',
                  type: 'object',
                  properties: {
                    forwardUserToken: {
                      description: 'Set `true` to forward logged in user token in queries to Prometheus',
                      type: 'boolean'
                    },
                    tls: {
                      description: 'TLS client configuration for Prometheus URL.',
                      type: 'object',
                      properties: {
                        caCert: {
                          description:
                            '`caCert` defines the reference of the certificate for the Certificate Authority.',
                          type: 'object',
                          properties: {
                            certFile: {
                              description:
                                '`certFile` defines the path to the certificate file name within the config map or secret.',
                              type: 'string'
                            },
                            certKey: {
                              description:
                                '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                              type: 'string'
                            },
                            name: {
                              description: 'Name of the config map or secret containing certificates.',
                              type: 'string'
                            },
                            namespace: {
                              description:
                                'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                              type: 'string',
                              default: ''
                            },
                            type: {
                              description: 'Type for the certificate reference: `configmap` or `secret`.',
                              type: 'string',
                              enum: ['configmap', 'secret']
                            }
                          }
                        },
                        enable: {
                          description: 'Enable TLS',
                          type: 'boolean',
                          default: false
                        },
                        insecureSkipVerify: {
                          description:
                            '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                          type: 'boolean',
                          default: false
                        },
                        userCert: {
                          description:
                            '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                          type: 'object',
                          properties: {
                            certFile: {
                              description:
                                '`certFile` defines the path to the certificate file name within the config map or secret.',
                              type: 'string'
                            },
                            certKey: {
                              description:
                                '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                              type: 'string'
                            },
                            name: {
                              description: 'Name of the config map or secret containing certificates.',
                              type: 'string'
                            },
                            namespace: {
                              description:
                                'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                              type: 'string',
                              default: ''
                            },
                            type: {
                              description: 'Type for the certificate reference: `configmap` or `secret`.',
                              type: 'string',
                              enum: ['configmap', 'secret']
                            }
                          }
                        }
                      }
                    },
                    url: {
                      description:
                        '`url` is the address of an existing Prometheus service to use for querying metrics.',
                      type: 'string',
                      default: 'http://prometheus:9090'
                    }
                  }
                },
                mode: {
                  description:
                    '`mode` must be set according to the type of Prometheus installation that stores network observability metrics:\n- Use `Auto` to try configuring automatically. In OpenShift, it uses the Thanos querier from OpenShift Cluster Monitoring\n- Use `Manual` for a manual setup',
                  type: 'string',
                  default: 'Auto',
                  enum: ['Manual', 'Auto']
                },
                timeout: {
                  description:
                    '`timeout` is the read timeout for console plugin queries to Prometheus.\nA timeout of zero means no timeout.',
                  type: 'string',
                  default: '30s'
                }
              }
            }
          }
        },
        loki: {
          description: '`loki`, the flow store, client settings.',
          type: 'object',
          required: ['mode'],
          properties: {
            enable: {
              description:
                'Set `enable` to `true` to store flows in Loki.\nThe Console plugin can use either Loki or Prometheus as a data source for metrics (see also `spec.prometheus.querier`), or both.\nNot all queries are transposable from Loki to Prometheus. Hence, if Loki is disabled, some features of the plugin are disabled as well,\nsuch as getting per-pod information or viewing raw flows.\nIf both Prometheus and Loki are enabled, Prometheus takes precedence and Loki is used as a fallback for queries that Prometheus cannot handle.\nIf they are both disabled, the Console plugin is not deployed.',
              type: 'boolean',
              default: true
            },
            mode: {
              description:
                '`mode` must be set according to the installation mode of Loki:\n- Use `LokiStack` when Loki is managed using the Loki Operator\n- Use `Monolithic` when Loki is installed as a monolithic workload\n- Use `Microservices` when Loki is installed as microservices, but without Loki Operator\n- Use `Manual` if none of the options above match your setup',
              type: 'string',
              default: 'Monolithic',
              enum: ['Manual', 'LokiStack', 'Monolithic', 'Microservices']
            },
            manual: {
              description:
                'Loki configuration for `Manual` mode. This is the most flexible configuration.\nIt is ignored for other modes.',
              type: 'object',
              properties: {
                authToken: {
                  description:
                    '`authToken` describes the way to get a token to authenticate to Loki.\n- `Disabled` does not send any token with the request.\n- `Forward` forwards the user token for authorization.\n- `Host` [deprecated (*)] - uses the local pod service account to authenticate to Loki.\nWhen using the Loki Operator, this must be set to `Forward`.',
                  type: 'string',
                  default: 'Disabled',
                  enum: ['Disabled', 'Host', 'Forward']
                },
                ingesterUrl: {
                  description:
                    '`ingesterUrl` is the address of an existing Loki ingester service to push the flows to. When using the Loki Operator,\nset it to the Loki gateway service with the `network` tenant set in path, for example\nhttps://loki-gateway-http.netobserv.svc:8080/api/logs/v1/network.',
                  type: 'string',
                  default: 'http://loki:3100/'
                },
                querierUrl: {
                  description:
                    '`querierUrl` specifies the address of the Loki querier service.\nWhen using the Loki Operator, set it to the Loki gateway service with the `network` tenant set in path, for example\nhttps://loki-gateway-http.netobserv.svc:8080/api/logs/v1/network.',
                  type: 'string',
                  default: 'http://loki:3100/'
                },
                statusTls: {
                  description: 'TLS client configuration for Loki status URL.',
                  type: 'object',
                  properties: {
                    caCert: {
                      description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    },
                    enable: {
                      description: 'Enable TLS',
                      type: 'boolean',
                      default: false
                    },
                    insecureSkipVerify: {
                      description:
                        '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                      type: 'boolean',
                      default: false
                    },
                    userCert: {
                      description:
                        '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    }
                  }
                },
                statusUrl: {
                  description:
                    '`statusUrl` specifies the address of the Loki `/ready`, `/metrics` and `/config` endpoints, in case it is different from the\nLoki querier URL. If empty, the `querierUrl` value is used.\nThis is useful to show error messages and some context in the frontend.\nWhen using the Loki Operator, set it to the Loki HTTP query frontend service, for example\nhttps://loki-query-frontend-http.netobserv.svc:3100/.\n`statusTLS` configuration is used when `statusUrl` is set.',
                  type: 'string'
                },
                tenantID: {
                  description:
                    '`tenantID` is the Loki `X-Scope-OrgID` that identifies the tenant for each request.\nWhen using the Loki Operator, set it to `network`, which corresponds to a special tenant mode.',
                  type: 'string',
                  default: 'netobserv'
                },
                tls: {
                  description: 'TLS client configuration for Loki URL.',
                  type: 'object',
                  properties: {
                    caCert: {
                      description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    },
                    enable: {
                      description: 'Enable TLS',
                      type: 'boolean',
                      default: false
                    },
                    insecureSkipVerify: {
                      description:
                        '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                      type: 'boolean',
                      default: false
                    },
                    userCert: {
                      description:
                        '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    }
                  }
                }
              }
            },
            monolithic: {
              description:
                'Loki configuration for `Monolithic` mode.\nUse this option when Loki is installed using the monolithic deployment mode (https://grafana.com/docs/loki/latest/fundamentals/architecture/deployment-modes/#monolithic-mode).\nIt is ignored for other modes.',
              type: 'object',
              properties: {
                tenantID: {
                  description:
                    '`tenantID` is the Loki `X-Scope-OrgID` header that identifies the tenant for each request.',
                  type: 'string',
                  default: 'netobserv'
                },
                tls: {
                  description: 'TLS client configuration for Loki URL.',
                  type: 'object',
                  properties: {
                    caCert: {
                      description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    },
                    enable: {
                      description: 'Enable TLS',
                      type: 'boolean',
                      default: false
                    },
                    insecureSkipVerify: {
                      description:
                        '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                      type: 'boolean',
                      default: false
                    },
                    userCert: {
                      description:
                        '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    }
                  }
                },
                url: {
                  description:
                    '`url` is the unique address of an existing Loki service that points to both the ingester and the querier.',
                  type: 'string',
                  default: 'http://loki:3100/'
                }
              }
            },
            microservices: {
              description:
                'Loki configuration for `Microservices` mode.\nUse this option when Loki is installed using the microservices deployment mode (https://grafana.com/docs/loki/latest/fundamentals/architecture/deployment-modes/#microservices-mode).\nIt is ignored for other modes.',
              type: 'object',
              properties: {
                ingesterUrl: {
                  description:
                    '`ingesterUrl` is the address of an existing Loki ingester service to push the flows to.',
                  type: 'string',
                  default: 'http://loki-distributor:3100/'
                },
                querierUrl: {
                  description: '`querierURL` specifies the address of the Loki querier service.',
                  type: 'string',
                  default: 'http://loki-query-frontend:3100/'
                },
                tenantID: {
                  description:
                    '`tenantID` is the Loki `X-Scope-OrgID` header that identifies the tenant for each request.',
                  type: 'string',
                  default: 'netobserv'
                },
                tls: {
                  description: 'TLS client configuration for Loki URL.',
                  type: 'object',
                  properties: {
                    caCert: {
                      description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    },
                    enable: {
                      description: 'Enable TLS',
                      type: 'boolean',
                      default: false
                    },
                    insecureSkipVerify: {
                      description:
                        '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                      type: 'boolean',
                      default: false
                    },
                    userCert: {
                      description:
                        '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                      type: 'object',
                      properties: {
                        certFile: {
                          description:
                            '`certFile` defines the path to the certificate file name within the config map or secret.',
                          type: 'string'
                        },
                        certKey: {
                          description:
                            '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                          type: 'string'
                        },
                        name: {
                          description: 'Name of the config map or secret containing certificates.',
                          type: 'string'
                        },
                        namespace: {
                          description:
                            'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                          type: 'string',
                          default: ''
                        },
                        type: {
                          description: 'Type for the certificate reference: `configmap` or `secret`.',
                          type: 'string',
                          enum: ['configmap', 'secret']
                        }
                      }
                    }
                  }
                }
              }
            },
            lokiStack: {
              description:
                'Loki configuration for `LokiStack` mode. This is useful for an easy Loki Operator configuration.\nIt is ignored for other modes.',
              type: 'object',
              required: ['name'],
              properties: {
                name: {
                  description: 'Name of an existing LokiStack resource to use.',
                  type: 'string',
                  default: 'loki'
                },
                namespace: {
                  description:
                    'Namespace where this `LokiStack` resource is located. If omitted, it is assumed to be the same as `spec.namespace`.',
                  type: 'string'
                }
              }
            },
            readTimeout: {
              description:
                '`readTimeout` is the maximum console plugin loki query total time limit.\nA timeout of zero means no timeout.',
              type: 'string',
              default: '30s'
            },
            writeTimeout: {
              description:
                '`writeTimeout` is the maximum Loki time connection / request limit.\nA timeout of zero means no timeout.',
              type: 'string',
              default: '10s'
            },
            writeBatchWait: {
              description: '`writeBatchWait` is the maximum time to wait before sending a Loki batch.',
              type: 'string',
              default: '1s'
            },
            writeBatchSize: {
              description:
                '`writeBatchSize` is the maximum batch size (in bytes) of Loki logs to accumulate before sending.',
              type: 'integer',
              format: 'int64',
              default: 10485760,
              minimum: 1
            },
            advanced: {
              description:
                '`advanced` allows setting some aspects of the internal configuration of the Loki clients.\nThis section is aimed mostly for debugging and fine-grained performance optimizations.',
              type: 'object',
              properties: {
                staticLabels: {
                  description: '`staticLabels` is a map of common labels to set on each flow in Loki storage.',
                  type: 'object',
                  default: {
                    app: 'netobserv-flowcollector'
                  },
                  additionalProperties: {
                    type: 'string'
                  }
                },
                writeMaxBackoff: {
                  description:
                    '`writeMaxBackoff` is the maximum backoff time for Loki client connection between retries.',
                  type: 'string',
                  default: '5s'
                },
                writeMaxRetries: {
                  description: '`writeMaxRetries` is the maximum number of retries for Loki client connections.',
                  type: 'integer',
                  format: 'int32',
                  default: 2,
                  minimum: 0
                },
                writeMinBackoff: {
                  description:
                    '`writeMinBackoff` is the initial backoff time for Loki client connection between retries.',
                  type: 'string',
                  default: '1s'
                }
              }
            }
          }
        },
        consolePlugin: {
          description: '`consolePlugin` defines the settings related to the OpenShift Console plugin, when available.',
          type: 'object',
          properties: {
            logLevel: {
              description: '`logLevel` for the console plugin backend',
              type: 'string',
              default: 'info',
              enum: ['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'panic']
            },
            advanced: {
              description:
                '`advanced` allows setting some aspects of the internal configuration of the console plugin.\nThis section is aimed mostly for debugging and fine-grained performance optimizations,\nsuch as `GOGC` and `GOMAXPROCS` env vars. Set these values at your own risk.',
              type: 'object',
              properties: {
                args: {
                  description:
                    '`args` allows passing custom arguments to underlying components. Useful for overriding\nsome parameters, such as a URL or a configuration path, that should not be\npublicly exposed as part of the FlowCollector descriptor, as they are only useful\nin edge debug or support scenarios.',
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                },
                env: {
                  description:
                    '`env` allows passing custom environment variables to underlying components. Useful for passing\nsome very concrete performance-tuning options, such as `GOGC` and `GOMAXPROCS`, that should not be\npublicly exposed as part of the FlowCollector descriptor, as they are only useful\nin edge debug or support scenarios.',
                  type: 'object',
                  additionalProperties: {
                    type: 'string'
                  }
                },
                port: {
                  description: '`port` is the plugin service port. Do not use 9002, which is reserved for metrics.',
                  type: 'integer',
                  format: 'int32',
                  default: 9001,
                  maximum: 65535,
                  minimum: 1
                },
                register: {
                  description:
                    '`register` allows, when set to `true`, to automatically register the provided console plugin with the OpenShift Console operator.\nWhen set to `false`, you can still register it manually by editing console.operator.openshift.io/cluster with the following command:\n`oc patch console.operator.openshift.io cluster --type=\'json\' -p \'[{"op": "add", "path": "/spec/plugins/-", "value": "netobserv-plugin"}]\'`',
                  type: 'boolean',
                  default: true
                },
                scheduling: {
                  description: '`scheduling` controls how the pods are scheduled on nodes.',
                  type: 'object',
                  properties: {
                    affinity: {
                      description:
                        "If specified, the pod's scheduling constraints. For documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.",
                      type: 'object',
                      properties: {
                        nodeAffinity: {
                          description: 'Describes node affinity scheduling rules for the pod.',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node matches the corresponding matchExpressions; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  "An empty preferred scheduling term matches all objects with implicit weight 0\n(i.e. it's a no-op). A null preferred scheduling term matches no objects (i.e. is also a no-op).",
                                type: 'object',
                                required: ['preference', 'weight'],
                                properties: {
                                  preference: {
                                    description: 'A node selector term, associated with the corresponding weight.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description: "A list of node selector requirements by node's labels.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchFields: {
                                        description: "A list of node selector requirements by node's fields.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  weight: {
                                    description:
                                      'Weight associated with matching the corresponding nodeSelectorTerm, in the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to an update), the system\nmay or may not try to eventually evict the pod from its node.',
                              type: 'object',
                              required: ['nodeSelectorTerms'],
                              properties: {
                                nodeSelectorTerms: {
                                  description: 'Required. A list of node selector terms. The terms are ORed.',
                                  type: 'array',
                                  items: {
                                    description:
                                      'A null or empty node selector term matches no objects. The requirements of\nthem are ANDed.\nThe TopologySelectorTerm type implements a subset of the NodeSelectorTerm.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description: "A list of node selector requirements by node's labels.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchFields: {
                                        description: "A list of node selector requirements by node's fields.",
                                        type: 'array',
                                        items: {
                                          description:
                                            'A node selector requirement is a selector that contains values, a key, and an operator\nthat relates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'The label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "Represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists, DoesNotExist. Gt, and Lt.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'An array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. If the operator is Gt or Lt, the values\narray must have a single element, which will be interpreted as an integer.\nThis array is replaced during a strategic merge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  'x-kubernetes-list-type': 'atomic'
                                }
                              },
                              'x-kubernetes-map-type': 'atomic'
                            }
                          }
                        },
                        podAffinity: {
                          description:
                            'Describes pod affinity scheduling rules (e.g. co-locate this pod in the same node, zone, etc. as some other pod(s)).',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                type: 'object',
                                required: ['podAffinityTerm', 'weight'],
                                properties: {
                                  podAffinityTerm: {
                                    description:
                                      'Required. A pod affinity term, associated with the corresponding weight.',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  weight: {
                                    description:
                                      'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                              type: 'array',
                              items: {
                                description:
                                  'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                type: 'object',
                                required: ['topologyKey'],
                                properties: {
                                  labelSelector: {
                                    description:
                                      "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  matchLabelKeys: {
                                    description:
                                      "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  mismatchLabelKeys: {
                                    description:
                                      "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  namespaceSelector: {
                                    description:
                                      'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  namespaces: {
                                    description:
                                      'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  topologyKey: {
                                    description:
                                      'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                    type: 'string'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            }
                          }
                        },
                        podAntiAffinity: {
                          description:
                            'Describes pod anti-affinity scheduling rules (e.g. avoid putting this pod in the same node, zone, etc. as some other pod(s)).',
                          type: 'object',
                          properties: {
                            preferredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'The scheduler will prefer to schedule pods to nodes that satisfy\nthe anti-affinity expressions specified by this field, but it may choose\na node that violates one or more of the expressions. The node that is\nmost preferred is the one with the greatest sum of weights, i.e.\nfor each node that meets all of the scheduling requirements (resource\nrequest, requiredDuringScheduling anti-affinity expressions, etc.),\ncompute a sum by iterating through the elements of this field and adding\n"weight" to the sum if the node has pods which matches the corresponding podAffinityTerm; the\nnode(s) with the highest sum are the most preferred.',
                              type: 'array',
                              items: {
                                description:
                                  'The weights of all of the matched WeightedPodAffinityTerm fields are added per-node to find the most preferred node(s)',
                                type: 'object',
                                required: ['podAffinityTerm', 'weight'],
                                properties: {
                                  podAffinityTerm: {
                                    description:
                                      'Required. A pod affinity term, associated with the corresponding weight.',
                                    type: 'object',
                                    required: ['topologyKey'],
                                    properties: {
                                      labelSelector: {
                                        description:
                                          "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      matchLabelKeys: {
                                        description:
                                          "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      mismatchLabelKeys: {
                                        description:
                                          "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      namespaceSelector: {
                                        description:
                                          'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                        type: 'object',
                                        properties: {
                                          matchExpressions: {
                                            description:
                                              'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                            type: 'array',
                                            items: {
                                              description:
                                                'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                              type: 'object',
                                              required: ['key', 'operator'],
                                              properties: {
                                                key: {
                                                  description: 'key is the label key that the selector applies to.',
                                                  type: 'string'
                                                },
                                                operator: {
                                                  description:
                                                    "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                                  type: 'string'
                                                },
                                                values: {
                                                  description:
                                                    'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                                  type: 'array',
                                                  items: {
                                                    type: 'string'
                                                  },
                                                  'x-kubernetes-list-type': 'atomic'
                                                }
                                              }
                                            },
                                            'x-kubernetes-list-type': 'atomic'
                                          },
                                          matchLabels: {
                                            description:
                                              'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                            type: 'object',
                                            additionalProperties: {
                                              type: 'string'
                                            }
                                          }
                                        },
                                        'x-kubernetes-map-type': 'atomic'
                                      },
                                      namespaces: {
                                        description:
                                          'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                        type: 'array',
                                        items: {
                                          type: 'string'
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      topologyKey: {
                                        description:
                                          'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                        type: 'string'
                                      }
                                    }
                                  },
                                  weight: {
                                    description:
                                      'weight associated with matching the corresponding podAffinityTerm,\nin the range 1-100.',
                                    type: 'integer',
                                    format: 'int32'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            },
                            requiredDuringSchedulingIgnoredDuringExecution: {
                              description:
                                'If the anti-affinity requirements specified by this field are not met at\nscheduling time, the pod will not be scheduled onto the node.\nIf the anti-affinity requirements specified by this field cease to be met\nat some point during pod execution (e.g. due to a pod label update), the\nsystem may or may not try to eventually evict the pod from its node.\nWhen there are multiple elements, the lists of nodes corresponding to each\npodAffinityTerm are intersected, i.e. all terms must be satisfied.',
                              type: 'array',
                              items: {
                                description:
                                  'Defines a set of pods (namely those matching the labelSelector\nrelative to the given namespace(s)) that this pod should be\nco-located (affinity) or not co-located (anti-affinity) with,\nwhere co-located is defined as running on a node whose value of\nthe label with key <topologyKey> matches that of any node on which\na pod of the set of pods is running',
                                type: 'object',
                                required: ['topologyKey'],
                                properties: {
                                  labelSelector: {
                                    description:
                                      "A label query over a set of resources, in this case pods.\nIf it's null, this PodAffinityTerm matches with no Pods.",
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  matchLabelKeys: {
                                    description:
                                      "MatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key in (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both matchLabelKeys and labelSelector.\nAlso, matchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  mismatchLabelKeys: {
                                    description:
                                      "MismatchLabelKeys is a set of pod label keys to select which pods will\nbe taken into consideration. The keys are used to lookup values from the\nincoming pod labels, those key-value labels are merged with `labelSelector` as `key notin (value)`\nto select the group of existing pods which pods will be taken into consideration\nfor the incoming pod's pod (anti) affinity. Keys that don't exist in the incoming\npod labels will be ignored. The default value is empty.\nThe same key is forbidden to exist in both mismatchLabelKeys and labelSelector.\nAlso, mismatchLabelKeys cannot be set when labelSelector isn't set.\nThis is a beta field and requires enabling MatchLabelKeysInPodAffinity feature gate (enabled by default).",
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  namespaceSelector: {
                                    description:
                                      'A label query over the set of namespaces that the term applies to.\nThe term is applied to the union of the namespaces selected by this field\nand the ones listed in the namespaces field.\nnull selector and null or empty namespaces list means "this pod\'s namespace".\nAn empty selector ({}) matches all namespaces.',
                                    type: 'object',
                                    properties: {
                                      matchExpressions: {
                                        description:
                                          'matchExpressions is a list of label selector requirements. The requirements are ANDed.',
                                        type: 'array',
                                        items: {
                                          description:
                                            'A label selector requirement is a selector that contains values, a key, and an operator that\nrelates the key and values.',
                                          type: 'object',
                                          required: ['key', 'operator'],
                                          properties: {
                                            key: {
                                              description: 'key is the label key that the selector applies to.',
                                              type: 'string'
                                            },
                                            operator: {
                                              description:
                                                "operator represents a key's relationship to a set of values.\nValid operators are In, NotIn, Exists and DoesNotExist.",
                                              type: 'string'
                                            },
                                            values: {
                                              description:
                                                'values is an array of string values. If the operator is In or NotIn,\nthe values array must be non-empty. If the operator is Exists or DoesNotExist,\nthe values array must be empty. This array is replaced during a strategic\nmerge patch.',
                                              type: 'array',
                                              items: {
                                                type: 'string'
                                              },
                                              'x-kubernetes-list-type': 'atomic'
                                            }
                                          }
                                        },
                                        'x-kubernetes-list-type': 'atomic'
                                      },
                                      matchLabels: {
                                        description:
                                          'matchLabels is a map of {key,value} pairs. A single {key,value} in the matchLabels\nmap is equivalent to an element of matchExpressions, whose key field is "key", the\noperator is "In", and the values array contains only "value". The requirements are ANDed.',
                                        type: 'object',
                                        additionalProperties: {
                                          type: 'string'
                                        }
                                      }
                                    },
                                    'x-kubernetes-map-type': 'atomic'
                                  },
                                  namespaces: {
                                    description:
                                      'namespaces specifies a static list of namespace names that the term applies to.\nThe term is applied to the union of the namespaces listed in this field\nand the ones selected by namespaceSelector.\nnull or empty namespaces list and null namespaceSelector means "this pod\'s namespace".',
                                    type: 'array',
                                    items: {
                                      type: 'string'
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  topologyKey: {
                                    description:
                                      'This pod should be co-located (affinity) or not co-located (anti-affinity) with the pods matching\nthe labelSelector in the specified namespaces, where co-located is defined as running on a node\nwhose value of the label with key topologyKey matches that of any node on which any of the\nselected pods is running.\nEmpty topologyKey is not allowed.',
                                    type: 'string'
                                  }
                                }
                              },
                              'x-kubernetes-list-type': 'atomic'
                            }
                          }
                        }
                      }
                    },
                    nodeSelector: {
                      description:
                        '`nodeSelector` allows scheduling of pods only onto nodes that have each of the specified labels.\nFor documentation, refer to https://kubernetes.io/docs/concepts/configuration/assign-pod-node/.',
                      type: 'object',
                      additionalProperties: {
                        type: 'string'
                      },
                      'x-kubernetes-map-type': 'atomic'
                    },
                    priorityClassName: {
                      description:
                        "If specified, indicates the pod's priority. For documentation, refer to https://kubernetes.io/docs/concepts/scheduling-eviction/pod-priority-preemption/#how-to-use-priority-and-preemption.\nIf not specified, default priority is used, or zero if there is no default.",
                      type: 'string'
                    },
                    tolerations: {
                      description:
                        '`tolerations` is a list of tolerations that allow the pod to schedule onto nodes with matching taints.\nFor documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/pod-v1/#scheduling.',
                      type: 'array',
                      items: {
                        description:
                          'The pod this Toleration is attached to tolerates any taint that matches\nthe triple <key,value,effect> using the matching operator <operator>.',
                        type: 'object',
                        properties: {
                          effect: {
                            description:
                              'Effect indicates the taint effect to match. Empty means match all taint effects.\nWhen specified, allowed values are NoSchedule, PreferNoSchedule and NoExecute.',
                            type: 'string'
                          },
                          key: {
                            description:
                              'Key is the taint key that the toleration applies to. Empty means match all taint keys.\nIf the key is empty, operator must be Exists; this combination means to match all values and all keys.',
                            type: 'string'
                          },
                          operator: {
                            description:
                              "Operator represents a key's relationship to the value.\nValid operators are Exists and Equal. Defaults to Equal.\nExists is equivalent to wildcard for value, so that a pod can\ntolerate all taints of a particular category.",
                            type: 'string'
                          },
                          tolerationSeconds: {
                            description:
                              'TolerationSeconds represents the period of time the toleration (which must be\nof effect NoExecute, otherwise this field is ignored) tolerates the taint. By default,\nit is not set, which means tolerate the taint forever (do not evict). Zero and\nnegative values will be treated as 0 (evict immediately) by the system.',
                            type: 'integer',
                            format: 'int64'
                          },
                          value: {
                            description:
                              'Value is the taint value the toleration matches to.\nIf the operator is Exists, the value should be empty, otherwise just a regular string.',
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            enable: {
              description: 'Enables the console plugin deployment.',
              type: 'boolean',
              default: true
            },
            resources: {
              description:
                '`resources`, in terms of compute resources, required by this container.\nFor more information, see https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
              type: 'object',
              default: {
                limits: {
                  memory: '100Mi'
                },
                requests: {
                  cpu: '100m',
                  memory: '50Mi'
                }
              },
              properties: {
                claims: {
                  description:
                    'Claims lists the names of resources, defined in spec.resourceClaims,\nthat are used by this container.\n\nThis is an alpha field and requires enabling the\nDynamicResourceAllocation feature gate.\n\nThis field is immutable. It can only be set for containers.',
                  type: 'array',
                  items: {
                    description: 'ResourceClaim references one entry in PodSpec.ResourceClaims.',
                    type: 'object',
                    required: ['name'],
                    properties: {
                      name: {
                        description:
                          'Name must match the name of one entry in pod.spec.resourceClaims of\nthe Pod where this field is used. It makes that resource available\ninside a container.',
                        type: 'string'
                      },
                      request: {
                        description:
                          'Request is the name chosen for a request in the referenced claim.\nIf empty, everything from the claim is made available, otherwise\nonly the result of this request.',
                        type: 'string'
                      }
                    }
                  },
                  'x-kubernetes-list-map-keys': ['name'],
                  'x-kubernetes-list-type': 'map'
                },
                limits: {
                  description:
                    'Limits describes the maximum amount of compute resources allowed.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                  type: 'object',
                  additionalProperties: {
                    pattern:
                      '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                    anyOf: [
                      {
                        type: 'integer'
                      },
                      {
                        type: 'string'
                      }
                    ],
                    'x-kubernetes-int-or-string': true
                  }
                },
                requests: {
                  description:
                    'Requests describes the minimum amount of compute resources required.\nIf Requests is omitted for a container, it defaults to Limits if that is explicitly specified,\notherwise to an implementation-defined value. Requests cannot exceed Limits.\nMore info: https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/',
                  type: 'object',
                  additionalProperties: {
                    pattern:
                      '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                    anyOf: [
                      {
                        type: 'integer'
                      },
                      {
                        type: 'string'
                      }
                    ],
                    'x-kubernetes-int-or-string': true
                  }
                }
              }
            },
            portNaming: {
              description: '`portNaming` defines the configuration of the port-to-service name translation',
              type: 'object',
              default: {
                enable: true
              },
              properties: {
                enable: {
                  description: 'Enable the console plugin port-to-service name translation',
                  type: 'boolean',
                  default: true
                },
                portNames: {
                  description:
                    '`portNames` defines additional port names to use in the console,\nfor example, `portNames: {"3100": "loki"}`.',
                  type: 'object',
                  additionalProperties: {
                    type: 'string'
                  }
                }
              }
            },
            quickFilters: {
              description: '`quickFilters` configures quick filter presets for the Console plugin',
              type: 'array',
              default: [
                {
                  default: true,
                  filter: {
                    flow_layer: '"app"'
                  },
                  name: 'Applications'
                },
                {
                  filter: {
                    flow_layer: '"infra"'
                  },
                  name: 'Infrastructure'
                },
                {
                  default: true,
                  filter: {
                    dst_kind: '"Pod"',
                    src_kind: '"Pod"'
                  },
                  name: 'Pods network'
                },
                {
                  filter: {
                    dst_kind: '"Service"'
                  },
                  name: 'Services network'
                }
              ],
              items: {
                description: "`QuickFilter` defines preset configuration for Console's quick filters",
                type: 'object',
                required: ['filter', 'name'],
                properties: {
                  default: {
                    description: '`default` defines whether this filter should be active by default or not',
                    type: 'boolean'
                  },
                  filter: {
                    description:
                      '`filter` is a set of keys and values to be set when this filter is selected. Each key can relate to a list of values using a coma-separated string,\nfor example, `filter: {"src_namespace": "namespace1,namespace2"}`.',
                    type: 'object',
                    additionalProperties: {
                      type: 'string'
                    }
                  },
                  name: {
                    description: 'Name of the filter, that is displayed in the Console',
                    type: 'string'
                  }
                }
              }
            },
            imagePullPolicy: {
              description: '`imagePullPolicy` is the Kubernetes pull policy for the image defined above',
              type: 'string',
              default: 'IfNotPresent',
              enum: ['IfNotPresent', 'Always', 'Never']
            },
            autoscaler: {
              description: '`autoscaler` [deprecated (*)] spec of a horizontal pod autoscaler to set up for the plugin Deployment. Deprecation notice: managed autoscaler will be removed in a future version. You may configure instead an autoscaler of your choice, and set `spec.consolePlugin.unmanagedReplicas` to `true`.',
              type: 'object',
              properties: {
                maxReplicas: {
                  description:
                    '`maxReplicas` is the upper limit for the number of pods that can be set by the autoscaler; cannot be smaller than MinReplicas.',
                  type: 'integer',
                  format: 'int32',
                  default: 3
                },
                metrics: {
                  description:
                    'Metrics used by the pod autoscaler. For documentation, refer to https://kubernetes.io/docs/reference/kubernetes-api/workload-resources/horizontal-pod-autoscaler-v2/',
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                      containerResource: {
                        type: 'object',
                        required: ['container', 'name', 'target'],
                        properties: {
                          container: {
                            type: 'string'
                          },
                          name: {
                            type: 'string'
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      external: {
                        type: 'object',
                        required: ['metric', 'target'],
                        properties: {
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      object: {
                        type: 'object',
                        required: ['describedObject', 'metric', 'target'],
                        properties: {
                          describedObject: {
                            type: 'object',
                            required: ['kind', 'name'],
                            properties: {
                              apiVersion: {
                                type: 'string'
                              },
                              kind: {
                                type: 'string'
                              },
                              name: {
                                type: 'string'
                              }
                            }
                          },
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      pods: {
                        type: 'object',
                        required: ['metric', 'target'],
                        properties: {
                          metric: {
                            type: 'object',
                            required: ['name'],
                            properties: {
                              name: {
                                type: 'string'
                              },
                              selector: {
                                type: 'object',
                                properties: {
                                  matchExpressions: {
                                    type: 'array',
                                    items: {
                                      type: 'object',
                                      required: ['key', 'operator'],
                                      properties: {
                                        key: {
                                          type: 'string'
                                        },
                                        operator: {
                                          type: 'string'
                                        },
                                        values: {
                                          type: 'array',
                                          items: {
                                            type: 'string'
                                          },
                                          'x-kubernetes-list-type': 'atomic'
                                        }
                                      }
                                    },
                                    'x-kubernetes-list-type': 'atomic'
                                  },
                                  matchLabels: {
                                    type: 'object',
                                    additionalProperties: {
                                      type: 'string'
                                    }
                                  }
                                },
                                'x-kubernetes-map-type': 'atomic'
                              }
                            }
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      resource: {
                        type: 'object',
                        required: ['name', 'target'],
                        properties: {
                          name: {
                            type: 'string'
                          },
                          target: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                              averageUtilization: {
                                type: 'integer',
                                format: 'int32'
                              },
                              averageValue: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              },
                              type: {
                                type: 'string'
                              },
                              value: {
                                pattern:
                                  '^(\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))(([KMGTPE]i)|[numkMGTPE]|([eE](\\+|-)?(([0-9]+(\\.[0-9]*)?)|(\\.[0-9]+))))?$',
                                anyOf: [
                                  {
                                    type: 'integer'
                                  },
                                  {
                                    type: 'string'
                                  }
                                ],
                                'x-kubernetes-int-or-string': true
                              }
                            }
                          }
                        }
                      },
                      type: {
                        type: 'string'
                      }
                    }
                  }
                },
                minReplicas: {
                  description:
                    '`minReplicas` is the lower limit for the number of replicas to which the autoscaler\ncan scale down. It defaults to 1 pod. minReplicas is allowed to be 0 if the\nalpha feature gate HPAScaleToZero is enabled and at least one Object or External\nmetric is configured. Scaling is active as long as at least one metric value is\navailable.',
                  type: 'integer',
                  format: 'int32'
                },
                status: {
                  description:
                    '`status` describes the desired status regarding deploying an horizontal pod autoscaler.\n- `Disabled` does not deploy an horizontal pod autoscaler.\n- `Enabled` deploys an horizontal pod autoscaler.',
                  type: 'string',
                  default: 'Disabled',
                  enum: ['Disabled', 'Enabled']
                }
              }
            },
            unmanagedReplicas: {
              description: 'If `unmanagedReplicas` is `true`, the operator will not reconcile `replicas`. This is useful when using a pod autoscaler.',
              type: 'boolean',
            },
            replicas: {
              description: '`replicas` defines the number of replicas (pods) to start.',
              type: 'integer',
              format: 'int32',
              default: 1,
              minimum: 0
            }
          }
        },
        networkPolicy: {
          description:
            '`networkPolicy` defines ingress network policy settings for network observability components isolation.',
          type: 'object',
          properties: {
            enable: {
              description:
                'Deploy network policies on the namespaces used by network observability (main and privileged). It is disabled by default.\nThese network policies better isolate the network observability components to prevent undesired connections to them.\nTo increase the security of connections, enable this option or create your own network policy.',
              type: 'boolean'
            },
            additionalNamespaces: {
              description:
                '`additionalNamespaces` contains additional namespaces allowed to connect to the network observability namespace.\nIt provides flexibility in the network policy configuration, but if you need a more specific\nconfiguration, you can disable it and install your own instead.',
              type: 'array',
              items: {
                type: 'string'
              }
            }
          }
        },
        exporters: {
          description: '`exporters` defines additional optional exporters for custom consumption or storage.',
          type: 'array',
          items: {
            description: '`FlowCollectorExporter` defines an additional exporter to send enriched flows to.',
            type: 'object',
            required: ['type'],
            properties: {
              ipfix: {
                description: 'IPFIX configuration, such as the IP address and port to send enriched IPFIX flows to.',
                type: 'object',
                required: ['targetHost', 'targetPort'],
                properties: {
                  targetHost: {
                    description: 'Address of the IPFIX external receiver.',
                    type: 'string',
                    default: ''
                  },
                  targetPort: {
                    description: 'Port for the IPFIX external receiver.',
                    type: 'integer'
                  },
                  transport: {
                    description:
                      'Transport protocol (`TCP` or `UDP`) to be used for the IPFIX connection, defaults to `TCP`.',
                    type: 'string',
                    enum: ['TCP', 'UDP']
                  }
                }
              },
              kafka: {
                description: 'Kafka configuration, such as the address and topic, to send enriched flows to.',
                type: 'object',
                required: ['address', 'topic'],
                properties: {
                  address: {
                    description: 'Address of the Kafka server',
                    type: 'string',
                    default: ''
                  },
                  sasl: {
                    description: 'SASL authentication configuration. [Unsupported (*)].',
                    type: 'object',
                    properties: {
                      clientIDReference: {
                        description: 'Reference to the secret or config map containing the client ID',
                        type: 'object',
                        properties: {
                          file: {
                            description: 'File name within the config map or secret.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing the file.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the file reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      },
                      clientSecretReference: {
                        description: 'Reference to the secret or config map containing the client secret',
                        type: 'object',
                        properties: {
                          file: {
                            description: 'File name within the config map or secret.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing the file.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing the file. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the file reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      },
                      type: {
                        description: 'Type of SASL authentication to use, or `Disabled` if SASL is not used',
                        type: 'string',
                        default: 'Disabled',
                        enum: ['Disabled', 'Plain', 'ScramSHA512']
                      }
                    }
                  },
                  tls: {
                    description:
                      'TLS client configuration. When using TLS, verify that the address matches the Kafka port used for TLS, generally 9093.',
                    type: 'object',
                    properties: {
                      caCert: {
                        description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                        type: 'object',
                        properties: {
                          certFile: {
                            description:
                              '`certFile` defines the path to the certificate file name within the config map or secret.',
                            type: 'string'
                          },
                          certKey: {
                            description:
                              '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing certificates.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the certificate reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      },
                      enable: {
                        description: 'Enable TLS',
                        type: 'boolean',
                        default: false
                      },
                      insecureSkipVerify: {
                        description:
                          '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                        type: 'boolean',
                        default: false
                      },
                      userCert: {
                        description:
                          '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                        type: 'object',
                        properties: {
                          certFile: {
                            description:
                              '`certFile` defines the path to the certificate file name within the config map or secret.',
                            type: 'string'
                          },
                          certKey: {
                            description:
                              '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing certificates.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the certificate reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      }
                    }
                  },
                  topic: {
                    description: 'Kafka topic to use. It must exist. network observability does not create it.',
                    type: 'string',
                    default: ''
                  }
                }
              },
              openTelemetry: {
                description:
                  'OpenTelemetry configuration, such as the IP address and port to send enriched logs or metrics to.',
                type: 'object',
                required: ['targetHost', 'targetPort'],
                properties: {
                  fieldsMapping: {
                    description:
                      'Custom fields mapping to an OpenTelemetry conformant format.\nBy default, network observability format proposal is used: https://github.com/rhobs/observability-data-model/blob/main/network-observability.md#format-proposal .\nAs there is currently no accepted standard for L3 or L4 enriched network logs, you can freely override it with your own.',
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        input: {
                          type: 'string'
                        },
                        multiplier: {
                          type: 'integer'
                        },
                        output: {
                          type: 'string'
                        }
                      }
                    }
                  },
                  headers: {
                    description: 'Headers to add to messages (optional)',
                    type: 'object',
                    additionalProperties: {
                      type: 'string'
                    }
                  },
                  logs: {
                    description: 'OpenTelemetry configuration for logs.',
                    type: 'object',
                    properties: {
                      enable: {
                        description: 'Set `enable` to `true` to send logs to an OpenTelemetry receiver.',
                        type: 'boolean',
                        default: true
                      }
                    }
                  },
                  metrics: {
                    description: 'OpenTelemetry configuration for metrics.',
                    type: 'object',
                    properties: {
                      enable: {
                        description: 'Set `enable` to `true` to send metrics to an OpenTelemetry receiver.',
                        type: 'boolean',
                        default: true
                      },
                      pushTimeInterval: {
                        description: 'Specify how often metrics are sent to a collector.',
                        type: 'string',
                        default: '20s'
                      }
                    }
                  },
                  protocol: {
                    description:
                      'Protocol of the OpenTelemetry connection. The available options are `http` and `grpc`.',
                    type: 'string',
                    enum: ['http', 'grpc']
                  },
                  targetHost: {
                    description: 'Address of the OpenTelemetry receiver.',
                    type: 'string',
                    default: ''
                  },
                  targetPort: {
                    description: 'Port for the OpenTelemetry receiver.',
                    type: 'integer'
                  },
                  tls: {
                    description: 'TLS client configuration.',
                    type: 'object',
                    properties: {
                      caCert: {
                        description: '`caCert` defines the reference of the certificate for the Certificate Authority.',
                        type: 'object',
                        properties: {
                          certFile: {
                            description:
                              '`certFile` defines the path to the certificate file name within the config map or secret.',
                            type: 'string'
                          },
                          certKey: {
                            description:
                              '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing certificates.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the certificate reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      },
                      enable: {
                        description: 'Enable TLS',
                        type: 'boolean',
                        default: false
                      },
                      insecureSkipVerify: {
                        description:
                          '`insecureSkipVerify` allows skipping client-side verification of the server certificate.\nIf set to `true`, the `caCert` field is ignored.',
                        type: 'boolean',
                        default: false
                      },
                      userCert: {
                        description:
                          '`userCert` defines the user certificate reference and is used for mTLS. When you use one-way TLS, you can ignore this property.',
                        type: 'object',
                        properties: {
                          certFile: {
                            description:
                              '`certFile` defines the path to the certificate file name within the config map or secret.',
                            type: 'string'
                          },
                          certKey: {
                            description:
                              '`certKey` defines the path to the certificate private key file name within the config map or secret. Omit when the key is not necessary.',
                            type: 'string'
                          },
                          name: {
                            description: 'Name of the config map or secret containing certificates.',
                            type: 'string'
                          },
                          namespace: {
                            description:
                              'Namespace of the config map or secret containing certificates. If omitted, the default is to use the same namespace as where network observability is deployed.\nIf the namespace is different, the config map or the secret is copied so that it can be mounted as required.',
                            type: 'string',
                            default: ''
                          },
                          type: {
                            description: 'Type for the certificate reference: `configmap` or `secret`.',
                            type: 'string',
                            enum: ['configmap', 'secret']
                          }
                        }
                      }
                    }
                  }
                }
              },
              type: {
                description:
                  '`type` selects the type of exporters. The available options are `Kafka`, `IPFIX`, and `OpenTelemetry`.',
                type: 'string',
                enum: ['Kafka', 'IPFIX', 'OpenTelemetry']
              }
            }
          }
        }
      }
    }
  }
};

// flowMetricSchema is only used in tests or dev console
export const flowMetricSchema: RJSFSchema | any = {
  title: 'FlowMetric',
  description: 'The API allowing to create custom metrics from the collected flow logs.',
  type: 'object',
  properties: {
    apiVersion: {
      type: 'string',
      description:
        'APIVersion defines the versioned schema of this representation of an object.\nServers should convert recognized schemas to the latest internal value, and\nmay reject unrecognized values.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#resources'
    },
    kind: {
      type: 'string',
      description:
        'Kind is a string value representing the REST resource this object represents.\nServers may infer this from the endpoint the client submits requests to.\nCannot be updated.\nIn CamelCase.\nMore info: https://git.k8s.io/community/contributors/devel/sig-architecture/api-conventions.md#types-kinds'
    },
    metadata: {
      type: 'object',
      properties: {
        namespace: {
          type: 'string',
          default: 'netobserv'
        },
        name: {
          type: 'string',
          default: 'example'
        },
        labels: {
          type: 'object',
          properties: {},
          additionalProperties: {
            type: 'string'
          }
        }
      },
      required: ['name']
    },
    spec: {
      type: 'object',
      description:
        'FlowMetricSpec defines the desired state of FlowMetric\nThe provided API allows you to customize these metrics according to your needs.<br>\nWhen adding new metrics or modifying existing labels, you must carefully monitor the memory\nusage of Prometheus workloads as this could potentially have a high impact. Cf https://rhobs-handbook.netlify.app/products/openshiftmonitoring/telemetry.md/#what-is-the-cardinality-of-a-metric<br>\nTo check the cardinality of all NetObserv metrics, run as `promql`: `count({__name__=~"netobserv.*"}) by (__name__)`.',
      required: ['metricName', 'type'],
      properties: {
        metricName: {
          description: 'Name of the metric. In Prometheus, it is automatically prefixed with "netobserv_".',
          type: 'string'
        },
        type: {
          description:
            'Metric type: "Counter" or "Histogram".\nUse "Counter" for any value that increases over time and on which you can compute a rate, such as Bytes or Packets.\nUse "Histogram" for any value that must be sampled independently, such as latencies.',
          type: 'string',
          enum: ['Counter', 'Histogram']
        },
        buckets: {
          description:
            'A list of buckets to use when `type` is "Histogram". The list must be parsable as floats. When not set, Prometheus default buckets are used.',
          type: 'array',
          items: {
            type: 'string'
          }
        },
        valueField: {
          description:
            '`valueField` is the flow field that must be used as a value for this metric. This field must hold numeric values.\nLeave empty to count flows rather than a specific value per flow.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.',
          type: 'string'
        },
        divider: {
          description: 'When nonzero, scale factor (divider) of the value. Metric value = Flow value / Divider.',
          type: 'string'
        },
        labels: {
          description:
            '`labels` is a list of fields that should be used as Prometheus labels, also known as dimensions.\nFrom choosing labels results the level of granularity of this metric, and the available aggregations at query time.\nIt must be done carefully as it impacts the metric cardinality (cf https://rhobs-handbook.netlify.app/products/openshiftmonitoring/telemetry.md/#what-is-the-cardinality-of-a-metric).\nIn general, avoid setting very high cardinality labels such as IP or MAC addresses.\n"SrcK8S_OwnerName" or "DstK8S_OwnerName" should be preferred over "SrcK8S_Name" or "DstK8S_Name" as much as possible.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.',
          type: 'array',
          items: {
            type: 'string'
          }
        },
        flatten: {
          description:
            '`flatten` is a list of array-type fields that must be flattened, such as Interfaces or NetworkEvents. Flattened fields generate one metric per item in that field.\nFor instance, when flattening `Interfaces` on a bytes counter, a flow having Interfaces [br-ex, ens5] increases one counter for `br-ex` and another for `ens5`.',
          type: 'array',
          items: {
            type: 'string'
          }
        },
        remap: {
          description:
            'Set the `remap` property to use different names for the generated metric labels than the flow fields. Use the origin flow fields as keys, and the desired label names as values.',
          type: 'string'
        },
        direction: {
          description:
            'Filter for ingress, egress or any direction flows.\nWhen set to `Ingress`, it is equivalent to adding the regular expression filter on `FlowDirection`: `0|2`.\nWhen set to `Egress`, it is equivalent to adding the regular expression filter on `FlowDirection`: `1|2`.',
          type: 'string',
          default: 'Any',
          enum: ['Any', 'Egress', 'Ingress']
        },
        filters: {
          description:
            '`filters` is a list of fields and values used to restrict which flows are taken into account. Oftentimes, these filters must\nbe used to eliminate duplicates: `Duplicate != "true"` and `FlowDirection = "0"`.\nRefer to the documentation for the list of available fields: https://docs.openshift.com/container-platform/latest/observability/network_observability/json-flows-format-reference.html.',
          type: 'array',
          items: {
            type: 'object',
            required: ['field', 'matchType'],
            properties: {
              field: {
                description: 'Name of the field to filter on',
                type: 'string'
              },
              matchType: {
                description: 'Type of matching to apply',
                type: 'string',
                default: 'Equal',
                enum: ['Equal', 'NotEqual', 'Presence', 'Absence', 'MatchRegex', 'NotMatchRegex']
              },
              value: {
                description:
                  'Value to filter on. When `matchType` is `Equal` or `NotEqual`, you can use field injection with `$(SomeField)` to refer to any other field of the flow.',
                type: 'string'
              }
            }
          }
        },
        charts: {
          description: 'Charts configuration, for the OpenShift Console in the administrator view, Dashboards menu.',
          type: 'array',
          items: {
            description: 'Configures charts / dashboard generation associated to a metric',
            type: 'object',
            required: ['dashboardName', 'queries', 'title', 'type'],
            properties: {
              dashboardName: {
                description:
                  'Name of the containing dashboard. If this name does not refer to an existing dashboard, a new dashboard is created.',
                type: 'string',
                default: 'Main'
              },
              sectionName: {
                description:
                  'Name of the containing dashboard section. If this name does not refer to an existing section, a new section is created.\nIf `sectionName` is omitted or empty, the chart is placed in the global top section.',
                type: 'string'
              },
              title: {
                description: 'Title of the chart.',
                type: 'string'
              },
              unit: {
                description:
                  'Unit of this chart. Only a few units are currently supported. Leave empty to use generic number.',
                type: 'string',
                enum: ['bytes', 'seconds', 'Bps', 'pps', 'percent', '']
              },
              type: {
                description: 'Type of the chart.',
                type: 'string',
                enum: ['SingleStat', 'Line', 'StackArea']
              },
              queries: {
                description:
                  'List of queries to be displayed on this chart. If `type` is `SingleStat` and multiple queries are provided,\nthis chart is automatically expanded in several panels (one per query).',
                type: 'array',
                items: {
                  description: 'Configures PromQL queries',
                  type: 'object',
                  required: ['legend', 'promQL', 'top'],
                  properties: {
                    promQL: {
                      description:
                        'The `promQL` query to be run against Prometheus. If the chart `type` is `SingleStat`, this query should only return\na single timeseries. For other types, a top 7 is displayed.\nYou can use `$METRIC` to refer to the metric defined in this resource. For example: `sum(rate($METRIC[2m]))`.\nTo learn more about `promQL`, refer to the Prometheus documentation: https://prometheus.io/docs/prometheus/latest/querying/basics/',
                      type: 'string'
                    },
                    legend: {
                      description:
                        'The query legend that applies to each timeseries represented in this chart. When multiple timeseries are displayed, you should set a legend\nthat distinguishes each of them. It can be done with the following format: `{{ Label }}`. For example, if the `promQL` groups timeseries per\nlabel such as: `sum(rate($METRIC[2m])) by (Label1, Label2)`, you may write as the legend: `Label1={{ Label1 }}, Label2={{ Label2 }}`.',
                      type: 'string'
                    },
                    top: {
                      description: 'Top N series to display per timestamp. Does not apply to `SingleStat` chart type.',
                      type: 'integer',
                      default: 7,
                      minimum: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
