
export interface NetworkEvent {
	Feature?:     string;
	Type?: string;
	Action?:    string;
	Name?:      string;
	Namespace?: string;
	Direction?: string;
	Message?: string;
}

export const networkEventToString = (event: NetworkEvent) => {
  if (event.Feature === 'acl') {
    let action: string;
    switch (event.Action) {
    case 'allow':
    case 'allow-related':
    case 'allow-stateless':
      action = "Allowed";
      break;
    case 'drop':
      action = "Dropped";
      break;
    case 'pass':
      action = "Delegated to network policy";
      break;
    default:
      action = "Action " + event.Action
      break;
    }
    let msg: string = '';
    switch (event.Type) {
    case 'AdminNetworkPolicy':
      msg = `admin network policy ${event.Name}, direction ${event.Direction}`;
      break;
    case 'BaselineAdminNetworkPolicy':
      msg = `baseline admin network policy ${event.Name}, direction ${event.Direction}`;
      break;
    case 'MulticastNS':
      msg = `multicast in namespace ${event.Namespace}, direction ${event.Direction}`;
      break;
    case 'MulticastCluster':
      msg = `cluster multicast policy, direction ${event.Direction}`;
      break;
    case 'NetpolNode':
      msg = `default allow from local node policy, direction ${event.Direction}`;
      break;
    case 'NetworkPolicy':
      msg = `network policy ${event.Name}, direction ${event.Direction}`;
      break;
    case 'NetpolNamespace':
      msg = `network policies isolation in namespace ${event.Namespace}, direction ${event.Direction}`;
      break;
    case 'EgressFirewall':
      msg = `egress firewall in namespace ${event.Namespace}`;
      break;
    case 'UDNIsolation':
      msg = `UDN isolation of type ${event.Name}`;
      break;
    }
    return `${action} by ${msg}`;
  }
  return event.Message;
}
