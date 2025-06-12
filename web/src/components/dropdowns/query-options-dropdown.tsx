import { MenuToggle, MenuToggleElement, Select } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DataSource, PacketLoss, RecordType } from '../../model/flow-query';
import { useOutsideClickEvent } from '../../utils/outside-hook';
import './query-options-dropdown.css';
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
  packetLoss: PacketLoss;
  setPacketLoss: (pl: PacketLoss) => void;
}

export const QueryOptionsDropdown: React.FC<QueryOptionsProps> = props => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  return (
    <div data-test="query-options-dropdown-container" ref={ref}>
      <Select
        data-test="query-options-dropdown"
        id="query-options-dropdown"
        placeholder={t('Query options')}
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} onClick={() => setOpen(!isOpen)} isExpanded={isOpen}>
            {t('Query options')}
          </MenuToggle>
        )}
      >
        <QueryOptionsPanel {...props} />
      </Select>
    </div>
  );
};

export default QueryOptionsDropdown;
