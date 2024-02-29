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
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import { TimesIcon, FilterIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricType } from '../../model/flow-query';
import { TopologyMetrics } from '../../api/loki';
import { Filter, FilterDefinition } from '../../model/filters';
import { GraphElementPeer, isElementFiltered, NodeData, toggleElementFilter } from '../../model/topology';
import { ElementPanelMetrics } from './element-panel-metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ElementFields } from './element-fields';
import { PeerResourceLink } from './peer-resource-link';
import './element-panel.css';
import _ from 'lodash';
import { createPeer } from '../../utils/metrics';

export const ElementPanelDetailsContent: React.FC<{
  element: GraphElementPeer;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  filterDefinitions: FilterDefinition[];
}> = ({ element, filters, setFilters, filterDefinitions }) => {
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
      const isFiltered = isElementFiltered(fields, filters, filterDefinitions);
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
                onClick={() => toggleElementFilter(fields, isFiltered, filters, setFilters, filterDefinitions)}
              />
            </FlexItem>
          </Flex>
        </TextContent>
      );
    },
    [filterDefinitions, filters, setFilters, t]
  );

  if (element instanceof BaseNode && data) {
    return (
      <>
        {clusterName(data)}
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
    return (
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
            <AccordionContent className="borderless-accordion" id="source-content" isHidden={hidden.includes('source')}>
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
    );
  }
  return <></>;
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElementPeer;
  metrics: TopologyMetrics[];
  droppedMetrics: TopologyMetrics[];
  metricType: MetricType;
  filters: Filter[];
  filterDefinitions: FilterDefinition[];
  setFilters: (filters: Filter[]) => void;
  truncateLength: TruncateLength;
  id?: string;
  isDark?: boolean;
}> = ({
  id,
  element,
  metrics,
  droppedMetrics,
  metricType,
  filters,
  filterDefinitions,
  setFilters,
  onClose,
  truncateLength,
  isDark
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
      if (data?.nodeType === 'unknown') {
        return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
      }
      return <>{data && <PeerResourceLink peer={data.peer} />}</>;
    }
  }, [element, t]);

  React.useEffect(() => {
    if ((activeTab === 'metrics' && _.isEmpty(metrics)) || (activeTab === 'dropped' && _.isEmpty(droppedMetrics))) {
      setActiveTab('details');
    }
  }, [metrics, droppedMetrics, activeTab]);

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
              filterDefinitions={filterDefinitions}
            />
          </Tab>
          {!_.isEmpty(metrics) && (
            <Tab className="drawer-tab" eventKey={'metrics'} title={<TabTitleText>{t('Metrics')}</TabTitleText>}>
              <ElementPanelMetrics
                aData={aData}
                bData={bData}
                isGroup={element.getType() === 'group'}
                metrics={metrics}
                metricType={metricType}
                truncateLength={truncateLength}
                isDark={isDark}
              />
            </Tab>
          )}
          {!_.isEmpty(droppedMetrics) && (
            <Tab className="drawer-tab" eventKey={'dropped'} title={<TabTitleText>{t('Drops')}</TabTitleText>}>
              <ElementPanelMetrics
                aData={aData}
                bData={bData}
                isGroup={element.getType() === 'group'}
                metrics={droppedMetrics}
                metricType={metricType}
                truncateLength={truncateLength}
                isDark={isDark}
              />
            </Tab>
          )}
        </Tabs>
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default ElementPanel;
