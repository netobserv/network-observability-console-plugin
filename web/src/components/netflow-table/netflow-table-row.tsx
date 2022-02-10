import { Td, Tr } from '@patternfly/react-table';
import * as React from 'react';
import { Record } from '../../api/ipfix';
import { Column } from '../../utils/columns';
import { Size } from '../display-dropdown';
import { RecordField } from '../netflow-record/record-field';
import './netflow-table-row.css';

const NetflowTableRow: React.FC<{
  flow: Record;
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
}> = ({ flow, selectedRecord, columns, size, onSelect }) => {
  const onRowClick = (event?: React.KeyboardEvent | React.MouseEvent) => {
    if (event) {
      console.log(event);
    }
    onSelect(flow);
  };

  return (
    <Tr isRowSelected={flow.key === selectedRecord?.key} onRowClick={onRowClick}>
      {columns.map(c => (
        <Td key={c.id}>{<RecordField flow={flow} column={c} size={size}></RecordField>}</Td>
      ))}
    </Tr>
  );
};

export default NetflowTableRow;
