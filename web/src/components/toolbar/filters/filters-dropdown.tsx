import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition } from '../../../model/filters';
import { getFilterFullName } from '../../../utils/filters-helper';
import { useOutsideClickEvent } from '../../../utils/outside-hook';
import './filters-dropdown.css';

export interface FiltersDropdownProps {
  filterDefinitions: FilterDefinition[];
  selectedFilter: FilterDefinition;
  setSelectedFilter: (f: FilterDefinition) => void;
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({
  filterDefinitions,
  selectedFilter,
  setSelectedFilter
}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);

  const getFiltersDropdownItems = () => {
    return filterDefinitions
      .filter(f => !f.category || f.category === 'targeteable')
      .map((f, index) => (
        <DropdownItem
          data-test={f.id}
          id={f.id}
          className={`column-filter-item`}
          component="button"
          onClick={() => {
            setOpen(false);
            setSelectedFilter(f);
          }}
          key={index}
        >
          {f.name}
        </DropdownItem>
      ));
  };

  return (
    <div id="column-filter-dropdown-container" data-test="column-filter-dropdown-container" ref={ref}>
      <Dropdown
        data-test="column-filter-dropdown"
        id="column-filter-dropdown"
        isOpen={isOpen}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            data-test="column-filter-toggle"
            id="column-filter-toggle"
            onClick={() => {
              setOpen(!isOpen);
            }}
            isExpanded={isOpen}
          >
            {getFilterFullName(selectedFilter, t)}
          </MenuToggle>
        )}
      >
        {getFiltersDropdownItems()}
      </Dropdown>
    </div>
  );
};

export default FiltersDropdown;
