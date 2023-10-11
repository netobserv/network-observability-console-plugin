export const getDSCPDocUrl = () => {
  return 'https://www.rfc-editor.org/rfc/rfc4594';
};

export type DSCP_SERVICE_CLASS_NAMES =
  | 'Network Control'
  | 'Telephony'
  | 'Signaling'
  | 'Multimedia Conferencing'
  | 'Real-Time Interactive'
  | 'Multimedia Streaming'
  | 'Broadcast Video'
  | 'Low-Latency Data'
  | 'OAM'
  | 'High-Throughput Data'
  | 'Standard'
  | 'Low-Priority Data';

export const getDSCPServiceClassName = (dscp: number): DSCP_SERVICE_CLASS_NAMES | undefined => {
  switch (dscp) {
    case 48:
      return 'Network Control';
    case 46:
      return 'Telephony';
    case 40:
      return 'Signaling';
    case 38:
    case 34:
    case 36:
      return 'Multimedia Conferencing';
    case 32:
      return 'Real-Time Interactive';
    case 30:
    case 28:
    case 26:
      return 'Multimedia Streaming';
    case 24:
      return 'Broadcast Video';
    case 22:
    case 20:
    case 18:
      return 'Low-Latency Data';
    case 16:
      return 'OAM';
    case 14:
    case 12:
    case 10:
      return 'High-Throughput Data';
    case 0:
      return 'Standard';
    case 8:
      return 'Low-Priority Data';
    default:
      return undefined;
  }
};

export const getDSCPServiceClassDescription = (serviceClassName: DSCP_SERVICE_CLASS_NAMES): string => {
  switch (serviceClassName) {
    case 'Network Control':
      return 'Network routing';
    case 'Telephony':
      return 'IP Telephony bearer';
    case 'Signaling':
      return 'IP Telephony signaling';
    case 'Multimedia Conferencing':
      return 'H.323/V2 video conferencing (adaptive)';
    case 'Real-Time Interactive':
      return 'Video conferencing and nteractive gaming';
    case 'Multimedia Streaming':
      return 'Streaming video and audio on demand';
    case 'Broadcast Video':
      return 'Broadcast TV & live events';
    case 'Low-Latency Data':
      return 'Client/server transactions Web-based ordering';
    case 'OAM':
      return 'OAM&P';
    case 'High-Throughput Data':
      return 'Store and forward applications';
    case 'Standard':
      return 'Undifferentiated applications';
    case 'Low-Priority Data':
      return 'Any flow that has no BW assurance';
  }
};
