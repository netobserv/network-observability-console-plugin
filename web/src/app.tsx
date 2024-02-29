import {
  Brand,
  Page,
  Masthead,
  PageSection,
  PageSidebar,
  MastheadMain,
  MastheadBrand,
  MastheadToggle,
  PageToggleButton,
  Toolbar,
  ToolbarContent,
  MastheadContent,
  PageSidebarBody,
  ToolbarItem,
  Nav,
  NavItem,
  NavList,
  ToggleGroup,
  ToggleGroupItem,
  Title,
  Tabs,
  Tab
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import React from 'react';
import NetflowTab from './components/netflow-tab';
import NetflowTrafficParent from './components/netflow-traffic-parent';
import { BrowserRouter, Link } from 'react-router-dom';

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

export const App: React.FunctionComponent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [isDark, setDark] = React.useState(false);

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const onNavSelect = (_event: React.FormEvent<HTMLInputElement>, result: { itemId: number | string }) => {
    console.debug('onNavSelect', result);
    setPageIndex(result.itemId as number);
  };

  const onThemeSelect = (isDarkTheme: boolean) => {
    console.debug('onThemeSelect', isDarkTheme);
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

  const headerToolbar = (
    <Toolbar id="vertical-toolbar">
      <ToolbarContent>
        <ToolbarItem>Netobserv</ToolbarItem>
        <ToolbarItem align={{ default: 'alignRight' }}>
          <ToggleGroup>
            <ToggleGroupItem
              // eslint-disable-next-line max-len
              icon={
                <svg className="pf-v5-svg" viewBox="0 0 512 512">
                  <path d="M256 160c-52.9 0-96 43.1-96 96s43.1 96 96 96 96-43.1 96-96-43.1-96-96-96zm246.4 80.5l-94.7-47.3 33.5-100.4c4.5-13.6-8.4-26.5-21.9-21.9l-100.4 33.5-47.4-94.8c-6.4-12.8-24.6-12.8-31 0l-47.3 94.7L92.7 70.8c-13.6-4.5-26.5 8.4-21.9 21.9l33.5 100.4-94.7 47.4c-12.8 6.4-12.8 24.6 0 31l94.7 47.3-33.5 100.5c-4.5 13.6 8.4 26.5 21.9 21.9l100.4-33.5 47.3 94.7c6.4 12.8 24.6 12.8 31 0l47.3-94.7 100.4 33.5c13.6 4.5 26.5-8.4 21.9-21.9l-33.5-100.4 94.7-47.3c13-6.5 13-24.7.2-31.1zm-155.9 106c-49.9 49.9-131.1 49.9-181 0-49.9-49.9-49.9-131.1 0-181 49.9-49.9 131.1-49.9 181 0 49.9 49.9 49.9 131.1 0 181z"></path>
                </svg>
              }
              isSelected={!isDark}
              onClick={() => onThemeSelect(false)}
            />
            <ToggleGroupItem
              // eslint-disable-next-line max-len
              icon={
                <svg className="pf-v5-svg" viewBox="0 0 512 512">
                  <path d="M283.211 512c78.962 0 151.079-35.925 198.857-94.792 7.068-8.708-.639-21.43-11.562-19.35-124.203 23.654-238.262-71.576-238.262-196.954 0-72.222 38.662-138.635 101.498-174.394 9.686-5.512 7.25-20.197-3.756-22.23A258.156 258.156 0 0 0 283.211 0c-141.309 0-256 114.511-256 256 0 141.309 114.511 256 256 256z"></path>
                </svg>
              }
              isSelected={isDark}
              onClick={() => onThemeSelect(true)}
            />
          </ToggleGroup>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={onSidebarToggle}
          id="vertical-nav-toggle"
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <Brand src={'https://avatars.githubusercontent.com/u/91939379?s=35'} alt="Netobserv Logo" />
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>{headerToolbar}</MastheadContent>
    </Masthead>
  );

  const sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen} id="vertical-sidebar">
      <PageSidebarBody>
        <Nav onSelect={onNavSelect} aria-label="Nav">
          <NavList>
            {pages.map((page, index) => (
              <NavItem itemId={index} isActive={pageIndex === index} key={page.id}>
                <Link id={`${page.id}-nav-item-link`} to={`/${page.id}`}>
                  {page.name}
                </Link>
              </NavItem>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  const pageContent = (id: string) => {
    console.debug('pageContent', id);
    switch (id) {
      case 'pod-tab':
        return <NetflowTab obj={{ kind: 'Pod', metadata: { name: 'test', namespace: 'default' } }} />;
      case 'namespace-tab':
        return <NetflowTab obj={{ kind: 'Namespace', metadata: { name: 'test' } }} />;
      case 'node-tab':
        return <NetflowTab obj={{ kind: 'Node', metadata: { name: 'test' } }} />;
      default:
        return <NetflowTrafficParent />;
    }
  };

  const pageContext = () => {
    const page = pages[pageIndex];
    console.debug('pageContext', pageIndex, page.id);
    const content = pageContent(page.id);
    switch (page.id) {
      case 'netflow-traffic':
        return <>{content}</>;
      default:
        return (
          <PageSection id="consolePageSection" className={`tab' ${isDark ? 'dark' : 'light'}`}>
            <div style={{ padding: '1rem' }}>
              <Title headingLevel="h1">{`${page.name} example`}</Title>
            </div>
            <Tabs activeKey={1}>
              <Tab title="A" eventKey={0} />
              <Tab title="B" eventKey={0} />
              <Tab title="C" eventKey={0} />
              <Tab title="D" eventKey={0} />
              <Tab title="E" eventKey={0} />
              <Tab title="Network traffic" eventKey={1}>
                {content}
              </Tab>
            </Tabs>
          </PageSection>
        );
    }
  };

  return (
    <BrowserRouter>
      <Page header={header} sidebar={sidebar}>
        {pageContext()}
      </Page>
    </BrowserRouter>
  );
};

export default App;
