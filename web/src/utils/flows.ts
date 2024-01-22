import * as _ from 'lodash';
import { Record } from '../api/ipfix';
import { get5Tuple } from './ids';

export const mergeFlowReporters = (flows: Record[]): Record[] => {
  // The purpose of this function is to determine if, for a given 5 tuple, we'll look at INGRESS, EGRESS or INNER reporter
  // The assumption is that INGRESS alone, EGRESS alone or INNER alone always provide a complete visiblity
  // Favor whichever contains pktDrop and/or DNS responses
  const grouped = _.groupBy(flows, get5Tuple);
  const filtersIndex = _.mapValues(
    grouped,
    (recs: Record[]) =>
      (
        recs.find(
          r =>
            r.fields.DnsId !== undefined || r.fields.PktDropBytes !== undefined || r.fields.PktDropPackets !== undefined
        ) || recs[0]
      ).labels.FlowDirection!
  );
  return flows.filter((r: Record) => r.labels.FlowDirection! === filtersIndex[get5Tuple(r)]);
};
