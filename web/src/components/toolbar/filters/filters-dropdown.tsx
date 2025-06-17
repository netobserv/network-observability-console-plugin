import { Dropdown, DropdownItem, Flex, FlexItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition, FilterId } from '../../../model/filters';
import { findFilter } from '../../../utils/filter-definitions';
import { swapFilterDefinition } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import './filters-dropdown.css';

export interface FiltersDropdownProps {
  filterDefinitions: FilterDefinition[];
  selectedDirection?: 'source' | 'destination';
  setSelectedDirection: (v?: 'source' | 'destination') => void;
  selectedFilter: FilterDefinition;
  setSelectedFilter: (f: FilterDefinition) => void;
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({
  filterDefinitions,
  selectedDirection,
  setSelectedDirection,
  selectedFilter,
  setSelectedFilter
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  const directionRef = useOutsideClickEvent(() => setColumnOpen(false));
  const [isDirectionOpen, setDirectionOpen] = React.useState<boolean>(false);

  const columnRef = useOutsideClickEvent(() => setColumnOpen(false));
  const [isColumnOpen, setColumnOpen] = React.useState<boolean>(false);

  const getFiltersDropdownItems = () => {
    return filterDefinitions
      .filter(f => (selectedDirection ? f.category === selectedDirection : !f.category || f.category === 'targeteable'))
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
  };

  React.useEffect(() => {
    if (selectedDirection) {
      const dir = selectedDirection === 'source' ? 'src' : 'dst';
      if (selectedFilter.category) {
        setSelectedFilter(swapFilterDefinition(filterDefinitions, selectedFilter, dir));
      } else {
        setSelectedFilter(findFilter(filterDefinitions, `${dir}_namespace`)!);
      }
    } else if (selectedFilter.id.startsWith('src_') || selectedFilter.id.startsWith('dst_')) {
      const id = selectedFilter.id.replace('src_', '').replace('dst_', '') as FilterId;
      setSelectedFilter(findFilter(filterDefinitions, id)!);
    }
  }, [filterDefinitions, selectedDirection, selectedFilter, setSelectedFilter]);

  return (
    <Flex>
      <FlexItem
        id="direction-filter-dropdown-container"
        data-test="column-filter-dropdown-container"
        ref={directionRef}
      >
        <Dropdown
          data-test="direction-filter-dropdown"
          id="direction-filter-dropdown"
          isOpen={isDirectionOpen}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              data-test="direction-filter-toggle"
              id="direction-filter-toggle"
              onClick={() => {
                setDirectionOpen(!isDirectionOpen);
              }}
              isExpanded={isDirectionOpen}
            >
              {selectedDirection === 'source'
                ? t('Source')
                : selectedDirection === 'destination'
                ? t('Destination')
                : t('Any direction')}
            </MenuToggle>
          )}
        >
          <DropdownItem
            data-test={'source'}
            id={'source'}
            className={`direction-filter-item`}
            component="button"
            onClick={() => {
              setDirectionOpen(false);
              setSelectedDirection('source');
            }}
          >
            {t('Source')}
          </DropdownItem>
          <DropdownItem
            data-test={'destination'}
            id={'destination'}
            className={`direction-filter-item`}
            component="button"
            onClick={() => {
              setDirectionOpen(false);
              setSelectedDirection('destination');
            }}
          >
            {t('Destination')}
          </DropdownItem>
          <DropdownItem
            data-test={'any'}
            id={'any'}
            className={`direction-filter-item`}
            component="button"
            onClick={() => {
              setDirectionOpen(false);
              setSelectedDirection(undefined);
            }}
          >
            {t('Any direction')}
          </DropdownItem>
        </Dropdown>
      </FlexItem>
      <FlexItem id="column-filter-dropdown-container" data-test="column-filter-dropdown-container" ref={columnRef}>
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
      </FlexItem>
    </Flex>
  );
};

export default FiltersDropdown;
