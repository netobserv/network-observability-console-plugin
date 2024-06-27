import {
  Button,
  Dropdown,
  DropdownItem,
  OverflowMenu,
  OverflowMenuContent,
  OverflowMenuControl,
  OverflowMenuGroup,
  OverflowMenuItem
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MaybeTooltip } from '../tooltip/maybe-tooltip';

interface Item {
  id: string;
  icon?: JSX.Element;
  label: string;
  tooltip?: React.ReactNode;
  onClick: () => void;
  enabled?: boolean;
}

export interface LinksOverflowProps {
  id: string;
  items: Item[];
}

export const LinksOverflow: React.FC<LinksOverflowProps> = ({ id, items }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const [isOpen, setOpen] = React.useState(false);

  const enabledItems = items.filter(i => i.enabled !== false);
  if (enabledItems.length === 0) {
    return null;
  }

  return (
    <OverflowMenu breakpoint="2xl">
      <OverflowMenuContent isPersistent>
        <OverflowMenuGroup groupType="button" isPersistent className="flex-start">
          {enabledItems.map(item => (
            <OverflowMenuItem key={item.id}>
              <MaybeTooltip content={item.tooltip}>
                <Button
                  data-test={item.id + '-button'}
                  id={item.id + '-button'}
                  variant="link"
                  className="overflow-button"
                  icon={item.icon}
                  onClick={item.onClick}
                >
                  {item.label}
                </Button>
              </MaybeTooltip>
            </OverflowMenuItem>
          ))}
        </OverflowMenuGroup>
      </OverflowMenuContent>
      <OverflowMenuControl className="flex-start">
        <Dropdown
          data-test={id + '-dropdown'}
          id={id + '-dropdown'}
          onSelect={() => setOpen(false)}
          toggle={
            <Button
              data-test={id + '-button'}
              id={id + '-button'}
              variant="link"
              className="overflow-button"
              icon={<EllipsisVIcon />}
              onClick={() => setOpen(!isOpen)}
            >
              {t('More options')}
            </Button>
          }
          isOpen={isOpen}
          dropdownItems={enabledItems.map(item => (
            <DropdownItem key={item.id} onClick={item.onClick} data-test={item.id + '-button'}>
              {item.label}
            </DropdownItem>
          ))}
        />
      </OverflowMenuControl>
    </OverflowMenu>
  );
};
