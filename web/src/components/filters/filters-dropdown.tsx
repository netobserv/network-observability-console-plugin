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
import { FilterDefinition } from '../../model/filters';
import { buildGroups, getFilterFullName } from './filters-helper';

interface FiltersDropdownProps {
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
  const [expandedGroup, setExpandedGroup] = React.useState(0);
  const [isOpen, setOpen] = React.useState(false);

  const getFiltersDropdownItems = () => {
    return [
      <Accordion data-test="filter-accordion" key="accordion">
        {groups.map((g, i) => (
          <AccordionItem key={`group-${i}`}>
            <AccordionToggle
              onClick={() => setExpandedGroup(expandedGroup !== i ? i : -1)}
              isExpanded={expandedGroup === i}
              data-test={`group-${i}-toggle`}
              id={`group-${i}-toggle`}
            >
              {g.title && <h1 className="pf-c-dropdown__group-title">{g.title}</h1>}
            </AccordionToggle>
            <AccordionContent isHidden={expandedGroup !== i}>
              {g.filters.map((f, index) => (
                <DropdownItem
                  data-test={f.id}
                  id={f.id}
                  className={`column-filter-item ${g.title ? 'grouped' : ''}`}
                  component="button"
                  onClick={() => {
                    setSelectedFilter(f);
                    setOpen(false);
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
