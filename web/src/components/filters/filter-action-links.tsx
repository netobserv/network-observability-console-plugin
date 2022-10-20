import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

export interface FilterActionLinksProps {
  showClear: boolean;
  showReset: boolean;
  resetFilters: () => void;
  clearFilters: () => void;
}

export const FilterActionLinks: React.FC<FilterActionLinksProps> = ({
  showClear,
  showReset,
  resetFilters,
  clearFilters
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <>
      {showReset && (
        <Button id="reset-filters-button" data-test="reset-filters-button" variant="link" onClick={resetFilters}>
          {t('Reset default filters')}
        </Button>
      )}
      {showClear && (
        <Button
          id="clear-all-filters-button"
          data-test="clear-all-filters-button"
          variant="link"
          onClick={clearFilters}
        >
          {t('Clear all filters')}
        </Button>
      )}
    </>
  );
};
