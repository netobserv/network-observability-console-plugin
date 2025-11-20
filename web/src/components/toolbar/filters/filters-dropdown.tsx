import { Dropdown, DropdownItem, Flex, MenuToggle, MenuToggleElement, Radio } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition, FilterId } from '../../../model/filters';
import { Match } from '../../../model/flow-query';
import { findFilter } from '../../../utils/filter-definitions';
import { swapFilterDefinition } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import { Direction } from '../filters-toolbar';
import './filters-dropdown.css';

export interface FiltersDropdownProps {
  filterDefinitions: FilterDefinition[];
  selectedDirection: Direction;
  setSelectedDirection: (v: Direction) => void;
  selectedFilter: FilterDefinition;
  setSelectedFilter: (f: FilterDefinition) => void;
  match?: Match;
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({
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
      .filter(f => !f.category || f.category === 'targeteable')
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
          {f.name}
        </DropdownItem>
      ));
  }, [filterDefinitions, setSelectedFilter]);

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
      setSelectedFilter(findFilter(filterDefinitions, id)!);
    }
  }, [filterDefinitions, selectedDirection, selectedFilter, setSelectedDirection, setSelectedFilter]);

  return (
    <Flex id="direction-column-filter-dropdowns">
      <div id="column-filter-dropdown-container" data-test="column-filter-dropdown-container" ref={columnRef}>
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
      </div>
      <div id="direction-filter-dropdown-container" data-test="column-filter-dropdown-container">
        <Radio
          id="radio-source"
          label={match === 'bidirectionnal' ? t('As endpoint A') : t('As source')}
          name="source"
          isChecked={selectedDirection === 'source'}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category}
        />
        <Radio
          id="radio-destination"
          label={match === 'bidirectionnal' ? t('As endpoint B') : t('As destination')}
          name="destination"
          isChecked={selectedDirection === 'destination'}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category}
        />
        <Radio
          id="radio-either"
          label={t('Either')}
          name="either"
          isChecked={!selectedDirection}
          onChange={onRadioChange}
          isDisabled={!selectedFilter.category}
        />
      </div>
    </Flex>
  );
};

export default FiltersDropdown;
