import { Td, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { Record } from '../../api/ipfix';
import { Column } from '../../utils/columns';
import { Size } from '../dropdowns/display-dropdown';
import { RecordField } from '../netflow-record/record-field';
import './netflow-table-row.css';
import CSSTransition from 'react-transition-group/CSSTransition';
import { isDark } from '../../utils/theme';

const NetflowTableRow: React.FC<{
  flow: Record;
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
  highlight: boolean;
  height?: number;
  showContent?: boolean;
  tableWidth: number;
}> = ({ flow, selectedRecord, columns, size, onSelect, highlight, height, showContent, tableWidth }) => {
  const onRowClick = () => {
    onSelect(flow);
  };

  return (
    <CSSTransition in={highlight} appear={highlight} timeout={100} classNames="newflow">
      <Tr
        data-test={`tr-${flow.key}`}
        isRowSelected={flow.key === selectedRecord?.key}
        onRowClick={onRowClick}
        className={`${isDark() ? 'dark' : 'light'}-stripped`}
        style={{ height }}
      >
        {showContent &&
          columns.map(c => (
            <Td
              data-test={`td-${flow.key}`}
              key={c.id}
              style={{ height: '100%', width: `${Math.floor((100 * c.width) / tableWidth)}%` }}
            >
              {<RecordField flow={flow} column={c} size={size}></RecordField>}
            </Td>
          ))}
      </Tr>
    </CSSTransition>
  );
};

export default NetflowTableRow;
