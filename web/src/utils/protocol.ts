import protocols from 'protocol-numbers';
import { compareStrings } from './base-compare';

export const getProtocolDocUrl = () => {
  return 'https://www.iana.org/assignments/protocol-numbers/protocol-numbers.xhtml';
};

export const formatProtocol = (p: number) => {
  if (p !== undefined && protocols[p]) {
    return protocols[p].name;
  } else {
    return 'N/A';
  }
};

export const compareProtocols = (p1: number, p2: number) => {
  return compareStrings(protocols[p1]?.name, protocols[p2]?.name);
};
