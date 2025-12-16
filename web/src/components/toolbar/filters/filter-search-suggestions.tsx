import { Flex, FlexItem, Menu, MenuContent, MenuItem, MenuList } from '@patternfly/react-core';
import React from 'react';
import { FilterCompare } from '../../../model/filters';
import { FormUpdateResult, Suggestion } from './filter-search-input';

export interface FilterSearchSuggestionsProps {
  suggestions: Suggestion[];
  setSuggestions: (suggestions: Suggestion[]) => void;
  searchInput: HTMLInputElement | null;
  searchInputValue: string;
  updateForm: (value: string, validate?: boolean) => FormUpdateResult;
  onSearchChange: (value: string) => void;
}

export const FilterSearchSuggestions: React.FC<FilterSearchSuggestionsProps> = ({
  suggestions,
  setSuggestions,
  searchInput,
  searchInputValue,
  updateForm,
  onSearchChange
}) => {
  return (
    <Menu
      onKeyDown={e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          // clear suggestions on esc key
          setSuggestions([]);
          searchInput?.focus();
        }
      }}
    >
      <MenuContent>
        <MenuList>
          {suggestions.map((suggestion, index) => (
            <MenuItem
              id={`suggestion-${index}`}
              itemId={suggestion}
              key={`suggestion-${index}`}
              onKeyDown={e => {
                if (index === 0 && e.key === 'ArrowUp') {
                  e.preventDefault();
                  searchInput?.focus();
                }
              }}
              onClick={() => {
                const updated = updateForm(searchInputValue);
                if (!updated.def) {
                  if (!suggestion.validate) {
                    onSearchChange(suggestion.value);
                  } else {
                    updateForm(suggestion.value, true);
                  }
                } else if (!updated.comparator) {
                  // check if it's a valid comparator
                  if ((Object.values(FilterCompare) as string[]).includes(suggestion.value)) {
                    onSearchChange(`${updated.def.id}${suggestion.value}`);
                  } else {
                    // else consider this as a field since ids can overlap (name / namespace)
                    onSearchChange(suggestion.value);
                  }
                } else {
                  updateForm(`${updated.def.id}${updated.comparator}${suggestion.value}`, true);
                }
              }}
            >
              <Flex direction={{ default: 'row' }}>
                <FlexItem className="filter-text-ellipsis" flex={{ default: 'flex_1' }}>
                  {suggestion.value}
                </FlexItem>
                <FlexItem className="filter-text-ellipsis" flex={{ default: 'flex_1' }}>
                  {suggestion.display}
                </FlexItem>
              </Flex>
            </MenuItem>
          ))}
        </MenuList>
      </MenuContent>
    </Menu>
  );
};
