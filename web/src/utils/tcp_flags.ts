import { ReadOnlyValues } from './values';

export const getTCPFlagsDocUrl = () => {
  return 'https://www.rfc-editor.org/rfc/rfc9293';
};

export const TCPFlags_VALUES: ReadOnlyValues = [
  { value: 1, name: 'FIN', description: 'No more data from sender' },
  { value: 2, name: 'SYN', description: 'Synchronize sequence numbers' },
  { value: 3, name: 'FIN_SYN', description: 'Custom flag indicating both FIN and SYN flags are set' },
  { value: 4, name: 'RST', description: 'Reset the connection' },
  { value: 5, name: 'FIN_RST', description: 'Custom flag indicating both FIN and RST flags are set' },
  { value: 6, name: 'SYN_RST', description: 'Custom flag indicating both SYN and RST flags are set' },
  { value: 7, name: 'FIN_SYN_RST', description: 'Custom flag indicating FIN, SYN and RST flags are set' },
  { value: 8, name: 'PSH', description: 'Push function' },
  { value: 16, name: 'ACK', description: 'Acknowledgement field is significant' },
  { value: 32, name: 'URG', description: 'Urgent pointer field is significant' },
  { value: 64, name: 'ECE', description: 'ECN-Echo' },
  { value: 128, name: 'CWR', description: 'Congestion Window Reduced' },
  { value: 256, name: 'SYN_ACK', description: 'Custom flag indicating both SYN and ACK flags are set' },
  { value: 512, name: 'FIN_ACK', description: 'Custom flag indicating both FIN and ACK flags are set' },
  { value: 1024, name: 'RST_ACK', description: 'Custom flag indicating both RST and ACK flags are set' }
] as const;

const tcpFlagsNames = TCPFlags_VALUES.map(v => v.name);
export type TCPFLAGS_SERVICE_CLASS_NAMES = typeof tcpFlagsNames[number];

export const gettcpFlagsServiceClassName = (flags: number): TCPFLAGS_SERVICE_CLASS_NAMES | undefined => {
  return TCPFlags_VALUES.find(v => v.value === flags)?.name;
};

const tcpFlagsDescriptions = TCPFlags_VALUES.map(v => v.description);
export type TCPFLAGS_SERVICE_CLASS_DESCRIPTIONS = typeof tcpFlagsDescriptions[number];

export const gettcpFlagsServiceClassDescription = (flags: number): TCPFLAGS_SERVICE_CLASS_DESCRIPTIONS | undefined => {
  return TCPFlags_VALUES.find(v => v.value === flags)?.description;
};
