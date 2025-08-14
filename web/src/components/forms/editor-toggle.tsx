import { ActionGroup, Alert, Button, Flex, FlexItem, Radio } from '@patternfly/react-core';
import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { ContextSingleton } from '../../utils/context';
import './forms.css';

export enum EditorType {
  CUSTOM = 'custom',
  YAML = 'yaml'
}

type EditorToggleProps = {
  type: EditorType;
  onChange: (newValue: EditorType) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  customChild: JSX.Element;
  yamlChild: JSX.Element;
  updated: boolean;
  isUpdate: boolean;
  onReload: () => void;
};

export const EditorToggle: FC<EditorToggleProps> = ({
  type,
  onChange,
  onSubmit,
  onCancel,
  onReload,
  onDelete,
  customChild,
  yamlChild,
  updated,
  isUpdate
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <Flex
      className="editor-toggle-container"
      flex={{ default: 'flex_1' }}
      direction={{ default: 'column' }}
      flexWrap={{ default: 'nowrap' }}
    >
      <FlexItem flex={{ default: 'flexNone' }}>
        <Flex
          className="editor-toggle"
          alignItems={{ default: 'alignItemsCenter' }}
          aria-labelledby="radio-group-title-editor-toggle"
          role="radiogroup"
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          <label className="editor-toggle-label" id="radio-group-title-editor-toggle">
            {t('Configure via:')}
          </label>
          <Radio
            id={EditorType.CUSTOM}
            isChecked={type === EditorType.CUSTOM}
            label={t('Form view')}
            name={EditorType.CUSTOM}
            onChange={(event, checked) => checked && onChange(EditorType.CUSTOM)}
            value={EditorType.CUSTOM}
          />
          <Radio
            data-test={`${EditorType.YAML}-view-input`}
            id={EditorType.YAML}
            isChecked={type === EditorType.YAML}
            label={t('YAML view')}
            name={EditorType.YAML}
            onChange={(event, checked) => checked && onChange(EditorType.YAML)}
            value={EditorType.YAML}
          />
        </Flex>
      </FlexItem>
      <FlexItem id="editor-content-container" flex={{ default: 'flex_1' }}>
        {type === EditorType.CUSTOM ? customChild : yamlChild}
      </FlexItem>
      {(type === EditorType.CUSTOM || ContextSingleton.isStandalone()) && (
        <FlexItem id="editor-toggle-footer" style={{ paddingBottom: '30px' }}>
          {updated && (
            <Alert isInline className="co-alert" variant="info" title={t('This object has been updated.')}>
              {t('Click reload to see the new version.')}
            </Alert>
          )}
          <ActionGroup className="pf-v5-c-form">
            <Button type="submit" onClick={onSubmit} variant="primary">
              {isUpdate ? t('Update') : t('Create')}
            </Button>
            {updated && (
              <Button type="submit" onClick={onReload} variant="secondary">
                {t('Reload')}
              </Button>
            )}
            <Button onClick={onCancel} variant="secondary">
              {t('Cancel')}
            </Button>
            {isUpdate && (
              <Button type="submit" onClick={onDelete} variant="danger">
                {t('Delete')}
              </Button>
            )}
          </ActionGroup>
        </FlexItem>
      )}
    </Flex>
  );
};
