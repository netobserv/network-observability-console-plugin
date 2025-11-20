import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Divider,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, FilterDefinition, Filters } from '../../../model/filters';
import { GraphElementPeer, isElementFiltered, NodeData, toggleElementFilter } from '../../../model/topology';
import { createPeer } from '../../../utils/metrics';
import { ElementFields } from './element-fields';

export interface ElementPanelContentProps {
  element: GraphElementPeer;
  filters: Filters;
  setFilters: (filters: Filter[]) => void;
  filterDefinitions: FilterDefinition[];
}

export const ElementPanelContent: React.FC<ElementPanelContentProps> = ({
  element,
  filters,
  setFilters,
  filterDefinitions
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [hidden, setHidden] = React.useState<string[]>([]);
  const data = element.getData();

  const toggle = React.useCallback(
    (id: string) => {
      const index = hidden.indexOf(id);
      const newExpanded: string[] =
        index >= 0 ? [...hidden.slice(0, index), ...hidden.slice(index + 1, hidden.length)] : [...hidden, id];
      setHidden(newExpanded);
    },
    [hidden]
  );

  const clusterName = React.useCallback(
    (d: NodeData) => {
      if (!d.peer.cluster) {
        return <></>;
      }
      const fields = createPeer({ cluster: d.peer.cluster });
      const isFiltered = isElementFiltered(fields, filters.list, filterDefinitions);
      return (
        <TextContent id="clusterName" className="record-field-container">
          <Text component={TextVariants.h4}>{t('Cluster name')}</Text>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.cluster}</FlexItem>
            <FlexItem>
              <Button
                id={'clustername-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters.list, setFilters, filterDefinitions)}
              />
            </FlexItem>
          </Flex>
        </TextContent>
      );
    },
    [filterDefinitions, filters, setFilters, t]
  );

  const udnName = React.useCallback(
    (d: NodeData) => {
      if (!d.peer.udn) {
        return <></>;
      }
      const fields = createPeer({ udn: d.peer.udn });
      const isFiltered = isElementFiltered(fields, filters.list, filterDefinitions);
      return (
        <TextContent id="udn" className="record-field-container">
          <Text component={TextVariants.h4}>{t('UDN')}</Text>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.udn}</FlexItem>
            <FlexItem>
              <Button
                id={'udn-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters.list, setFilters, filterDefinitions)}
              />
            </FlexItem>
          </Flex>
        </TextContent>
      );
    },
    [filterDefinitions, filters, setFilters, t]
  );

  const metricsInfo = React.useCallback(
    (d: NodeData) => {
      if (!d.noMetrics) {
        return <></>;
      }

      return (
        <TextContent id="noMetrics" className="record-field-container">
          <Text component={TextVariants.p}>
            {t(
              "Can't find metrics for this element. Check your capture filters to ensure we can monitor it. Else it probably means there is no traffic here."
            )}
          </Text>
        </TextContent>
      );
    },
    [t]
  );

  if (element instanceof BaseNode && data) {
    return (
      <>
        {clusterName(data)}
        {udnName(data)}
        <ElementFields
          id="node-info"
          data={data}
          forceFirstAsText={true}
          filters={filters}
          setFilters={setFilters}
          filterDefinitions={filterDefinitions}
        />
        {metricsInfo(data)}
      </>
    );
  } else if (element instanceof BaseEdge) {
    // Edge A to B (prefering neutral naming here as there is no assumption about what is source, what is destination
    const aData: NodeData = element.getSource().getData();
    const bData: NodeData = element.getTarget().getData();
    const combinedData = Object.assign({}, aData, bData);
    return (
      <>
        {clusterName(combinedData)}
        {udnName(combinedData)}
        <Accordion asDefinitionList={false}>
          <div className="record-group-container" key={'source'} data-test-id={'source'}>
            <AccordionItem data-test-id={'source'}>
              {
                <AccordionToggle
                  className="borderless-accordion"
                  onClick={() => toggle('source')}
                  isExpanded={!hidden.includes('source')}
                  id={'source'}
                >
                  {filters.match === 'bidirectionnal' ? t('Endpoint A') : t('Source')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="source-content"
                isHidden={hidden.includes('source')}
              >
                <ElementFields
                  id="source-info"
                  data={aData}
                  filters={filters}
                  setFilters={setFilters}
                  filterDefinitions={filterDefinitions}
                />
              </AccordionContent>
            </AccordionItem>
          </div>
          <div className="record-group-container" key={'destination'} data-test-id={'destination'}>
            <Divider />
            <AccordionItem data-test-id={'destination'}>
              {
                <AccordionToggle
                  className="borderless-accordion"
                  onClick={() => toggle('destination')}
                  isExpanded={!hidden.includes('destination')}
                  id={'destination'}
                >
                  {filters.match === 'bidirectionnal' ? t('Endpoint B') : t('Destination')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="destination-content"
                isHidden={hidden.includes('destination')}
              >
                <ElementFields
                  id="destination-info"
                  data={bData}
                  filters={filters}
                  setFilters={setFilters}
                  filterDefinitions={filterDefinitions}
                />
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </>
    );
  }
  return <></>;
};

export default ElementPanelContent;
