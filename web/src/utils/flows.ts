import * as _ from 'lodash';
import { Record } from '../api/ipfix';

export const mergeFlowReporters = (flows: Record[]): Record[] => {
  // The purpose of this function is to determine if, for a given [srcip, dstip] couple, we'll look at INGRESS or EGRESS reporter
  // The assumption is that INGRESS alone, or EGRESS alone, or both of them, always provide a complete visiblity, so we can just pick one of the two.
  // The logic if then to index flows by src+dest ips, then for each indexed set, keep only the first-found reporter
  const keyFunc = (r: Record) => r.fields.SrcAddr + '+' + r.fields.DstAddr;
  const grouped = _.groupBy(flows, keyFunc);
  const filtersIndex = _.mapValues(grouped, (recs: Record[]) => recs[0].labels.FlowDirection);
  return flows.filter((r: Record) => r.labels.FlowDirection === filtersIndex[keyFunc(r)]);
};
