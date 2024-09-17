import { Td, Tr } from '@patternfly/react-table';
import * as React from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import { Record } from '../../../api/ipfix';
import { Column } from '../../../utils/columns';
import { RecordField } from '../../drawer/record/record-field';
import { Size } from '../../dropdowns/table-display-dropdown';
import './netflow-table-row.css';

export interface NetflowTableRowProps {
  rowNumber?: number;
  allowPktDrops: boolean;
  lastRender?: string;
  flow: Record;
  selectedRecord?: Record;
  columns: Column[];
  size: Size;
  onSelect: (record?: Record) => void;
  highlight: boolean;
  height?: number;
  showContent?: boolean;
  tableWidth: number;
  isDark?: boolean;
}

export const NetflowTableRow: React.FC<NetflowTableRowProps> = ({
  rowNumber,
  allowPktDrops,
  lastRender,
  flow,
  selectedRecord,
  columns,
  size,
  onSelect,
  highlight,
  height,
  showContent,
  tableWidth,
  isDark
}) => {
  const onRowClick = () => {
    onSelect(flow);
  };

  return (
    <CSSTransition in={highlight} appear={highlight} timeout={100} classNames="newflow">
      <Tr
        id={`netflow-table-row-${rowNumber || 0}`}
        data-last-render={lastRender || ''}
        data-test={`tr-${flow.key}`}
        isRowSelected={flow.key === selectedRecord?.key}
        onRowClick={onRowClick}
        className={`${isDark ? 'dark' : 'light'}-stripped`}
        style={{ height }}
      >
        {showContent &&
          columns.map(c => (
            <Td
              data-test={`td-${flow.key}`}
              data-test-td-column-id={c.id}
              data-test-td-value={c.value(flow)}
              key={c.id}
              style={{ height: '100%', width: `${Math.floor((100 * c.width) / tableWidth)}%` }}
            >
              {
                <RecordField
                  allowPktDrops={allowPktDrops}
                  flow={flow}
                  column={c}
                  size={size}
                  useLinks={false}
                  isDark={isDark}
                />
              }
            </Td>
          ))}
      </Tr>
    </CSSTransition>
  );
};

export default NetflowTableRow;
