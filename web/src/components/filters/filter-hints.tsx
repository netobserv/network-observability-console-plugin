import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Popover, Text, TextVariants } from '@patternfly/react-core';
import { FilterDefinition } from '../../model/filters';
import { Link } from 'react-router-dom';

interface FilterHintsProps {
  def: FilterDefinition;
}

export const FilterHints: React.FC<FilterHintsProps> = ({ def }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  if (!def.hint) {
    return null;
  }
  return (
    <div data-test="tips" id="tips">
      <Text component={TextVariants.p}>{def.hint}</Text>
      {def.examples && (
        <Popover
          aria-label="Hint popover"
          headerContent={def.name}
          footerContent={def.docUrl ? <Button
            variant="link"
            component={(props: React.FunctionComponent) => (
              <Link {...props} target="_blank" to={{ pathname: def.docUrl }} />
            )}
          >
            {t('Show related documentation')}
          </Button> : undefined}
          bodyContent={
            <div className="text-left-pre">
              {def.examples}
            </div>
          }
          hasAutoWidth={true}
          position={'bottom'}
        >
          <Button data-test="more" id="more" variant="link">
            {t('Learn more')}
          </Button>
        </Popover>
      )}
    </div>
  );
};
