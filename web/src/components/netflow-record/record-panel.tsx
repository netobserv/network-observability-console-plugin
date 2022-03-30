import {
  ClipboardCopy,
  ClipboardCopyVariant,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  DrawerPanelContent,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { defaultTimeRange, flowdirToReporter } from '../../utils/router';
import { Record } from '../../api/ipfix';
import { Column, ColumnsId, getColumnGroups } from '../../utils/columns';
import { TimeRange } from '../../utils/datetime';
import { getDateMsInSeconds } from '../../utils/duration';
import { Filter } from '../../model/filters';
import { findFilter } from '../../utils/filter-definitions';
import RecordField, { RecordFieldFilter } from './record-field';
import { Reporter } from '../../model/flow-query';
import './record-panel.css';

export type RecordDrawerProps = {
  record?: Record;
  columns: Column[];
  filters: Filter[];
  range: number | TimeRange;
  reporter: Reporter;
  setFilters: (v: Filter[]) => void;
  setRange: (r: number | TimeRange) => void;
  setReporter: (r: Reporter) => void;
  onClose: () => void;
  id?: string;
};

export const RecordPanel: React.FC<RecordDrawerProps> = ({
  id,
  record,
  columns,
  filters,
  range,
  reporter,
  setFilters,
  setRange,
  setReporter,
  onClose
}) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const getFilter = (col: Column) => {
    if (record) {
      const value = col.value(record);
      switch (col.id) {
        case ColumnsId.timestamp:
          return getTimeRangeFilter(col, value);
        case ColumnsId.flowdir:
          return getFlowdirFilter(col, value);
        default:
          return getGenericFilter(col, value);
      }
    }
    return undefined;
  };

  const getTimeRangeFilter = React.useCallback(
    (col: Column, value: unknown): RecordFieldFilter => {
      const isDelete = typeof range !== 'number' && range.from === getDateMsInSeconds(Number(value));
      return {
        onClick: () => {
          if (isDelete) {
            setRange(defaultTimeRange);
          } else {
            //Filter at exact same date in ms
            const dateSeconds = getDateMsInSeconds(Number(value));
            setRange({ from: dateSeconds, to: dateSeconds + 1 });
          }
        },
        isDelete: isDelete
      };
    },
    [range, setRange]
  );

  const getFlowdirFilter = React.useCallback(
    (col: Column, value: unknown): RecordFieldFilter => {
      const recReporter = flowdirToReporter[value as string];
      const isDelete = reporter === recReporter;
      return {
        onClick: () => setReporter(isDelete ? 'both' : recReporter),
        isDelete: isDelete
      };
    },
    [reporter, setReporter]
  );

  const getGenericFilter = React.useCallback(
    (col: Column, value: unknown): RecordFieldFilter | undefined => {
      const def = col.quickFilter ? findFilter(t, col.quickFilter) : undefined;
      if (!def) {
        return undefined;
      }
      const isDelete = filters.some(f => f.def.id === def.id && f.values.some(v => v.v === String(value)));
      return {
        onClick: () => {
          if (isDelete) {
            setFilters(filters.filter(f => f.def.id !== def.id));
          } else {
            const values = [
              {
                v: Array.isArray(value) ? value.join(value.length == 2 ? '.' : ':') : String(value)
              }
            ];
            // CHECK / FIXME cloneDeep won't work?
            // TODO: is it relevant to show composed columns?
            const newFilters = _.cloneDeep(filters);
            const found = newFilters.find(f => f.def.id === def.id);
            if (found) {
              found.values = values;
            } else {
              newFilters.push({ def: def, values: values });
            }
            setFilters(newFilters);
          }
        },
        isDelete: isDelete
      };
    },
    [t, filters, setFilters]
  );

  const groups = getColumnGroups(columns);
  return (
    <DrawerPanelContent id={id}>
      <DrawerHead>
        <Text component={TextVariants.h2}>{t('Flow Details')}</Text>
        <DrawerActions>
          <DrawerCloseButton onClick={onClose} />
        </DrawerActions>
      </DrawerHead>
      <DrawerPanelBody>
        {record && (
          <>
            {groups.map((g, i) => (
              <div className="record-group-container" key={`group-${i}`}>
                {g.title && <Text component={TextVariants.h3}>{g.title}</Text>}
                {g.columns.map(c => (
                  <TextContent className={`record-field-container ${g.title ? 'grouped' : ''}`} key={c.id}>
                    <Text component={TextVariants.h4}>{c.name}</Text>
                    <RecordField flow={record} column={c} filter={getFilter(c)} size={'s'} />
                  </TextContent>
                ))}
              </div>
            ))}
            <TextContent className="record-field-container">
              <Text component={TextVariants.h4}>{t('JSON')}</Text>
              <ClipboardCopy
                isCode
                isExpanded
                hoverTip={t('Copy')}
                clickTip={t('Copied')}
                variant={ClipboardCopyVariant.expansion}
              >
                {JSON.stringify(record, null, 2)}
              </ClipboardCopy>
            </TextContent>
          </>
        )}
      </DrawerPanelBody>
    </DrawerPanelContent>
  );
};

export default RecordPanel;
