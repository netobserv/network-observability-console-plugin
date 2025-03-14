import React, { FC } from 'react';
import { Flex, Radio } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import './editor.css';

export enum EditorType {
  CUSTOM = 'custom',
  YAML = 'yaml',
}

export const EditorToggle: FC<EditorToggleProps> = ({ onChange, value }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [type, setType] = React.useState(EditorType.CUSTOM);

  return (
    <div className="editor-toggle">
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        aria-labelledby="radio-group-title-editor-toggle"
        role="radiogroup"
        spaceItems={{ default: 'spaceItemsMd' }}
      >
        <label
          className="editor-toggle-label"
          id="radio-group-title-editor-toggle"
        >
          {t('Configure via:')}
        </label>
        <Radio
          id={EditorType.CUSTOM}
          isChecked={value === EditorType.CUSTOM}
          label={t('Form view')}
          name={EditorType.CUSTOM}
          onChange={handleChange}
          value={EditorType.CUSTOM}
        />
        <Radio
          data-test={`${EditorType.YAML}-view-input`}
          id={EditorType.YAML}
          isChecked={value === EditorType.YAML}
          label={t('YAML view')}
          name={EditorType.YAML}
          onChange={handleChange}
          value={EditorType.YAML}
        />
      </Flex>
    </div>
  );
};

type EditorToggleProps = {
  onChange?: (newValue: EditorType) => void;
  value: EditorType;
};