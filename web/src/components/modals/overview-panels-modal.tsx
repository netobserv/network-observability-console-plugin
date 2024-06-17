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
import { RecordType } from '../../model/flow-query';
import { getDefaultOverviewPanels, getOverviewPanelInfo, OverviewPanel } from '../../utils/overview-panels';
import Modal from './modal';
import './overview-panels-modal.css';

export const panelFilterKeys = ['top', 'total', 'dns', 'dropped', 'bar', 'donut', 'line'];

export interface OverviewPanelsModalProps {
  isModalOpen: boolean;
  setModalOpen: (v: boolean) => void;
  recordType: RecordType;
  panels: OverviewPanel[];
  setPanels: (v: OverviewPanel[]) => void;
  customIds?: string[];
  id?: string;
}

export const OverviewPanelsModal: React.FC<OverviewPanelsModalProps> = ({
  id,
  isModalOpen,
  setModalOpen,
  recordType,
  panels,
  setPanels,
  customIds
}) => {
  const [updatedPanels, setUpdatedPanels] = React.useState<OverviewPanel[]>([]);
  const [filterKeys, setFilterKeys] = React.useState<string[]>([]);
  const { t } = useTranslation('plugin__netobserv-plugin');

  React.useEffect(() => {
    if (isModalOpen) {
      setFilterKeys([]);
    }
  }, [isModalOpen]);

  React.useEffect(() => {
    if (!isModalOpen || _.isEmpty(updatedPanels)) {
      setUpdatedPanels(_.cloneDeep(panels));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, panels]);

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
    setUpdatedPanels(getDefaultOverviewPanels(customIds).filter(p => panels.some(existing => existing.id === p.id)));
  }, [customIds, panels]);

  const isSaveDisabled = React.useCallback(() => {
    return _.isEmpty(updatedPanels.filter(p => p.isSelected));
  }, [updatedPanels]);

  const isFilteredPanel = React.useCallback(
    (p: OverviewPanel) => {
      return _.isEmpty(filterKeys) || _.reduce(filterKeys, (acc, fk) => (acc = acc && p.id.includes(fk)), true);
    },
    [filterKeys]
  );

  const filteredPanels = React.useCallback(() => {
    return updatedPanels.filter(p => isFilteredPanel(p));
  }, [isFilteredPanel, updatedPanels]);

  const isAllSelected = React.useCallback(() => {
    return _.reduce(filteredPanels(), (acc, p) => (acc = acc && p.isSelected), true);
  }, [filteredPanels]);

  const onSelectAll = React.useCallback(() => {
    const allSelected = isAllSelected();
    const result = [...updatedPanels];
    _.forEach(result, (p: OverviewPanel) => {
      if (isFilteredPanel(p)) {
        p.isSelected = !allSelected;
      }
    });
    setUpdatedPanels(result);
  }, [isAllSelected, updatedPanels, isFilteredPanel]);

  const onClose = React.useCallback(() => {
    setUpdatedPanels(_.cloneDeep(panels));
    setModalOpen(false);
  }, [panels, setModalOpen]);

  const onSave = React.useCallback(() => {
    setPanels(updatedPanels);
    onClose();
  }, [setPanels, updatedPanels, onClose]);

  const toggleChip = React.useCallback(
    (key: string) => {
      if (filterKeys.includes(key)) {
        setFilterKeys(filterKeys.filter(k => k !== key));
      } else {
        setFilterKeys(panelFilterKeys.filter(f => f === key || filterKeys.includes(f)));
      }
    },
    [filterKeys]
  );

  const draggableItems = filteredPanels().map((panel, i) => {
    const info = getOverviewPanelInfo(t, panel.id, undefined, recordType === 'flowLog' ? t('flow') : t('conversation'));
    return (
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
                  <label htmlFor={panel.id}>
                    {info.title}
                    {info.chartType && <>{' (' + info.chartType + ')'}</>}
                  </label>
                </DataListCell>
              ]}
            />
          </DataListItemRow>
        </DataListItem>
      </Draggable>
    );
  });

  return (
    <Modal
      data-test={id}
      id={id}
      title={t('Manage panels')}
      isOpen={isModalOpen}
      scrollable={true}
      onClose={() => onClose()}
      description={
        <>
          <TextContent>
            <Text component={TextVariants.p}>
              {t('Selected panels will appear in the overview tab.')}&nbsp;
              {t('Click and drag the items to reorder the panels in the overview tab.')}
            </Text>
          </TextContent>
          <Flex className="popup-header-margin">
            <FlexItem flex={{ default: 'flex_4' }}>
              <Flex className="flex-gap">
                {panelFilterKeys.map(key => {
                  return (
                    <FlexItem
                      key={key}
                      className={`custom-chip ${filterKeys.includes(key) ? 'selected' : 'unselected'} buttonless gap`}
                    >
                      <Text component={TextVariants.p} onClick={() => toggleChip(key)}>
                        {key}
                      </Text>
                    </FlexItem>
                  );
                })}
              </Flex>
            </FlexItem>
            <FlexItem flex={{ default: 'flex_1' }} className="flex-center">
              {_.isEmpty(filteredPanels()) ? (
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
          <Button data-test="panels-reset-button" key="reset" variant="link" onClick={() => onReset()}>
            {t('Restore default panels')}
          </Button>
          <Button data-test="panels-cancel-button" key="cancel" variant="link" onClick={() => onClose()}>
            {t('Cancel')}
          </Button>
          <Tooltip content={t('At least one panel must be selected')} isVisible={isSaveDisabled()}>
            <Button
              data-test="panels-save-button"
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
