import React from 'react';
import { Config } from '../../model/config';
import { Filter } from '../../model/filters';
import { FlowQuery, RecordType } from '../../model/flow-query';
import { Column, ColumnSizeMap } from '../../utils/columns';
import { TimeRange } from '../../utils/datetime';
import { OverviewPanel } from '../../utils/overview-panels';
import ColumnsModal from './columns-modal';
import ExportModal from './export-modal';
import OverviewPanelsModal from './overview-panels-modal';
import TimeRangeModal from './time-range-modal';

export interface ModalsProps {
  isTRModalOpen: boolean;
  setTRModalOpen: (v: boolean) => void;
  range: number | TimeRange;
  setRange: (v: number | TimeRange) => void;
  maxChunkAge?: number;
  isOverviewModalOpen: boolean;
  setOverviewModalOpen: (v: boolean) => void;
  recordType: RecordType;
  panels: OverviewPanel[];
  setPanels: (v: OverviewPanel[]) => void;
  customIds?: string[];
  isColModalOpen: boolean;
  setColModalOpen: (v: boolean) => void;
  availableColumns: Column[];
  setColumns: (v: Column[]) => void;
  setColumnSizes: (v: ColumnSizeMap) => void;
  config: Config;
  isExportModalOpen: boolean;
  setExportModalOpen: (v: boolean) => void;
  flowQuery: FlowQuery;
  filters: Filter[];
}

export const Modals: React.FC<ModalsProps> = props => {
  return (
    <>
      <TimeRangeModal
        id="time-range-modal"
        isModalOpen={props.isTRModalOpen}
        setModalOpen={props.setTRModalOpen}
        range={typeof props.range === 'object' ? props.range : undefined}
        setRange={props.setRange}
        maxChunkAge={props.maxChunkAge}
      />
      <OverviewPanelsModal
        id="overview-panels-modal"
        isModalOpen={props.isOverviewModalOpen}
        setModalOpen={props.setOverviewModalOpen}
        recordType={props.recordType}
        panels={props.panels}
        setPanels={props.setPanels}
        customIds={props.config.panels}
        features={props.config.features}
      />
      <ColumnsModal
        id="columns-modal"
        isModalOpen={props.isColModalOpen}
        setModalOpen={props.setColModalOpen}
        config={props.config}
        columns={props.availableColumns}
        setColumns={props.setColumns}
        setColumnSizes={props.setColumnSizes}
      />
      <ExportModal
        id="export-modal"
        isModalOpen={props.isExportModalOpen}
        setModalOpen={props.setExportModalOpen}
        flowQuery={props.flowQuery}
        columns={props.availableColumns.filter(c => c.field && !c.field.name.startsWith('Time'))}
        range={props.range}
        filters={props.filters}
      />
    </>
  );
};

export default Modals;
