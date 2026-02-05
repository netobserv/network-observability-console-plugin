import { ActionGroup, Button, Form, FormGroup, Panel, PanelMain, PanelMainBody } from '@patternfly/react-core';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Config } from '../../../model/config';
import { FilterCompare, FilterDefinition, Filters, FilterValue } from '../../../model/filters';
import { Indicator } from '../../../utils/filters-helper';
import { Direction } from '../filters-toolbar';
import AutocompleteFilter from './autocomplete-filter';
import CompareFilter from './compare-filter';
import { FilterHints } from './filter-hints';
import FiltersDropdown from './filters-dropdown';
import TextFilter from './text-filter';

export interface FilterSearchPanelProps {
  config: Config;
  filterDefinitions: FilterDefinition[];
  direction: Direction;
  setDirection: (direction: Direction) => void;
  filter: FilterDefinition;
  setFilter: (filter: FilterDefinition) => void;
  filters?: Filters;
  compare: FilterCompare;
  setCompare: (compare: FilterCompare) => void;
  addFilter: (filter: FilterValue) => boolean;
  addFilterFromSuggestions: () => void;
  setMessage: (message: string | undefined) => void;
  indicator: Indicator;
  setIndicator: (indicator: Indicator) => void;
  value: string;
  setValue: (value: string) => void;
  reset: () => void;
}

export const FilterSearchPanel: React.FC<FilterSearchPanelProps> = ({
  config,
  filterDefinitions,
  direction,
  setDirection,
  filter,
  setFilter,
  filters,
  compare,
  setCompare,
  addFilter,
  addFilterFromSuggestions,
  setMessage,
  indicator,
  setIndicator,
  value,
  setValue,
  reset
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  return (
    <Panel variant="raised">
      <PanelMain>
        <PanelMainBody>
          <Form>
            <FormGroup label={t('Filter')} fieldId="field" key="field">
              <FiltersDropdown
                config={config}
                filterDefinitions={filterDefinitions}
                selectedDirection={direction}
                setSelectedDirection={setDirection}
                selectedFilter={filter}
                setSelectedFilter={setFilter}
                match={filters?.match}
              />
              <FilterHints def={filter} />
            </FormGroup>
            <FormGroup label={t('Comparator')} fieldId="compare" key="compare">
              <CompareFilter value={compare} setValue={setCompare} component={filter.component} />
            </FormGroup>
            <FormGroup label={t('Value')} fieldId="value" key="value">
              {filter.component === 'autocomplete' ? (
                <AutocompleteFilter
                  filterDefinition={filter}
                  addFilter={addFilter}
                  setMessage={setMessage}
                  indicator={indicator}
                  setIndicator={setIndicator}
                  currentValue={value}
                  setCurrentValue={setValue}
                />
              ) : (
                <TextFilter
                  filterDefinition={filter}
                  addFilter={addFilter}
                  setMessage={setMessage}
                  indicator={indicator}
                  setIndicator={setIndicator}
                  allowEmpty={compare !== FilterCompare.moreThanOrEqual}
                  regexp={filter.component === 'number' ? /\D/g : undefined}
                  currentValue={value}
                  setCurrentValue={setValue}
                />
              )}
            </FormGroup>
            <ActionGroup className="filters-actions">
              <Button id="reset-form-filter" variant="link" onClick={reset}>
                {t('Reset')}
              </Button>
              <Button
                id="add-form-filter"
                variant="primary"
                onClick={e => {
                  e.preventDefault();
                  addFilterFromSuggestions();
                }}
              >
                {t('Add filter')}
              </Button>
            </ActionGroup>
          </Form>
        </PanelMainBody>
      </PanelMain>
    </Panel>
  );
};
