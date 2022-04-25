import { Td, Tr } from '@patternfly/react-table';
import * as React from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import { Record } from '../../api/ipfix';
import { Column } from '../../utils/columns';
import { RecordField } from '../netflow-record/record-field';
import { Size } from './netflow-table-helper';
import './netflow-table-row.css';

const NetflowTableRow: React.FC<{
  flow: Record;
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
  highlight: boolean;
  height?: number;
  tableWidth: number;
}> = ({ flow, selectedRecord, columns, size, onSelect, highlight, height, tableWidth }) => {
  const onRowClick = () => {
    onSelect(flow);
  };

  const shouldHighlight = React.useRef(highlight);

  return (
    <Tr isRowSelected={flow.key === selectedRecord?.key} onRowClick={onRowClick}>
      {columns.map(c => (
        <CSSTransition
          key={c.id}
          in={shouldHighlight.current}
          appear={shouldHighlight.current}
          timeout={100}
          classNames="newflow"
        >
          <Td key={c.id} style={{ height, width: `${Math.floor((100 * c.width) / tableWidth)}%` }}>
            {<RecordField flow={flow} column={c} size={size}></RecordField>}
          </Td>
        </CSSTransition>
      ))}
    </Tr>
  );
};

export default NetflowTableRow;
