import { Content, ContentVariants, Flex, FlexItem } from '@patternfly/react-core';
import * as React from 'react';
import { TopologyMetricPeer } from '../../../api/loki';
import { Filter, FilterDefinition } from '../../../model/filters';
import { NodeType } from '../../../model/flow-query';
import { PeerResourceLink } from '../../tabs/netflow-topology/peer-resource-link';
import { SummaryFilterButton } from '../../toolbar/filters/summary-filter-button';

export interface ElementFieldProps {
  id: string;
  label: string;
  filterType: NodeType;
  forcedText?: string;
  peer: TopologyMetricPeer;
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
  filterDefinitions: FilterDefinition[];
}

export const ElementField: React.FC<ElementFieldProps> = ({
  id,
  label,
  filterType,
  forcedText,
  peer,
  activeFilters,
  setFilters,
  filterDefinitions
}) => {
  return (
    <div id={id} className="record-field-container">
      <Content component={ContentVariants.h4}>{label}</Content>
      <Flex>
        <FlexItem flex={{ default: 'flex_1' }}>
          {forcedText ? <Content>{forcedText}</Content> : <PeerResourceLink peer={peer} />}
        </FlexItem>
        <FlexItem>
          <SummaryFilterButton
            id={id + '-filter'}
            activeFilters={activeFilters}
            filterType={filterType}
            fields={peer}
            setFilters={setFilters}
            filterDefinitions={filterDefinitions}
          />
        </FlexItem>
      </Flex>
    </div>
  );
};
