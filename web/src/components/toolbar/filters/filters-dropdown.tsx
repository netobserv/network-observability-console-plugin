import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Dropdown,
  DropdownItem,
  MenuToggle,
  MenuToggleElement
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition } from '../../../model/filters';
import { buildGroups, getFilterFullName } from '../../../utils/filters-helper';
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
  const groups = buildGroups(filterDefinitions, t);
  const ref = useOutsideClickEvent(() => setOpen(false));
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const [expandedGroup, setExpandedGroup] = React.useState(0);

  const getFiltersDropdownItems = () => {
    return [
      <Accordion data-test="filter-accordion" key="accordion">
        {groups.map((g, i) => (
          <AccordionItem key={`group-${i}`} isExpanded={expandedGroup === i}>
            <AccordionToggle
              onClick={() => setExpandedGroup(expandedGroup !== i ? i : -1)}
              data-test={`group-${i}-toggle`}
              id={`group-${i}-toggle`}
            >
              {g.title && <h1 className="pf-v6-c-dropdown__group-title">{g.title}</h1>}
            </AccordionToggle>
            <AccordionContent>
              {g.filters.map((f, index) => (
                <DropdownItem
                  data-test={f.id}
                  id={f.id}
                  className={`column-filter-item ${g.title ? 'grouped' : ''}`}
                  component="button"
                  onClick={() => {
                    setOpen(false);
                    setSelectedFilter(f);
                  }}
                  key={index}
                >
                  {f.name}
                </DropdownItem>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    ];
  };

  return (
    <Dropdown
      data-test="column-filter-dropdown"
      id="column-filter-dropdown"
      ref={ref}
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
  );
};

export default FiltersDropdown;
