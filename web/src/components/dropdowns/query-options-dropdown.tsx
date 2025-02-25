import { MenuToggle, MenuToggleElement, Select } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataSource, Match, PacketLoss, RecordType } from '../../model/flow-query';
import { useOutsideClickEvent } from '../../utils/outside-hook';
import './query-options-dropdown.css';
import { QueryOptionsPanel } from './query-options-panel';

export interface QueryOptionsProps {
  recordType: RecordType;
  setRecordType: (recordType: RecordType) => void;
  dataSource: DataSource;
  setDataSource: (dataSource: DataSource) => void;
  showDuplicates: boolean;
  setShowDuplicates: (showDuplicates: boolean) => void;
  allowLoki: boolean;
  allowProm: boolean;
  allowFlow: boolean;
  allowConnection: boolean;
  allowShowDuplicates: boolean;
  deduperMark: boolean;
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
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <Select
      data-test="query-options-dropdown"
      id="query-options-dropdown"
      placeholder={t('Query options')}
      ref={ref}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
          {t('Query options')}
        </MenuToggle>
      )}
    >
      <QueryOptionsPanel {...props} />
    </Select>
  );
};

export default QueryOptionsDropdown;
