import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { BarsIcon, ListIcon, RouteIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Match } from '../../model/flow-query';

export interface MatchDropdownProps {
  selected: Match;
  setMatch: (l: Match) => void;
  id?: string;
}

export const MatchValues = ['all', 'any', 'peers'] as Match[];

export const MatchDropdown: React.FC<MatchDropdownProps> = ({ selected, setMatch, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const getMatchDisplay = (layoutName: Match) => {
    switch (layoutName) {
      case 'any':
        return t('Any');
      case 'all':
        return t('All');
      case 'peers':
        return t('Peers');
      default:
        return t('Invalid');
    }
  };

  const getIcon = (layoutName: Match) => {
    switch (layoutName) {
      case 'any':
        return <BarsIcon />;
      case 'all':
        return <ListIcon />;
      case 'peers':
        return <RouteIcon />;
      default:
        return t('Invalid');
    }
  };

  return (
    <Dropdown
      data-test={id}
      id={id}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          data-test={`${id}-dropdown`}
          id={`${id}-dropdown`}
          isExpanded={isOpen}
          onClick={() => setOpen(!isOpen)}
          onBlur={() => setTimeout(() => setOpen(false), 500)}
        >
          {getIcon(selected)}
          &nbsp;
          {getMatchDisplay(selected)}
        </MenuToggle>
      )}
    >
      {MatchValues.map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setOpen(false);
            setMatch(v);
          }}
        >
          {getIcon(v)}
          &nbsp;
          {getMatchDisplay(v)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default MatchDropdown;
