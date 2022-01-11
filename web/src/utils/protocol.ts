import protocols from 'protocol-numbers';
import { compareStrings } from './base-compare';

export const formatProtocol = (p: number) => {
  if (p !== undefined) {
    return protocols[p].name;
  } else {
    return 'N/A';
  }
};

export const compareProtocols = (p1: number, p2: number) => {
  return compareStrings(protocols[p1]?.name, protocols[p2]?.name);
};
