import {
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
import { BaseEdge } from '@patternfly/react-topology';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopologyMetrics } from '../../../api/loki';
import { Filter, FilterDefinition } from '../../../model/filters';
import { MetricType } from '../../../model/flow-query';
import { GraphElementPeer, NodeData } from '../../../model/topology';
import { defaultSize, maxSize, minSize } from '../../../utils/panel';
import { TruncateLength } from '../../dropdowns/truncate-dropdown';
import { PeerResourceLink } from '../../tabs/netflow-topology/peer-resource-link';
import { ElementPanelContent } from './element-panel-content';
import { ElementPanelMetrics } from './element-panel-metrics';
import './element-panel.css';

export interface ElementPanelProps {
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
}

export const ElementPanel: React.FC<ElementPanelProps> = ({
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
  const noMetrics = data && data.noMetrics === true;
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
      const name = data?.peer.getDisplayName(false, false);
      if (data && name) {
        return <PeerResourceLink peer={data.peer} />
      }
      return <Text component={TextVariants.h2}>{t('Unknown')}</Text>;
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
            <ElementPanelContent
              element={element}
              filters={filters}
              setFilters={setFilters}
              filterDefinitions={filterDefinitions}
            />
          </Tab>
          {!noMetrics && !_.isEmpty(metrics) && (
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
          {!noMetrics && !_.isEmpty(droppedMetrics) && (
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
