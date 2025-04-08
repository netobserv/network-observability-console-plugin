import { Select, Text, TextVariants } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataSource, Match, PacketLoss, RecordType } from '../../model/flow-query';
import { QueryOptionsPanel } from './query-options-panel';

export interface QueryOptionsProps {
  recordType: RecordType;
  setRecordType: (recordType: RecordType) => void;
  dataSource: DataSource;
  setDataSource: (dataSource: DataSource) => void;
  allowLoki: boolean;
  allowProm: boolean;
  allowFlow: boolean;
  allowConnection: boolean;
  allowPktDrops: boolean;
  useTopK: boolean;
  limit: number;
  setLimit: (limit: number) => void;
  match: Match;
  setMatch: (match: Match) => void;
  packetLoss: PacketLoss;
  setPacketLoss: (pl: PacketLoss) => void;
}

export const QueryOptionsDropdown: React.FC<QueryOptionsProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div data-test="query-options-dropdown-container">
      <Select
        data-test="query-options-dropdown"
        id="query-options-dropdown"
        placeholderText={<Text component={TextVariants.p}>{t('Query options')}</Text>}
        isOpen={isOpen}
        onToggle={() => setOpen(!isOpen)}
        customContent={<QueryOptionsPanel {...props} />}
      />
    </div>
  );
};

export default QueryOptionsDropdown;
