import {
  Button,
  DataList,
  DataListCell,
  DataListCheck,
  DataListControl,
  DataListDragButton,
  DataListItem,
  DataListItemCells,
  DataListItemRow,
  DragDrop,
  Draggable,
  Droppable,
  Flex,
  FlexItem,
  Text,
  TextContent,
  TextVariants,
  Tooltip
} from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Config } from '../../model/config';
import { Column, ColumnSizeMap, getDefaultColumns, getFullColumnName } from '../../utils/columns';
import './columns-modal.css';
import Modal from './modal';

export const columnFilterKeys = ['source', 'destination', 'time', 'host', 'namespace', 'owner', 'ip', 'dns'];

export const ColumnsModal: React.FC<{
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  setColumnSizes: (v: ColumnSizeMap) => void;
  config: Config;
  id?: string;
}> = ({ id, config, isModalOpen, setModalOpen, columns, setColumns, setColumnSizes }) => {
  const [resetClicked, setResetClicked] = React.useState<boolean>(false);
  const [updatedColumns, setUpdatedColumns] = React.useState<Column[]>([]);
  const [filterKeys, setFilterKeys] = React.useState<string[]>([]);
  const { t } = useTranslation('plugin__netobserv-plugin');

  React.useEffect(() => {
    if (isModalOpen) {
      setFilterKeys([]);
    }
  }, [isModalOpen]);

  React.useEffect(() => {
    if (!isModalOpen || _.isEmpty(updatedColumns)) {
      setUpdatedColumns(_.cloneDeep(columns));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, isModalOpen]);

  const onDrop = React.useCallback(
    (source, dest) => {
      if (dest) {
        const result = [...updatedColumns];
        const [removed] = result.splice(source.index, 1);
        result.splice(dest.index, 0, removed);
        setUpdatedColumns(result);
        return true;
      }
      return false;
    },
    [updatedColumns, setUpdatedColumns]
  );

  const onCheck = React.useCallback(
    (checked, event) => {
      if (event?.target?.id) {
        const result = [...updatedColumns];
        const selectedColumn = result.find(col => col.id === event.target.id);
        if (selectedColumn) {
          selectedColumn.isSelected = !selectedColumn.isSelected;
          setUpdatedColumns(result);
        }
      }
    },
    [updatedColumns, setUpdatedColumns]
  );

  const onReset = React.useCallback(() => {
    setResetClicked(true);
    setUpdatedColumns(
      getDefaultColumns(config.columns, config.fields).filter(c => columns.some(existing => existing.id === c.id))
    );
  }, [columns, config.columns, config.fields]);

  const isSaveDisabled = React.useCallback(() => {
    return _.isEmpty(updatedColumns.filter(c => c.isSelected));
  }, [updatedColumns]);

  const isFilteredColumn = React.useCallback((c: Column, fks: string[]) => {
    return (
      _.isEmpty(fks) ||
      _.reduce(
        fks,
        (acc, fk) =>
          (acc =
            acc &&
            (c.id.toLowerCase().includes(fk) ||
              c.name.toLowerCase().includes(fk) ||
              c.group?.toLowerCase().includes(fk) ||
              false)),
        true
      )
    );
  }, []);

  const getColumnFilterKeys = React.useCallback(() => {
    return columnFilterKeys.filter(fk => columns.some(c => isFilteredColumn(c, [fk])));
  }, [columns, isFilteredColumn]);

  const filteredColumns = React.useCallback(() => {
    return updatedColumns.filter(c => isFilteredColumn(c, filterKeys));
  }, [filterKeys, isFilteredColumn, updatedColumns]);

  const isAllSelected = React.useCallback(() => {
    return _.reduce(filteredColumns(), (acc, c) => (acc = acc && c.isSelected), true);
  }, [filteredColumns]);

  const onSelectAll = React.useCallback(() => {
    const allSelected = isAllSelected();
    const result = [...updatedColumns];
    _.forEach(result, (c: Column) => {
      if (isFilteredColumn(c, filterKeys)) {
        c.isSelected = !allSelected;
      }
    });
    setUpdatedColumns(result);
  }, [isAllSelected, updatedColumns, isFilteredColumn, filterKeys]);

  const onClose = React.useCallback(() => {
    setResetClicked(false);
    setUpdatedColumns(_.cloneDeep(columns));
    setModalOpen(false);
  }, [columns, setModalOpen]);

  const onSave = React.useCallback(() => {
    if (resetClicked) {
      setColumnSizes({});
    }
    setColumns(updatedColumns);
    onClose();
  }, [resetClicked, setColumns, updatedColumns, onClose, setColumnSizes]);

  const toggleChip = React.useCallback(
    (key: string) => {
      if (filterKeys.includes(key)) {
        setFilterKeys(filterKeys.filter(k => k !== key));
      } else {
        setFilterKeys(columnFilterKeys.filter(f => f === key || filterKeys.includes(f)));
      }
    },
    [filterKeys]
  );

  const draggableItems = filteredColumns().map((column, i) => (
    <Draggable key={i} hasNoWrapper>
      <DataListItem
        key={'data-list-item-' + i}
        aria-labelledby={'table-column-management-item' + i}
        className="data-list-item"
        data-test={'data-' + i}
        id={'data-' + i}
      >
        <DataListItemRow key={'data-list-item-row-' + i}>
          <DataListControl>
            <DataListDragButton aria-label="Reorder" aria-labelledby={'table-column-management-item' + i} />
            <DataListCheck
              aria-labelledby={'table-column-management-item-' + i}
              checked={column.isSelected}
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
    </Draggable>
  ));

  return (
    <Modal
      data-test={id}
      id={id}
      title={t('Manage columns')}
      isOpen={isModalOpen}
      scrollable={true}
      onClose={onClose}
      description={
        <>
          <TextContent>
            <Text component={TextVariants.p}>
              {t('Selected columns will appear in the table.')}&nbsp;
              {t('Click and drag the items to reorder the columns in the table.')}
            </Text>
          </TextContent>
          <Flex className="popup-header-margin">
            <FlexItem flex={{ default: 'flex_4' }}>
              <Flex className="flex-gap">
                {getColumnFilterKeys().map(key => {
                  return (
                    <FlexItem
                      key={key}
                      onClick={() => toggleChip(key)}
                      className={`custom-chip ${
                        filterKeys.includes(key) ? 'selected' : 'unselected'
                      } buttonless gap pointer`}
                    >
                      <Text component={TextVariants.p}>{key}</Text>
                    </FlexItem>
                  );
                })}
              </Flex>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }} className="flex-center">
              {_.isEmpty(filteredColumns()) ? (
                <Button isInline onClick={() => setFilterKeys([])} variant="link">
                  {t('Clear filters')}
                </Button>
              ) : (
                <Button isInline onClick={onSelectAll} variant="link">
                  {`${isAllSelected() ? t('Unselect all') : t('Select all')}${
                    !_.isEmpty(filterKeys) ? ' ' + filterKeys.join(',') : ''
                  }`}
                </Button>
              )}
            </FlexItem>
          </Flex>
        </>
      }
      footer={
        <div className="footer">
          <Button data-test="columns-reset-button" key="reset" variant="link" onClick={() => onReset()}>
            {t('Restore default columns')}
          </Button>
          <Button data-test="columns-cancel-button" key="cancel" variant="link" onClick={() => onClose()}>
            {t('Cancel')}
          </Button>
          <Tooltip content={t('At least one column must be selected')} trigger="" isVisible={isSaveDisabled()}>
            <Button
              data-test="columns-save-button"
              isDisabled={isSaveDisabled()}
              key="confirm"
              variant="primary"
              onClick={() => onSave()}
            >
              {t('Save')}
            </Button>
          </Tooltip>
        </div>
      }
    >
      <div className="co-m-form-row">
        <DragDrop onDrop={onDrop}>
          <Droppable hasNoWrapper>
            <DataList
              aria-label="Table column management"
              data-test="table-column-management"
              id="table-column-management"
              isCompact
            >
              {draggableItems}
            </DataList>
          </Droppable>
        </DragDrop>
      </div>
    </Modal>
  );
};

export default ColumnsModal;
