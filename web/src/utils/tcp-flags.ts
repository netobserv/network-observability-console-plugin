export const getTCPFlagsDocUrl = () => {
  return 'https://www.rfc-editor.org/rfc/rfc9293';
};

export const tcpFlagsList = [
  { name: 'FIN', description: 'No more data from sender' },
  { name: 'SYN', description: 'Synchronize sequence numbers' },
  { name: 'RST', description: 'Reset the connection' },
  { name: 'PSH', description: 'Push function' },
  { name: 'ACK', description: 'Acknowledgement field is significant' },
  { name: 'URG', description: 'Urgent pointer field is significant' },
  { name: 'ECE', description: 'ECN-Echo' },
  { name: 'CWR', description: 'Congestion Window Reduced' },
  { name: 'SYN_ACK', description: 'Acknowledgement of SYN (custom flag)' },
  { name: 'FIN_ACK', description: 'Acknowledgement of FIN (custom flag)' },
  { name: 'RST_ACK', description: 'Acknowledgement of RST (custom flag)' }
] as const;

export const getFlagsList = (joined: string): { name: string, description: string}[] => {
  const names = joined.split(',');
  return tcpFlagsList.filter(f => names.includes(f.name));
};
