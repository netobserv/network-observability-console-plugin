import { Dropdown, DropdownItem, Flex, MenuToggle, MenuToggleElement, Radio, Tooltip } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Config } from '../../../model/config';
import { FilterDefinition, FilterId } from '../../../model/filters';
import { Match } from '../../../model/flow-query';
import { findFilter } from '../../../utils/filter-definitions';
import { isLokiLabel, swapFilterDefinition } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import { Direction } from '../filters-toolbar';
import './filters-dropdown.css';

export interface FiltersDropdownProps {
  config: Config;
  filterDefinitions: FilterDefinition[];
  selectedDirection: Direction;
  setSelectedDirection: (v: Direction) => void;
  selectedFilter: FilterDefinition;
  setSelectedFilter: (f: FilterDefinition | null | undefined) => void;
  match?: Match;
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({
  config,
  filterDefinitions,
  selectedDirection,
  setSelectedDirection,
  selectedFilter,
  setSelectedFilter,
  match
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const columnRef = useOutsideClickEvent(() => setColumnOpen(false));
  const [isColumnOpen, setColumnOpen] = React.useState<boolean>(false);

  const getFiltersDropdownItems = React.useCallback(() => {
    return filterDefinitions
      .filter(f => !f.category || f.category === 'endpoint')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f, index) => (
        <DropdownItem
          data-test={f.id}
          id={f.id}
          className={`column-filter-item`}
          component="button"
          onClick={() => {
            setColumnOpen(false);
            setSelectedFilter(f);
          }}
          key={index}
        >
          {isLokiLabel(f, config) ? <strong>{f.name}</strong> : f.name}
        </DropdownItem>
      ));
  }, [config, filterDefinitions, setSelectedFilter]);

  const onRadioChange = React.useCallback(
    (event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
      if (checked) {
        const name = event.currentTarget.name;
        if (name === 'either') {
          setSelectedDirection(undefined);
        } else {
          setSelectedDirection(name as Direction);
        }
      }
    },
    [setSelectedDirection]
  );

  React.useEffect(() => {
    if (selectedDirection) {
      const dir = selectedDirection === 'source' ? 'src' : 'dst';
      if (selectedFilter.category) {
        setSelectedFilter(swapFilterDefinition(filterDefinitions, selectedFilter, dir));
      } else {
        setSelectedDirection(undefined);
      }
    } else if (selectedFilter.id.startsWith('src_') || selectedFilter.id.startsWith('dst_')) {
      const id = selectedFilter.id.replace('src_', '').replace('dst_', '') as FilterId;
      setSelectedFilter(findFilter(filterDefinitions, id));
    }
  }, [filterDefinitions, selectedDirection, selectedFilter, setSelectedDirection, setSelectedFilter]);
  return (
    <Flex id="direction-column-filter-dropdowns">
      <div id="column-filter-dropdown-container" data-test="column-filter-dropdown-container" ref={columnRef}>
        <Tooltip
          content={
            <div>
              {t('Select a field name to filter on. Use indexed fields in bold to improve your query performances.')}
            </div>
          }
          isVisible={isColumnOpen}
          enableFlip={false}
          position={'top'}
        >
          <Dropdown
            data-test="column-filter-dropdown"
            id="column-filter-dropdown"
            isOpen={isColumnOpen}
            isScrollable
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                data-test="column-filter-toggle"
                id="column-filter-toggle"
                onClick={() => {
                  setColumnOpen(!isColumnOpen);
                }}
                isExpanded={isColumnOpen}
              >
                {selectedFilter.name}
              </MenuToggle>
            )}
          >
            {getFiltersDropdownItems()}
          </Dropdown>
        </Tooltip>
      </div>
      <div id="direction-filter-dropdown-container" data-test="column-filter-dropdown-container">
        <Radio
          id="radio-source"
          data-test="radio-source"
          label={match === 'bidirectional' ? t('As endpoint A') : t('As source')}
          name="source"
          isChecked={selectedDirection === 'source'}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category}
        />
        <Radio
          id="radio-destination"
          data-test="radio-destination"
          label={match === 'bidirectional' ? t('As endpoint B') : t('As destination')}
          name="destination"
          isChecked={selectedDirection === 'destination'}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category}
        />
        <Radio
          id="radio-either"
          data-test="radio-either"
          label={t('Either')}
          name="either"
          isChecked={!selectedDirection}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category || match === 'bidirectional'}
        />
      </div>
    </Flex>
  );
};

export default FiltersDropdown;
