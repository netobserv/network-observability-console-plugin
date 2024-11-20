import * as _ from 'lodash';
import { IfDirection, Record } from '../api/ipfix';
import { get5Tuple } from './ids';

const electMostRelevant = (flowsFor5Tuples: Record[]): Record => {
  // Get most relevant record, in priority with Dns or Drops info
  // Fallback on first entry
  return (
    flowsFor5Tuples.find(
      f =>
        f.fields.DnsId !== undefined ||
        f.fields.PktDropBytes !== undefined ||
        f.fields.PktDropPackets !== undefined ||
        f.fields.NetworkEvents !== undefined
    ) || flowsFor5Tuples[0]
  );
};

const getInvolvedInterfaces = (flowsFor5Tuples: Record[]): { ifnames: string[]; ifdirs: IfDirection[] } => {
  const cache = new Set();
  const ifnames: string[] = [];
  const ifdirs: IfDirection[] = [];
  flowsFor5Tuples.forEach(f => {
    if (f.fields.IfDirections && f.fields.Interfaces) {
      _.zip(f.fields.IfDirections, f.fields.Interfaces).forEach(([ifdir, ifname]) => {
        const key = `${ifdir}@${ifname}`;
        if (!cache.has(key)) {
          cache.add(key);
          ifnames.push(ifname!);
          ifdirs.push(ifdir!);
        }
      });
    }
  });
  return { ifnames, ifdirs };
};

export const mergeFlowReporters = (flows: Record[]): Record[] => {
  // The purpose of this function is to determine if, for a given 5 tuple, we'll look at INGRESS, EGRESS or INNER reporter
  // The assumption is that INGRESS alone, EGRESS alone or INNER alone always provide a complete visiblity
  // Favor whichever contains pktDrop and/or DNS responses
  const grouped = _.groupBy(flows, get5Tuple);
  const filtersIndex = _.mapValues(grouped, (records: Record[]) => electMostRelevant(records));
  const involvedInterfaces = _.mapValues(grouped, (records: Record[]) => getInvolvedInterfaces(records));
  // Filter and inject other interfaces in elected flows
  // An assumption is made that interfaces involved for a 5 tuples will keep being involved in the whole flows sequence
  // If that assumption proves wrong, we may refine by looking at time overlaps between flows
  return flows
    .filter((r: Record) => r.labels.FlowDirection === filtersIndex[get5Tuple(r)].labels.FlowDirection)
    .map(r => {
      const interfaces = involvedInterfaces[get5Tuple(r)];
      if (interfaces) {
        r.fields.Interfaces = interfaces.ifnames;
        r.fields.IfDirections = interfaces.ifdirs;
      }
      return r;
    });
};
