import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Text,
  TextVariants
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Record } from '../../api/ipfix';
import { NetflowMetrics, Stats } from '../../api/loki';
import { RecordType } from '../../model/flow-query';
import { TimeRange } from '../../utils/datetime';
import { defaultSize, maxSize, minSize } from '../../utils/panel';
import { SummaryPanelContent } from './summary-panel-content';
import './summary-panel.css';

export interface SummaryPanelProps {
  onClose: () => void;
  flows?: Record[];
  metrics: NetflowMetrics;
  type: RecordType;
  stats?: Stats;
  maxChunkAge: number;
  limit: number;
  range: number | TimeRange;
  lastRefresh?: Date;
  lastDuration?: number;
  warningMessage?: string;
  slownessReason?: string;
  showDNSLatency?: boolean;
  showRTTLatency?: boolean;
  id?: string;
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({
  flows,
  metrics,
  type,
  maxChunkAge,
  stats,
  limit,
  range,
  lastRefresh,
  lastDuration,
  warningMessage,
  slownessReason,
  showDNSLatency,
  showRTTLatency,
  id,
  onClose
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <DrawerPanelContent
      data-test={id}
      id={id}
      isResizable
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
    >
      <DrawerHead>
        <Text component={TextVariants.h2}>{t('Query summary')}</Text>
        <DrawerActions>
          <DrawerCloseButton id={`${id ? id : 'summary-panel'}-close-button`} onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        <SummaryPanelContent
          flows={flows}
          metrics={metrics}
          type={type}
          maxChunkAge={maxChunkAge}
          stats={stats}
          limit={limit}
          range={range}
          lastRefresh={lastRefresh}
          lastDuration={lastDuration}
          warningMessage={warningMessage}
          slownessReason={slownessReason}
          showDNSLatency={showDNSLatency}
          showRTTLatency={showRTTLatency}
        />
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default SummaryPanel;
