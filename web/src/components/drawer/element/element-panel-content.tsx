import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Content,
  ContentVariants,
  Divider,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { FilterIcon, TimesIcon } from '@patternfly/react-icons';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter, FilterDefinition } from '../../../model/filters';
import { GraphElementPeer, isElementFiltered, NodeData, toggleElementFilter } from '../../../model/topology';
import { createPeer } from '../../../utils/metrics';
import { ElementFields } from './element-fields';

export interface ElementPanelContentProps {
  element: GraphElementPeer;
  filters: Filter[];
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
      const isFiltered = isElementFiltered(fields, filters, filterDefinitions);
      return (
        <div id="clusterName" className="record-field-container">
          <Content component={ContentVariants.h4}>{t('Cluster name')}</Content>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.cluster}</FlexItem>
            <FlexItem>
              <Button
                id={'clustername-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters, setFilters, filterDefinitions)}
              />
            </FlexItem>
          </Flex>
        </div>
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
      const isFiltered = isElementFiltered(fields, filters, filterDefinitions);
      return (
        <div id="udn" className="record-field-container">
          <Content component={ContentVariants.h4}>{t('UDN')}</Content>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.udn}</FlexItem>
            <FlexItem>
              <Button
                id={'udn-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters, setFilters, filterDefinitions)}
              />
            </FlexItem>
          </Flex>
        </div>
      );
    },
    [filterDefinitions, filters, setFilters, t]
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
          activeFilters={filters}
          setFilters={setFilters}
          filterDefinitions={filterDefinitions}
        />
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
            <AccordionItem data-test-id={'source'} isExpanded={!hidden.includes('source')}>
              {
                <AccordionToggle className="borderless-accordion" onClick={() => toggle('source')} id={'source'}>
                  {t('Source')}
                </AccordionToggle>
              }
              <AccordionContent className="borderless-accordion" id="source-content">
                <ElementFields
                  id="source-info"
                  data={aData}
                  activeFilters={filters}
                  setFilters={setFilters}
                  filterDefinitions={filterDefinitions}
                />
              </AccordionContent>
            </AccordionItem>
          </div>
          <div className="record-group-container" key={'destination'} data-test-id={'destination'}>
            <Divider />
            <AccordionItem data-test-id={'destination'} isExpanded={!hidden.includes('destination')}>
              {
                <AccordionToggle
                  className="borderless-accordion"
                  onClick={() => toggle('destination')}
                  id={'destination'}
                >
                  {t('Destination')}
                </AccordionToggle>
              }
              <AccordionContent className="borderless-accordion" id="destination-content">
                <ElementFields
                  id="destination-info"
                  data={bData}
                  activeFilters={filters}
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
