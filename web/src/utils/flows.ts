import * as _ from 'lodash';
import { FlowDirection, Record } from '../api/ipfix';
import { get5Tuple } from './ids';

export const mergeFlowReporters = (flows: Record[]): Record[] => {
  // The purpose of this function is to determine if, for a given 5 tuple, we'll look at INGRESS or EGRESS reporter
  // The assumption is that INGRESS alone, or EGRESS alone always provide a complete visiblity however
  // Ingress traffic will also contains pktDrop and DNS responses
  // The logic is to index flows by 5 tuples, then for each indexed set, keep only the INGRESS if present, otherwise EGRESS
  const grouped = _.groupBy(flows, get5Tuple);
  const filtersIndex = _.mapValues(
    grouped,
    (recs: Record[]) =>
      (recs.find(r => r.labels.FlowDirection === FlowDirection.Ingress) || recs[0]).labels.FlowDirection
  );
  return flows.filter((r: Record) => r.labels.FlowDirection === filtersIndex[get5Tuple(r)]);
};
