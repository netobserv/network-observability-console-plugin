import * as React from 'react';
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';
import { Text } from '@patternfly/react-core';
import { TopologyMetricPeer } from '../../api/loki';
import { peerNameAndKind } from '../../utils/metrics';

export const PeerResourceLink: React.FC<{ fields: Partial<TopologyMetricPeer> }> = ({ fields }) => {
  const nk = peerNameAndKind(fields, false);
  if (nk) {
    if (nk.kind) {
      return <ResourceLink inline={true} kind={nk.kind} name={nk.name} namespace={fields.namespace} />;
    } else {
      return <Text>{nk.name}</Text>;
    }
  }
  return null;
};
