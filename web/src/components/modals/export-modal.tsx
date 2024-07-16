import {
  Button,
  Checkbox,
  Chip,
  ChipGroup,
  DataList,
  DataListCell,
  DataListCheck,
  DataListControl,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  Text,
  TextContent,
  TextVariants
} from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getExportFlowsURL } from '../../api/routes';
import { Filter } from '../../model/filters';
import { FlowQuery } from '../../model/flow-query';
import { Column, getFullColumnName } from '../../utils/columns';
import { getTimeRangeOptions, TimeRange } from '../../utils/datetime';
import { formatDuration, getDateSInMiliseconds } from '../../utils/duration';
import { getFilterFullName } from '../../utils/filters-helper';
import { getLocalStorage, localStorageExportColsKey, useLocalStorage } from '../../utils/local-storage-hook';
import './export-modal.css';
import Modal from './modal';

export interface ExportModalProps {
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  range: number | TimeRange;
  flowQuery: FlowQuery;
  columns: Column[];
  filters: Filter[];
  id?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  id,
  isModalOpen,
  setModalOpen,
  range,
  flowQuery,
  columns,
  filters
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [selectedColumns, setSelectedColumns] = useLocalStorage<Column[]>(
    localStorageExportColsKey,
    //select all columns by default
    columns.map(c => ({ ...c, isSelected: true })),
    {
      id: 'id',
      criteria: 'isSelected'
    }
  );
  const [isSaveDisabled, setSaveDisabled] = React.useState<boolean>(true);
  const [isAllSelected, setAllSelected] = React.useState<boolean>(false);
  const [isExportAll, setExportAll] = React.useState<boolean>(
    //show columns details if not all columns are selected
    selectedColumns.filter(c => c.isSelected).length === columns.length
  );
  const options = getTimeRangeOptions(t);

  const getFieldNames = React.useCallback(() => {
    if (isExportAll) {
      return undefined;
    }
    return selectedColumns.filter(c => c.isSelected && c.field != undefined).map(c => c.field!.name) as
      | string[]
      | undefined;
  }, [isExportAll, selectedColumns]);

  const rangeText = React.useCallback(() => {
    if (typeof range == 'number') {
      const selectedKey = formatDuration(getDateSInMiliseconds(range)) as keyof typeof options;
      return options[selectedKey];
    } else {
      return `${t('From')} ${new Date(getDateSInMiliseconds(range.from))} ${t('To')} ${new Date(
        getDateSInMiliseconds(range.to)
      )}`;
    }
  }, [options, range, t]);

  const onCheck = React.useCallback(
    (checked, event) => {
      if (event?.target?.id) {
        const result = [...selectedColumns];
        const selectedColumn = result.find(col => col.id === event.target.id);
        if (selectedColumn) {
          selectedColumn.isSelected = !selectedColumn.isSelected;
          setSelectedColumns(result);
        }
      }
    },
    [selectedColumns, setSelectedColumns]
  );

  const onSelectAll = React.useCallback(() => {
    const result = [...selectedColumns];
    _.forEach(result, (col: Column) => {
      col.isSelected = !isAllSelected;
    });
    setSelectedColumns(result);
  }, [selectedColumns, setSelectedColumns, isAllSelected]);

  React.useEffect(() => {
    let allSelected = true;
    _.forEach(selectedColumns, (col: Column) => {
      if (!col.isSelected) {
        allSelected = false;
        return false;
      }
    });
    setAllSelected(allSelected);
  }, [selectedColumns]);

  React.useEffect(() => {
    setSaveDisabled(!isExportAll && _.isEmpty(selectedColumns.filter(col => col.isSelected)));
  }, [isExportAll, selectedColumns]);

  React.useEffect(() => {
    // reload selected columns when config is loaded and popup closed
    if (!isModalOpen) {
      setSelectedColumns(
        getLocalStorage(localStorageExportColsKey, _.cloneDeep(columns), {
          id: 'id',
          criteria: 'isSelected'
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, columns]);

  return (
    <Modal
      id={id}
      title={t('Export')}
      isOpen={isModalOpen}
      scrollable={true}
      onClose={() => setModalOpen(false)}
      description={
        <>
          <TextContent>
            <Text component={TextVariants.p}>{t('Following query will be exported as CSV format:')}&nbsp;</Text>
          </TextContent>
          <div data-test="export-chips" id="export-chips">
            <ChipGroup isClosable={false} categoryName={t('Time Range')}>
              <Chip isReadOnly={true}>{rangeText()}</Chip>
            </ChipGroup>
            {flowQuery.dedup && (
              <ChipGroup isClosable={false} categoryName={t('Deduplicate')}>
                <Chip isReadOnly={true}>true</Chip>
              </ChipGroup>
            )}
            <ChipGroup isClosable={false} categoryName={t('Limit')}>
              <Chip isReadOnly={true}>{flowQuery.limit}</Chip>
            </ChipGroup>
            {filters.map((filter, fIndex) => (
              <ChipGroup key={fIndex} isClosable={false} categoryName={getFilterFullName(filter.def, t)}>
                {filter.values.map((value, fvIndex) => (
                  <Chip key={fvIndex} isReadOnly={true}>
                    {value.display ? value.display : value.v}
                  </Chip>
                ))}
              </ChipGroup>
            ))}
          </div>
        </>
      }
      footer={
        <div className="footer">
          <Button data-test="export-close-button" key="close" variant="link" onClick={() => setModalOpen(false)}>
            {t('Close')}
          </Button>
          <Button
            data-test="export-button"
            key="confirm"
            isDisabled={isSaveDisabled}
            variant="primary"
            component={(props: React.FunctionComponent) => (
              <Link
                {...props}
                target="_blank"
                to={getExportFlowsURL(flowQuery, getFieldNames())}
                onClick={() => setModalOpen(false)}
              />
            )}
          >
            {t('Export')}
          </Button>
        </div>
      }
    >
      <div>
        <Checkbox
          data-test="export-all"
          id="export-all"
          isChecked={isExportAll}
          onChange={checked => setExportAll(checked)}
          label={t('Export all datas')}
          aria-label="Export all"
          description={
            <TextContent className="netobserv-no-child-margin">
              <Text component={TextVariants.p}>
                {t('Use this option to export every fields and labels from flows.')}
              </Text>
              <Text component={TextVariants.p}>{t('Else pick from available columns.')}</Text>
            </TextContent>
          }
          body={
            !isExportAll && (
              <>
                <Button isInline onClick={onSelectAll} variant="link">
                  {isAllSelected ? t('Unselect all') : t('Select all')}
                </Button>
                <DataList aria-label="Exported fields" id="exported-fields" isCompact>
                  {selectedColumns.map((column, i) => (
                    <DataListItem
                      key={'data-list-item-' + i}
                      aria-labelledby={'table-column-management-item' + i}
                      className="data-list-item"
                      data-test={'data-' + i}
                      id={'data-' + i}
                    >
                      <DataListItemRow key={'data-list-item-row-' + i}>
                        <DataListControl>
                          <DataListCheck
                            aria-labelledby={'table-column-management-item-' + i}
                            checked={column.isSelected}
                            data-test={column.id}
                            id={column.id}
                            onChange={onCheck}
                          />
                        </DataListControl>
                        <DataListItemCells
                          dataListCells={[
                            <DataListCell key={'data-list-cell-' + i}>
                              <label htmlFor={column.id}>{getFullColumnName(column)}</label>
                            </DataListCell>
                          ]}
                        />
                      </DataListItemRow>
                    </DataListItem>
                  ))}
                </DataList>
              </>
            )
          }
        />
      </div>
    </Modal>
  );
};

export default ExportModal;
