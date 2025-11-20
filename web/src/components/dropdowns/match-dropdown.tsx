import { Dropdown, DropdownItem, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { LongArrowAltDownIcon, LongArrowAltUpIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Match } from '../../model/flow-query';

export interface MatchDropdownProps {
  selected: Match;
  setMatch: (l: Match) => void;
  allowBidirectionnal?: boolean;
  id?: string;
}

export const MatchValues = ['any', 'all', 'bidirectionnal'] as Match[];

export const MatchDropdown: React.FC<MatchDropdownProps> = ({ allowBidirectionnal, selected, setMatch, id }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const getMatchDisplay = (layoutName: Match, toggle?: boolean) => {
    switch (layoutName) {
      case 'any':
        return t('OR');
      case 'all':
        return t('AND');
      case 'bidirectionnal':
        if (allowBidirectionnal) {
          if (toggle) {
            return (
              <div style={{ transform: 'rotate(90deg)' }}>
                <LongArrowAltUpIcon />
                <LongArrowAltDownIcon />
              </div>
            );
          } else {
            return t('Bidirectional');
          }
        } else {
          // display as AND if bidirectionnal is not allowed here
          return t('AND');
        }
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
          {getMatchDisplay(selected, true)}
        </MenuToggle>
      )}
    >
      {MatchValues.filter(v => allowBidirectionnal || v !== 'bidirectionnal').map(v => (
        <DropdownItem
          data-test={v}
          id={v}
          key={v}
          onClick={() => {
            setOpen(false);
            setMatch(v);
          }}
        >
          {getMatchDisplay(v)}
        </DropdownItem>
      ))}
    </Dropdown>
  );
};

export default MatchDropdown;
