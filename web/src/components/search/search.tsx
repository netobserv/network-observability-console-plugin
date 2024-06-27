import { Button, InputGroup, TextInput, ValidatedOptions } from '@patternfly/react-core';
import { AngleDownIcon, AngleUpIcon, SearchIcon, TimesIcon } from '@patternfly/react-icons';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

export type SearchEventType = 'change' | 'searchNext' | 'searchPrevious';

export type SearchEvent = {
  searchValue: string;
  type: SearchEventType;
};

export type SearchHandle = {
  updateIndicators: (count: string, indicators: ValidatedOptions) => void;
};

export interface SearchComponentProps {
  isDark?: boolean;
  setSearchEvent: (se: SearchEvent) => void;
  ref?: React.Ref<SearchHandle>;
  children?: React.ReactNode;
}

// eslint-disable-next-line react/display-name
export const SearchComponent: React.FC<SearchComponentProps> = React.forwardRef(
  (props, ref: React.Ref<SearchHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');

    const [searchValue, setSearchValue] = React.useState<string>('');
    const [searchValidated, setSearchValidated] = React.useState<ValidatedOptions>();
    const [searchResultCount, setSearchResultCount] = React.useState<string>('');

    React.useImperativeHandle(ref, () => ({
      updateIndicators
    }));

    const updateIndicators = (count: string, validated: ValidatedOptions) => {
      setSearchResultCount(count);
      setSearchValidated(validated);
    };

    //update search value and clear indicators
    const onChangeSearch = (v = '') => {
      setSearchResultCount('');
      setSearchValidated(ValidatedOptions.default);
      setSearchValue(v);
      props.setSearchEvent({ searchValue: v, type: 'change' });
    };

    return (
      <InputGroup>
        <TextInput
          data-test="search-topology-element-input"
          id="search-topology-element-input"
          className={'search'}
          placeholder={t('Find in view')}
          autoFocus
          type={searchValidated !== ValidatedOptions.default ? 'text' : 'search'}
          aria-label="search"
          onKeyPress={e => e.key === 'Enter' && props.setSearchEvent({ searchValue, type: 'searchNext' })}
          onChange={onChangeSearch}
          value={searchValue}
          validated={searchValidated}
        />
        {!_.isEmpty(searchResultCount) ? (
          <TextInput
            value={searchResultCount}
            isDisabled
            id="topology-search-result-count"
            data-test="topology-search-result-count"
          />
        ) : (
          <></>
        )}
        {_.isEmpty(searchResultCount) ? (
          <Button
            data-test="search-topology-element-button"
            id="search-topology-element-button"
            className={`${props.isDark ? 'dark' : 'light'}`}
            variant="control"
            aria-label="search for element button"
            onClick={() =>
              searchValidated === ValidatedOptions.error
                ? onChangeSearch()
                : props.setSearchEvent({ searchValue, type: 'searchNext' })
            }
          >
            {searchValidated === ValidatedOptions.error ? <TimesIcon /> : <SearchIcon />}
          </Button>
        ) : (
          <>
            <Button
              data-test="prev-search-topology-element-button"
              id="prev-search-topology-element-button"
              variant="control"
              aria-label="previous button for search element"
              onClick={() => props.setSearchEvent({ searchValue, type: 'searchPrevious' })}
            >
              <AngleUpIcon />
            </Button>
            <Button
              data-test="next-search-topology-element-button"
              id="next-search-topology-element-button"
              variant="control"
              aria-label="next button for search element"
              onClick={() => props.setSearchEvent({ searchValue, type: 'searchNext' })}
            >
              <AngleDownIcon />
            </Button>
            <Button
              data-test="clear-search-topology-element-button"
              id="clear-search-topology-element-button"
              variant="control"
              aria-label="clear button for search element"
              onClick={() => onChangeSearch()}
            >
              <TimesIcon />
            </Button>
          </>
        )}
      </InputGroup>
    );
  }
);

export default SearchComponent;
