import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Button,
  Divider,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Flex,
  FlexItem,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import { EyeSlashIcon, EyeIcon, TimesIcon, FilterIcon } from '@patternfly/react-icons';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricType } from '../../model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { GraphElementPeer, isElementFiltered, NodeData, toggleElementFilter } from '../../model/topology';
import { ElementPanelMetrics } from './element-panel-metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ElementFields } from './element-fields';
import { PeerResourceLink } from './peer-resource-link';
import { createPeer } from '../../utils/metrics';
import './element-panel.css';
import { SearchEvent, SearchHandle } from '../search/search';

export const ElementPanelDetailsContent: React.FC<{
  element: GraphElementPeer;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
}> = ({ element, filters, setFilters, searchHandle, searchEvent }) => {
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
      if (!d.peer.clusterName) {
        return <></>;
      }
      const fields = createPeer({ clusterName: d.peer.clusterName });
      const isFiltered = isElementFiltered(fields, filters, t);
      return (
        <TextContent id="clusterName" className="record-field-container">
          <Text component={TextVariants.h4}>{t('Cluster name')}</Text>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.clusterName}</FlexItem>
            <FlexItem>
              <Button
                id={'clustername-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters, setFilters, t)}
              />
            </FlexItem>
          </Flex>
        </TextContent>
      );
    },
    [filters, setFilters, t]
  );

  const connectionToken = React.useCallback(
    (d: NodeData) => {
      if (!d.peer.connectionToken) {
        return <></>;
      }
      const fields = createPeer({ connectionToken: d.peer.connectionToken });
      const isFiltered = isElementFiltered(fields, filters, t);
      const isSearched = searchEvent?.searchValue === d.peer.connectionToken;
      return (
        <TextContent id="connectionToken" className="record-field-container">
          <Text component={TextVariants.h4}>{t('Connection token')}</Text>
          <Flex>
            <FlexItem flex={{ default: 'flex_1' }}>{d.peer.connectionToken}</FlexItem>
            <FlexItem>
              <Button
                id={'connectiontoken-search'}
                variant="plain"
                className="overflow-button"
                icon={isSearched ? <EyeSlashIcon /> : <EyeIcon />}
                onClick={() => searchHandle?.search(isSearched ? '' : d.peer.connectionToken!)}
              />
            </FlexItem>
            <FlexItem>
              <Button
                id={'connectiontoken-filter'}
                variant="plain"
                className="overflow-button"
                icon={isFiltered ? <TimesIcon /> : <FilterIcon />}
                onClick={() => toggleElementFilter(fields, isFiltered, filters, setFilters, t)}
              />
            </FlexItem>
          </Flex>
        </TextContent>
      );
    },
    [filters, searchEvent?.searchValue, searchHandle, setFilters, t]
  );

  if (element instanceof BaseNode && data) {
    return (
      <>
        {clusterName(data)}
        {connectionToken(data)}
        <ElementFields
          id="node-info"
          data={data}
          forceFirstAsText={true}
          activeFilters={filters}
          setFilters={setFilters}
        />
      </>
    );
  } else if (element instanceof BaseEdge) {
    // Edge A to B (prefering neutral naming here as there is no assumption about what is source, what is destination
    const aData: NodeData = element.getSource().getData();
    const bData: NodeData = element.getTarget().getData();
    return (
      <>
        {clusterName(aData)}
        {connectionToken(aData)}
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
                  {t('Source')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="source-content"
                isHidden={hidden.includes('source')}
              >
                <ElementFields id="source-info" data={aData} activeFilters={filters} setFilters={setFilters} />
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
                  {t('Destination')}
                </AccordionToggle>
              }
              <AccordionContent
                className="borderless-accordion"
                id="destination-content"
                isHidden={hidden.includes('destination')}
              >
                <ElementFields id="destination-info" data={bData} activeFilters={filters} setFilters={setFilters} />
              </AccordionContent>
            </AccordionItem>
          </div>
        </Accordion>
      </>
    );
  }
  return <></>;
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElementPeer;
  metrics: TopologyMetrics[];
  metricType: MetricType;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  truncateLength: TruncateLength;
  searchHandle: SearchHandle | null;
  searchEvent?: SearchEvent;
  id?: string;
}> = ({
  id,
  element,
  metrics,
  metricType,
  filters,
  setFilters,
  onClose,
  truncateLength,
  searchHandle,
  searchEvent
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [activeTab, setActiveTab] = React.useState<string>('details');

  const data = element.getData();
  let aData: NodeData;
  let bData: NodeData | undefined;
  if (element instanceof BaseEdge) {
    aData = element.getSource().getData();
    bData = element.getTarget().getData();
  } else {
    aData = data!;
  }

  const titleContent = React.useCallback(() => {
    if (element instanceof BaseEdge) {
      return <Text component={TextVariants.h2}>{t('Edge')}</Text>;
    } else {
      const data = element.getData();
      return <>{data && <PeerResourceLink peer={data.peer} />}</>;
    }
  }, [element, t]);

  return (
    <DrawerPanelContent
      data-test-id={id}
      id={id}
      className="drawer-panel-content"
      isResizable
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
    >
      <DrawerHead id={`${id}-drawer-head`} data-test-id="drawer-head" className="drawer-head">
        {titleContent()}
        <DrawerActions>
          <DrawerCloseButton data-test-id="drawer-close-button" className="drawer-close-button" onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <Divider />
      <DrawerPanelBody id={`${id}-drawer-body`} className="drawer-body" data-test-id="drawer-body">
        <Tabs
          id="drawer-tabs"
          activeKey={activeTab}
          usePageInsets
          onSelect={(e, key) => setActiveTab(key as string)}
          role="region"
        >
          <Tab className="drawer-tab" eventKey={'details'} title={<TabTitleText>{t('Details')}</TabTitleText>}>
            <ElementPanelDetailsContent
              element={element}
              filters={filters}
              setFilters={setFilters}
              searchHandle={searchHandle}
              searchEvent={searchEvent}
            />
          </Tab>
          <Tab className="drawer-tab" eventKey={'metrics'} title={<TabTitleText>{t('Metrics')}</TabTitleText>}>
            <ElementPanelMetrics
              aData={aData}
              bData={bData}
              isGroup={element.getType() === 'group'}
              metrics={metrics}
              metricType={metricType}
              truncateLength={truncateLength}
            />
          </Tab>
        </Tabs>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
