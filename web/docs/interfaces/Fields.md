# Interface: Fields

## Properties

### SrcAddr

• **SrcAddr**: `string`

Source IP address (ipv4 or ipv6)

___

### DstAddr

• **DstAddr**: `string`

Destination IP address (ipv4 or ipv6)

___

### SrcMac

• **SrcMac**: `string`

Source MAC address

___

### DstMac

• **DstMac**: `string`

Destination MAC address

___

### SrcK8S\_Name

• `Optional` **SrcK8S\_Name**: `string`

Name of the source matched Kubernetes object, such as Pod name, Service name, etc.

___

### DstK8S\_Name

• `Optional` **DstK8S\_Name**: `string`

Name of the destination matched Kubernetes object, such as Pod name, Service name, etc.

___

### SrcK8S\_Type

• `Optional` **SrcK8S\_Type**: `string`

Kind of the source matched Kubernetes object, such as Pod, Service, etc.

___

### DstK8S\_Type

• `Optional` **DstK8S\_Type**: `string`

Kind of the destination matched Kubernetes object, such as Pod name, Service name, etc.

___

### SrcPort

• **SrcPort**: `number`

Source port

___

### DstPort

• **DstPort**: `number`

Destination port

___

### SrcK8S\_OwnerType

• `Optional` **SrcK8S\_OwnerType**: `string`

Kind of the source Kubernetes owner, such as Deployment, StatefulSet, etc.

___

### DstK8S\_OwnerType

• `Optional` **DstK8S\_OwnerType**: `string`

Kind of the destination Kubernetes owner, such as Deployment, StatefulSet, etc.

___

### SrcK8S\_HostIP

• `Optional` **SrcK8S\_HostIP**: `string`

Source node IP

___

### DstK8S\_HostIP

• `Optional` **DstK8S\_HostIP**: `string`

Destination node IP

___

### SrcK8S\_HostName

• `Optional` **SrcK8S\_HostName**: `string`

Source node name

___

### DstK8S\_HostName

• `Optional` **DstK8S\_HostName**: `string`

Destination node name

___

### Proto

• **Proto**: `number`

L4 protocol

___

### Interface

• `Optional` **Interface**: `string`

Network interface

___

### Packets

• **Packets**: `number`

Number of packets in this flow

___

### Packets\_AB

• `Optional` **Packets\_AB**: `number`

In conversation tracking, A to B packets counter per conversation

___

### Packets\_BA

• `Optional` **Packets\_BA**: `number`

In conversation tracking, B to A packets counter per conversation

___

### Bytes

• **Bytes**: `number`

Number of bytes in this flow

___

### Bytes\_AB

• `Optional` **Bytes\_AB**: `number`

In conversation tracking, A to B bytes counter per conversation

___

### Bytes\_BA

• `Optional` **Bytes\_BA**: `number`

In conversation tracking, B to A bytes counter per conversation

___

### TimeFlowStartMs

• **TimeFlowStartMs**: `number`

Start timestamp of this flow, in milliseconds

___

### TimeFlowEndMs

• **TimeFlowEndMs**: `number`

End timestamp of this flow, in milliseconds

___

### TimeReceived

• **TimeReceived**: `number`

Timestamp when this flow was received and processed by the flow collector, in seconds

___

### \_HashId

• `Optional` **\_HashId**: `string`

In conversation tracking, the conversation identifier

___

### \_IsFirst

• `Optional` **\_IsFirst**: `string`

In conversation tracking, flag identifying the first flow

___

### numFlowLogs

• `Optional` **numFlowLogs**: `number`

In conversation tracking, a counter of flow logs per conversation
