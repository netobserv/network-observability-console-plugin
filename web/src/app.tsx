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
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import NetflowTrafficParent from './components/netflow-traffic-parent';
import NetflowTrafficTab from './components/netflow-traffic-tab';

interface AppState {
  activeItem: number | string;
  isNavOpen: boolean;
  isDarkTheme: boolean;
}

export const pages = [
  {
    id: 'netflow-traffic',
    name: 'Netflow Traffic'
  },
  {
    id: 'pod-tab',
    name: 'Pod tab'
  },
  {
    id: 'namespace-tab',
    name: 'Namespace tab'
  },
  {
    id: 'node-tab',
    name: 'Node tab'
  }
];

export class App extends React.Component<{}, AppState> {
  state: AppState = {
    activeItem: '',
    isNavOpen: true,
    isDarkTheme: false
  };

  private onNavSelect = (selectedItem: { itemId: number | string }) => {
    console.debug('onNavSelect', selectedItem);
    this.setState({ activeItem: selectedItem.itemId });
  };

  private onThemeSelect = (isDarkTheme: boolean) => {
    console.debug('onThemeSelect', isDarkTheme);
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
    console.debug('getPageContent', id);
    switch (id) {
      case 'pod-tab':
        return <NetflowTrafficTab obj={{ kind: 'Pod', metadata: { name: 'test', namespace: 'default' } }} />;
      case 'namespace-tab':
        return <NetflowTrafficTab obj={{ kind: 'Namespace', metadata: { name: 'test' } }} />;
      case 'node-tab':
        return <NetflowTrafficTab obj={{ kind: 'Node', metadata: { name: 'test' } }} />;
      default:
        return <NetflowTrafficParent />;
    }
  };

  private getPageContext = (id: string, name: string) => {
    console.debug('getPageContext', id);
    const content = this.getPageContent(id);
    switch (id) {
      case 'netflow-traffic':
        return <>{content}</>;
      default:
        return (
          <PageSection id="pageSection">
            <div id="pageHeader">
              <h1>{`${name} example`}</h1>
            </div>
            {content}
          </PageSection>
        );
    }
  };

  private getPages = () => (
    <Routes>
      {pages.map(page => (
        <Route path={page.id} key={page.id} element={this.getPageContext(page.id, page.name)} />
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
      <BrowserRouter>
        <Page header={AppHeader} sidebar={AppSidebar} isManagedSidebar>
          {this.getPages()}
        </Page>
      </BrowserRouter>
    );
  }
}

export default App;
