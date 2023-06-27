import {
  Brand,
  Nav,
  NavItem,
  NavList,
  Page,
  PageHeader,
  PageHeaderTools,
  PageHeaderToolsGroup,
  PageHeaderToolsItem,
  PageSection,
  PageSidebar,
  Radio
} from '@patternfly/react-core';
import React from 'react';
import { BrowserRouter as Router, Link, Route, Routes } from 'react-router-dom-v5-compat';
import NetflowTrafficParent from './components/netflow-traffic-parent';

interface AppState {
  activeItem: number | string;
  isNavOpen: boolean;
  isDarkTheme: boolean;
}

export const pages = [
  {
    id: '/',
    name: 'Netflow Traffic'
  }
];

export class App extends React.Component<{}, AppState> {
  state: AppState = {
    activeItem: '',
    isNavOpen: true,
    isDarkTheme: false
  };

  private onNavSelect = (selectedItem: { itemId: number | string }) => {
    this.setState({ activeItem: selectedItem.itemId });
  };

  private onThemeSelect = (isDarkTheme: boolean) => {
    this.setState({ isDarkTheme });
    const htmlElement = document.getElementsByTagName('html')[0];
    if (htmlElement) {
      if (isDarkTheme) {
        htmlElement.classList.add('pf-theme-dark');
      } else {
        htmlElement.classList.remove('pf-theme-dark');
      }
    }
  };

  private getPageContent = (id: string) => {
    switch (id) {
      case 'netflow-traffic-parent':
      default:
        return <NetflowTrafficParent />;
    }
  };

  private getPages = () => (
    <Routes>
      {pages.map(page => (
        <Route
          path={page.id}
          element={<PageSection style={{ zIndex: 2 }}>{this.getPageContent(page.id)}</PageSection>}
          key={page.id}
        />
      ))}
    </Routes>
  );

  render() {
    const { isNavOpen, activeItem, isDarkTheme } = this.state;

    const AppToolbar = (
      <PageHeaderTools>
        <PageHeaderToolsGroup>
          <PageHeaderToolsItem style={{ marginRight: '10px' }}>
            <Radio
              id="light-theme"
              aria-label="Light theme"
              label={`Light theme`}
              name="light-theme"
              isChecked={!isDarkTheme}
              onChange={(checked: boolean) => checked && this.onThemeSelect(false)}
            />
          </PageHeaderToolsItem>
          <PageHeaderToolsItem>
            <Radio
              id="dark-theme"
              label="Dark theme"
              aria-label="Dark theme"
              name="dark-theme"
              isChecked={isDarkTheme}
              onChange={(checked: boolean) => checked && this.onThemeSelect(true)}
            />
          </PageHeaderToolsItem>
        </PageHeaderToolsGroup>
      </PageHeaderTools>
    );

    const AppHeader = (
      <PageHeader
        id="page-main-header"
        //show netobserv logo from github
        logo={<Brand src={'https://avatars.githubusercontent.com/u/91939379?s=35'} alt="Netobserv Logo" />}
        headerTools={AppToolbar}
        showNavToggle
        isNavOpen={isNavOpen}
        onNavToggle={() => this.setState({ isNavOpen: !isNavOpen })}
      />
    );

    const nav = (
      <Nav onSelect={this.onNavSelect} aria-label="Nav">
        <NavList>
          {pages.map((page, index) => (
            <NavItem itemId={index} isActive={activeItem === index} key={page.id}>
              <Link id={`${page.id}-nav-item-link`} to={`/${page.id}`}>
                {page.name}
              </Link>
            </NavItem>
          ))}
        </NavList>
      </Nav>
    );

    const AppSidebar = <PageSidebar isNavOpen={isNavOpen} nav={nav} />;

    return (
      <>
        <Router>
          <Page header={AppHeader} sidebar={AppSidebar} isManagedSidebar>
            {this.getPages()}
          </Page>
        </Router>
      </>
    );
  }
}

export default App;
