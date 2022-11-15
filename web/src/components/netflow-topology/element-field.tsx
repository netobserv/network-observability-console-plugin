import { Flex, FlexItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { NodeType } from '../../model/flow-query';
import { TopologyMetricPeer } from '../../api/loki';
import { Filter } from '../../model/filters';
import { SummaryFilterButton } from '../filters/summary-filter-button';
import { PeerResourceLink } from './peer-resource-link';

export const ElementField: React.FC<{
  id: string;
  label: string;
  filterType: NodeType;
  forcedText?: string;
  fields: Partial<TopologyMetricPeer>;
  activeFilters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ id, label, filterType, forcedText, fields, activeFilters, setFilters }) => {
  return (
    <TextContent id={id} className="record-field-container">
      <Text component={TextVariants.h4}>{label}</Text>
      <Flex>
        <FlexItem flex={{ default: 'flex_1' }}>
          {forcedText ? <Text>{forcedText}</Text> : <PeerResourceLink fields={fields} />}
        </FlexItem>
        <FlexItem>
          <SummaryFilterButton
            id={id + '-filter'}
            activeFilters={activeFilters}
            filterType={filterType}
            fields={fields}
            setFilters={setFilters}
          />
        </FlexItem>
      </Flex>
    </TextContent>
  );
};
