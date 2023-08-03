import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Divider,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextVariants
} from '@patternfly/react-core';
import { BaseEdge, BaseNode } from '@patternfly/react-topology';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { MetricType } from '../../model/flow-query';
import { PairTopologyMetrics } from '../../api/loki';
import { Filter } from '../../model/filters';
import { GraphElementPeer, NodeData } from '../../model/topology';
import { ElementPanelMetrics } from './element-panel-metrics';
import { TruncateLength } from '../dropdowns/truncate-dropdown';
import { ElementFields } from './element-fields';
import { PeerResourceLink } from './peer-resource-link';
import './element-panel.css';

export const ElementPanelDetailsContent: React.FC<{
  element: GraphElementPeer;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
}> = ({ element, filters, setFilters }) => {
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

  if (element instanceof BaseNode && data) {
    return (
      <ElementFields
        id="node-info"
        data={data}
        forceFirstAsText={true}
        activeFilters={filters}
        setFilters={setFilters}
      />
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
    );
  }
  return <></>;
};

export const ElementPanel: React.FC<{
  onClose: () => void;
  element: GraphElementPeer;
  metrics: PairTopologyMetrics[];
  metricType: MetricType;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  truncateLength: TruncateLength;
  id?: string;
}> = ({ id, element, metrics, metricType, filters, setFilters, onClose, truncateLength }) => {
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
            <ElementPanelDetailsContent element={element} filters={filters} setFilters={setFilters} />
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
