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
  Text,
  TextContent,
  TextVariants,
  Tooltip
} from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getDefaultOverviewPanels, OverviewPanel } from '../../utils/overview-panels';
import Modal from './modal';
import './overview-panels-modal.css';

export const OverviewPanelsModal: React.FC<{
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  panels: OverviewPanel[];
  setPanels: (v: OverviewPanel[]) => void;
  id?: string;
}> = ({ id, isModalOpen, setModalOpen, panels, setPanels }) => {
  const [updatedPanels, setUpdatedPanels] = React.useState<OverviewPanel[]>([]);
  const [isSaveDisabled, setSaveDisabled] = React.useState<boolean>(true);
  const [isAllSelected, setAllSelected] = React.useState<boolean>(false);
  const { t } = useTranslation('plugin__network-observability-plugin');

  React.useEffect(() => {
    setUpdatedPanels(_.cloneDeep(panels));
  }, [panels]);

  React.useEffect(() => {
    let allSelected = true;
    _.forEach(updatedPanels, (p: OverviewPanel) => {
      if (!p.isSelected) {
        allSelected = false;
        return false;
      }
    });
    setAllSelected(allSelected);
    setSaveDisabled(_.isEmpty(updatedPanels.filter(col => col.isSelected)));
  }, [updatedPanels]);

  const onDrop = React.useCallback(
    (source, dest) => {
      if (dest) {
        const result = [...updatedPanels];
        const [removed] = result.splice(source.index, 1);
        result.splice(dest.index, 0, removed);
        setUpdatedPanels(result);
        return true;
      }
      return false;
    },
    [updatedPanels, setUpdatedPanels]
  );

  const onCheck = React.useCallback(
    (checked, event) => {
      if (event?.target?.id) {
        const result = [...updatedPanels];
        const selectedPanel = result.find(p => p.id === event.target.id);
        if (selectedPanel) {
          selectedPanel.isSelected = !selectedPanel.isSelected;
          setUpdatedPanels(result);
        }
      }
    },
    [updatedPanels, setUpdatedPanels]
  );

  const onReset = React.useCallback(() => {
    setUpdatedPanels(getDefaultOverviewPanels(t));
  }, [setUpdatedPanels, t]);

  const onSelectAll = React.useCallback(() => {
    const result = [...updatedPanels];
    _.forEach(result, (p: OverviewPanel) => {
      p.isSelected = !isAllSelected;
    });
    setUpdatedPanels(result);
  }, [updatedPanels, setUpdatedPanels, isAllSelected]);

  const onSave = React.useCallback(() => {
    setPanels(updatedPanels);
    setModalOpen(false);
  }, [updatedPanels, setPanels, setModalOpen]);

  const draggableItems = updatedPanels.map((panel, i) => (
    <Draggable key={i} hasNoWrapper>
      <DataListItem
        key={'data-list-item-' + i}
        aria-labelledby={'overview-panel-management-item' + i}
        className="data-list-item"
        data-test={'data-' + i}
        id={'data-' + i}
      >
        <DataListItemRow key={'data-list-item-row-' + i}>
          <DataListControl>
            <DataListDragButton aria-label="Reorder" aria-labelledby={'overview-panel-management-item' + i} />
            <DataListCheck
              aria-labelledby={'overview-panel-management-item-' + i}
              checked={panel.isSelected}
              id={panel.id}
              onChange={onCheck}
            />
          </DataListControl>
          <DataListItemCells
            dataListCells={[
              <DataListCell key={'data-list-cell-' + i}>
                <label htmlFor={panel.id}>{panel.title}</label>
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
      title={t('Manage panels')}
      isOpen={isModalOpen}
      scrollable={true}
      onClose={() => setModalOpen(false)}
      description={
        <TextContent>
          <Text component={TextVariants.p}>
            {t('Selected panels will appear in the overview tab.')}&nbsp;
            {t('Click and drag the items to reorder the panels in the overview tab.')}
          </Text>
          <Button isInline onClick={onSelectAll} variant="link">
            {isAllSelected ? t('Unselect all') : t('Select all')}
          </Button>
        </TextContent>
      }
      footer={
        <div className="footer">
          <Button data-test="panels-reset-button" key="reset" variant="link" onClick={() => onReset()}>
            {t('Restore default panels')}
          </Button>
          <Button data-test="panels-cancel-button" key="cancel" variant="link" onClick={() => setModalOpen(false)}>
            {t('Cancel')}
          </Button>
          <Tooltip content={t('At least one panel must be selected')} isVisible={isSaveDisabled}>
            <Button
              data-test="panels-save-button"
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
              aria-label="Overview panel management"
              data-test="overview-panel-management"
              id="overview-panel-management"
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

export default OverviewPanelsModal;
