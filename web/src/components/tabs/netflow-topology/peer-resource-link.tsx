import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Text } from '@patternfly/react-core';
import * as React from 'react';
import { TopologyMetricPeer } from '../../../api/loki';

export interface PeerResourceLinkProps {
  peer: TopologyMetricPeer;
}

export const PeerResourceLink: React.FC<PeerResourceLinkProps> = ({ peer }) => {
  const name = peer.getDisplayName(false, false);
  if (name) {
    if (peer.resourceKind) {
      return <ResourceLink inline={true} kind={peer.resourceKind} name={name} namespace={peer.namespace} />;
    } else {
      return <Text>{name}</Text>;
    }
  }
  return null;
};
