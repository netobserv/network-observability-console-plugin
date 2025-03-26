import { Button, Content, Flex, FlexItem, Popover } from '@patternfly/react-core';
import { TimesIcon } from '@patternfly/react-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';

export interface ChipsPopoverProps {
  chipsPopoverMessage?: string;
  setChipsPopoverMessage: (v?: string) => void;
}

export const ChipsPopover: React.FC<ChipsPopoverProps> = ({ chipsPopoverMessage, setChipsPopoverMessage }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  if (!chipsPopoverMessage) {
    return <></>;
  }

  return (
    <Popover
      id="chips-popover"
      isVisible={chipsPopoverMessage !== undefined}
      hideOnOutsideClick={false}
      showClose={false}
      position="bottom"
      headerContent={
        <Flex direction={{ default: 'row' }}>
          <FlexItem flex={{ default: 'flex_1' }}>{t('Some filters have been automatically disabled')}</FlexItem>
          <FlexItem>
            <Button
              icon={<TimesIcon />}
              variant="plain"
              className="chips-popover-close-button"
              onClick={() => setChipsPopoverMessage(undefined)}
            />
          </FlexItem>
        </Flex>
      }
      bodyContent={<Content> {chipsPopoverMessage}</Content>}
      triggerRef={() => document.getElementsByClassName('custom-chip-group disabled-group')?.[0] as HTMLElement}
    />
  );
};

export default ChipsPopover;
