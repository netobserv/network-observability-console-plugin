import * as React from 'react';
import {
  Button,
  DataList,
  DataListControl,
  DataListItem,
  DataListItemRow,
  DataListDragButton,
  DataListCheck,
  DataListCell,
  DragDrop,
  Draggable,
  Droppable,
  DataListItemCells,
  Text,
  TextContent,
  TextVariants,
  Tooltip
} from '@patternfly/react-core';
import Modal from './modal';
import { useTranslation } from 'react-i18next';
import { Column, getDefaultColumns, getFullColumnName } from '../../utils/columns';
import * as _ from 'lodash';
import './columns-modal.css';

export const ColumnsModal: React.FC<{
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  columns: Column[];
  setColumns: (v: Column[]) => void;
  id?: string;
}> = ({ id, isModalOpen, setModalOpen, columns, setColumns }) => {
  const [updatedColumns, setUpdatedColumns] = React.useState<Column[]>([]);
  const [isSaveDisabled, setSaveDisabled] = React.useState<boolean>(true);
  const [isAllSelected, setAllSelected] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__netobserv-plugin');

  React.useEffect(() => {
    setUpdatedColumns(_.cloneDeep(columns));
  }, [columns]);

  React.useEffect(() => {
    let allSelected = true;
    _.forEach(updatedColumns, (col: Column) => {
      if (!col.isSelected) {
        allSelected = false;
        return false;
      }
    });
    setAllSelected(allSelected);
    setSaveDisabled(_.isEmpty(updatedColumns.filter(col => col.isSelected)));
  }, [updatedColumns]);

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
    setUpdatedColumns(getDefaultColumns(t));
  }, [setUpdatedColumns, t]);

  const onSelectAll = React.useCallback(() => {
    const result = [...updatedColumns];
    _.forEach(result, (col: Column) => {
      col.isSelected = !isAllSelected;
    });
    setUpdatedColumns(result);
  }, [updatedColumns, setUpdatedColumns, isAllSelected]);

  const onSave = React.useCallback(() => {
    setColumns(updatedColumns);
    setModalOpen(false);
  }, [updatedColumns, setColumns, setModalOpen]);

  const draggableItems = updatedColumns.map((column, i) => (
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
      onClose={() => setModalOpen(false)}
      description={
        <TextContent>
          <Text component={TextVariants.p}>
            {t('Selected columns will appear in the table.')}&nbsp;
            {t('Click and drag the items to reorder the columns in the table.')}
          </Text>
          <Button isInline onClick={onSelectAll} variant="link">
            {isAllSelected ? t('Unselect all') : t('Select all')}
          </Button>
        </TextContent>
      }
      footer={
        <div className="footer">
          <Button data-test="columns-reset-button" key="reset" variant="link" onClick={() => onReset()}>
            {t('Restore default columns')}
          </Button>
          <Button data-test="columns-cancel-button" key="cancel" variant="link" onClick={() => setModalOpen(false)}>
            {t('Cancel')}
          </Button>
          <Tooltip content={t('At least one column must be selected')} isVisible={isSaveDisabled}>
            <Button
              data-test="columns-save-button"
              isDisabled={isSaveDisabled}
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
