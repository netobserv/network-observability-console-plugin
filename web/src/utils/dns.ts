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
        } else if(found.fields.DnsResponseTimeMs && r.fields.DnsRequestTimeMs) {
          r.fields.DnsLatencyMs = found.fields.DnsResponseTimeMs - r.fields.DnsRequestTimeMs;
        }
      }
    }
  });
  return records;
};
