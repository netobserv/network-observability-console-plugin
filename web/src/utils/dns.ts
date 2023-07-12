import { Record } from '../api/ipfix';

/**
 * setRecordsDNSTimes check from provided records matching DNS IDs and set DnsRequestTimeMs / DnsResponseTimeMs
 * As the set of records may not contains all the pairs, some informations may be missing
 * @param records
 * @returns records
 */
export const setRecordsDNSTimes = (records: Record[]): Record[] => {
  records.forEach(r => {
    if (r.fields.DnsId && (!r.fields.DnsRequestTimeMs || !r.fields.DnsResponseTimeMs)) {
      const found = records.find(rc => r !== rc && r.fields.DnsId === rc.fields.DnsId);
      if (found) {
        if (r.fields.DnsResponseTimeMs && found.fields.DnsRequestTimeMs) {
          r.fields.DnsLatencyMs = r.fields.DnsResponseTimeMs - found.fields.DnsRequestTimeMs;
        } else if (found.fields.DnsResponseTimeMs && r.fields.DnsRequestTimeMs) {
          r.fields.DnsLatencyMs = found.fields.DnsResponseTimeMs - r.fields.DnsRequestTimeMs;
        }
      }
    }
  });
  return records;
};

export type DNSRcode = {
  code: number;
  name: string;
  description: string;
};

// https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-6
export const DNS_RCODES = [
  { value: 0, name: 'NoError', description: 'No Error' },
  { value: 1, name: 'FormErr', description: 'Format Error' },
  { value: 2, name: 'ServFail', description: 'Server Failure' },
  { value: 3, name: 'NXDomain', description: 'Non-Existent Domain' },
  { value: 4, name: 'NotImp', description: 'Not Implemented' },
  { value: 5, name: 'Refused', description: 'Query Refused' },
  { value: 6, name: 'YXDomain', description: 'Name Exists when it should not' },
  { value: 7, name: 'YXRRSet', description: 'RR Set Exists when it should not' },
  { value: 8, name: 'NXRRSet', description: 'RR Set that should exist does not' },
  //{ value: 9, name: 'NotAuth', description: 'Server Not Authoritative for zone' },
  { value: 9, name: 'NotAuth', description: 'Not Authorized' },
  { value: 10, name: 'NotZone', description: 'Name not contained in zone' },
  //{ value: 11, name: 'DSOTYPENI', description: 'DSO-TYPE Not Implemented' },
  { value: 16, name: 'BADVERS', description: 'Bad OPT Version' },
  //{ value:16, name: 'BADSIG', description: 'TSIG Signature Failure' },
  { value: 17, name: 'BADKEY', description: 'Key not recognized' },
  { value: 18, name: 'BADTIME', description: 'Signature out of time window' },
  { value: 19, name: 'BADMODE', description: 'Bad TKEY Mode' },
  { value: 20, name: 'BADNAME', description: 'Duplicate key name' },
  { value: 21, name: 'BADALG', description: 'Algorithm not supported' },
  { value: 22, name: 'BADTRUNC', description: 'Bad Truncation' },
  { value: 23, name: 'BADCOOKIE', description: 'Bad/missing Server Cookie' }
] as const;

const dnsRcodesValues = DNS_RCODES.map(v => v.value);
export type DNS_RCODES_VALUES = typeof dnsRcodesValues[number];

const dnsRcodesNames = DNS_RCODES.map(v => v.name);
export type DNS_CODE_NAMES = typeof dnsRcodesNames[number];

export const getDNSRcodeDescription = (name: DNS_CODE_NAMES): string => {
  return DNS_RCODES.find(v => v.name === name)?.description || 'Unassigned';
};
