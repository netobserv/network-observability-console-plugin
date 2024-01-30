/* This file contains id generation reused by QE team
 *  Please keep them updated of any change
 */

import { Record } from '../api/ipfix';
import { TopologyMetricPeer } from '../api/loki';

export const idUnknown = '-';

/**
 * getTopologyEdgeId gets a unique edge id between two nodes
 * source / target can be inverted. If one of these pairs already exists, the opposit will not be created
 * @param sourceId string that represent a NodeId
 * @param targetId string that represent another NodeId
 * @returns string that identify the edge
 */
export const getTopologyEdgeId = (sourceId: string, targetId: string) => {
  return `${sourceId}.${targetId}`.toLowerCase();
};

/**
 * getPeerId gets a unique peer id for provided set of fields
 * @param fields list of fields returned from metrics that identify the element
 * @returns string that identify the peer
 */
export const getPeerId = (fields: Partial<TopologyMetricPeer>): string => {
  const parts = [];
  if (fields.clusterName) {
    parts.push('c=' + fields.clusterName);
  }
  if (fields.zone) {
    parts.push('z=' + fields.zone);
  }
  if (fields.hostName) {
    parts.push('h=' + fields.hostName);
  }
  if (fields.namespace) {
    parts.push('n=' + fields.namespace);
  }
  if (fields.owner) {
    parts.push('o=' + fields.owner.type + '.' + fields.owner.name);
  }
  if (fields.resource) {
    parts.push('r=' + fields.resource.type + '.' + fields.resource.name);
  }
  if (fields.addr) {
    parts.push('a=' + fields.addr);
  }
  return parts.length > 0 ? parts.join(',') : idUnknown;
};

export const get5Tuple = (r: Record): string => {
  return `${r.fields.SrcAddr}:${r.fields.SrcPort || 'x'}→${r.fields.DstAddr}:${r.fields.DstPort || 'x'}@${
    r.fields.Proto
  }`;
};
