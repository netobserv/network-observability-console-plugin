import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  Dropdown,
  DropdownItem,
  DropdownToggle
} from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FilterDefinition } from '../../model/filters';
import { buildGroups, getFilterFullName } from './filters-helper';

interface FiltersDropdownProps {
  selectedFilter: FilterDefinition;
  setSelectedFilter: (f: FilterDefinition) => void;
}

export const FiltersDropdown: React.FC<FiltersDropdownProps> = ({ selectedFilter, setSelectedFilter }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const groups = buildGroups(t);

  const [isSearchFiltersOpen, setSearchFiltersOpen] = React.useState<boolean>(false);
  const [expandedGroup, setExpandedGroup] = React.useState(0);

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
                    setSearchFiltersOpen(false);
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
      dropdownItems={getFiltersDropdownItems()}
      isOpen={isSearchFiltersOpen}
      toggle={
        <DropdownToggle
          data-test="column-filter-toggle"
          id="column-filter-toggle"
          onToggle={() => setSearchFiltersOpen(!isSearchFiltersOpen)}
        >
          {getFilterFullName(selectedFilter, t)}
        </DropdownToggle>
      }
    />
  );
};

export default FiltersDropdown;
