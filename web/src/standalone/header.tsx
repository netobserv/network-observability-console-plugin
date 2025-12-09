import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  PageToggleButton,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import React from 'react';

export const Header: React.FunctionComponent<{
  isSidebarOpen: boolean;
  onSidebarToggle: () => void;
  isDark: boolean;
  setDark: (dark: boolean) => void;
}> = ({ isSidebarOpen, onSidebarToggle, isDark, setDark }) => {
  const onThemeSelect = (isDarkTheme: boolean) => {
    setDark(isDarkTheme);
    const htmlElement = document.getElementsByTagName('html')[0];
    if (htmlElement) {
      if (isDarkTheme) {
        htmlElement.classList.add('pf-v5-theme-dark');
      } else {
        htmlElement.classList.remove('pf-v5-theme-dark');
      }
    }
  };

  return (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          id="nav-toggle"
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={'/assets/netobserv.svg'} widths={{ default: '40px' }} alt="NetObserv Logo" />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <Toolbar id="vertical-toolbar">
          <ToolbarContent>
            <ToolbarItem className="masthead-link">
              <a href="https://netobserv.io" title="Open netobserv.io" target="_blank">
                NetObserv
              </a>
            </ToolbarItem>
            <ToolbarItem align={{ default: 'alignRight' }}>
              <ToggleGroup>
                <ToggleGroupItem text="Light" isSelected={!isDark} onClick={() => onThemeSelect(false)} />
                <ToggleGroupItem text="Dark" isSelected={isDark} onClick={() => onThemeSelect(true)} />
              </ToggleGroup>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>
      </MastheadContent>
    </Masthead>
  );
};

export default Header;
