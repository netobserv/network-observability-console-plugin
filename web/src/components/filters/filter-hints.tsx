import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Text, TextVariants } from '@patternfly/react-core';
import { FilterDefinition } from '../../model/filters';

interface FilterHintsProps {
  def: FilterDefinition;
}

export const FilterHints: React.FC<FilterHintsProps> = ({ def }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');
  if (!def.hint) {
    return null;
  }
  return (
    <div id="tips">
      <Text component={TextVariants.p}>{def.hint}</Text>
      {def.examples && (
        <Popover
          aria-label="Hint popover"
          headerContent={def.name}
          bodyContent={<div className="text-left-pre">{def.examples}</div>}
          hasAutoWidth={true}
          position={'bottom'}
        >
          <Button id="more" variant="link">
            {t('Learn more')}
          </Button>
        </Popover>
      )}
    </div>
  );
};
