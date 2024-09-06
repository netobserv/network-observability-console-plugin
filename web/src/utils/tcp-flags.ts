import { ReadOnlyValue, ReadOnlyValues } from './values';

export const getTCPFlagsDocUrl = () => {
  return 'https://www.rfc-editor.org/rfc/rfc9293';
};

export const tcpFlagsList: ReadOnlyValues = [
  { value: 1, name: 'FIN', description: 'No more data from sender' },
  { value: 2, name: 'SYN', description: 'Synchronize sequence numbers' },
  { value: 4, name: 'RST', description: 'Reset the connection' },
  { value: 8, name: 'PSH', description: 'Push function' },
  { value: 16, name: 'ACK', description: 'Acknowledgement field is significant' },
  { value: 32, name: 'URG', description: 'Urgent pointer field is significant' },
  { value: 64, name: 'ECE', description: 'ECN-Echo' },
  { value: 128, name: 'CWR', description: 'Congestion Window Reduced' },
  { value: 256, name: 'SYN_ACK', description: 'Acknowledgement of SYN (custom flag)' },
  { value: 512, name: 'FIN_ACK', description: 'Acknowledgement of FIN (custom flag)' },
  { value: 1024, name: 'RST_ACK', description: 'Acknowledgement of RST (custom flag)' }
] as const;

export const decomposeTCPFlagsBitfield = (bitfield: number): ReadOnlyValues => {
  const values: ReadOnlyValue[] = [];
  tcpFlagsList.forEach(flag => {
    if (bitfield & flag.value) {
      values.push(flag);
    }
  });
  return values;
};
