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
import { DEFAULT_FLOWDIR, DEFAULT_TIME_RANGE, flowdirToReporter } from '../../utils/router';
import { Record } from '../../api/ipfix';
import { QueryOptions } from '../../model/query-options';
import { Column, ColumnsId, getColumnGroups } from '../../utils/columns';
import { TimeRange } from '../../utils/datetime';
import { getDateMsInSeconds } from '../../utils/duration';
import { Filter } from '../../utils/filters';
import RecordField from './record-field';
import './record-panel.css';

export type RecordDrawerProps = {
  record?: Record;
  columns: Column[];
  filters: Filter[];
  range: number | TimeRange;
  options: QueryOptions;
  setFilters: (v: Filter[]) => void;
  setRange: (r: number | TimeRange) => void;
  setQueryOptions: (opts: QueryOptions) => void;
  onClose: () => void;
  id?: string;
};

export const RecordPanel: React.FC<RecordDrawerProps> = ({
  id,
  record,
  columns,
  filters,
  range,
  options,
  setFilters,
  setRange,
  setQueryOptions,
  onClose
}) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  const onClick = React.useCallback(
    (col: Column, isDelete: boolean) => {
      if (!record) {
        return;
      }

      if (isDelete) {
        switch (col.id) {
          case ColumnsId.timestamp:
            setRange(DEFAULT_TIME_RANGE);
            break;
          case ColumnsId.flowdir:
            setQueryOptions({ ...options, reporter: flowdirToReporter[DEFAULT_FLOWDIR] });
            break;
          default:
            setFilters(filters.filter((f: Filter) => f.colId !== col.id));
            break;
        }
      } else {
        const value = col.value(record);
        switch (col.id) {
          case ColumnsId.timestamp:
            //Filter at exact same date in ms
            const dateSeconds = getDateMsInSeconds(Number(value));
            setRange({ from: dateSeconds, to: dateSeconds + 1 });
            break;
          case ColumnsId.flowdir:
            setQueryOptions({ ...options, reporter: flowdirToReporter[value as string] });
            break;
          default:
            const values = [
              {
                v: Array.isArray(value) ? value.join(value.length == 2 ? '.' : ':') : value.toString()
              }
            ];
            const result = _.cloneDeep(filters);
            const found = result.find(f => f.colId === col.id);
            if (found) {
              found.values = values;
            } else {
              result.push({ colId: col.id, values: values });
            }
            setFilters(result);
            break;
        }
      }
    },
    [filters, options, record, setFilters, setQueryOptions, setRange]
  );

  const getFilter = (col: Column) => {
    let isDelete = false;
    if (record) {
      const value = col.value(record);
      switch (col.id) {
        case ColumnsId.timestamp:
          isDelete = typeof range !== 'number' && range.from === getDateMsInSeconds(Number(value));
          break;
        case ColumnsId.flowdir:
          isDelete = options.reporter === flowdirToReporter[value as string];
          break;
        default:
          isDelete =
            filters.find((f: Filter) => f.colId === col.id && f.values.find(v => v.v === value.toString())) !==
            undefined;
          break;
      }
    }
    return {
      onClick,
      isDelete
    };
  };

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
