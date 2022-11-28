import * as React from 'react';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Text } from '@patternfly/react-core';
import { TopologyMetricPeer } from '../../api/loki';

export const PeerResourceLink: React.FC<{ peer: TopologyMetricPeer }> = ({ peer }) => {
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
