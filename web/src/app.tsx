import {
  Brand,
  Button,
  Content,
  ContentVariants,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadLogo,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  Tab,
  Tabs,
  Title,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarItem
} from '@patternfly/react-core';
import { BarsIcon } from '@patternfly/react-icons';
import React from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import NetflowTrafficDevTab from './components/netflow-traffic-dev-tab';
import NetflowTrafficParent from './components/netflow-traffic-parent';
import NetflowTab from './components/netflow-traffic-tab';

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
  },
  {
    id: 'dev-tab',
    name: 'Dev tab'
  },
  {
    id: 'udn-tab',
    name: 'UDN tab'
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
        htmlElement.classList.add('pf-v6-theme-dark');
      } else {
        htmlElement.classList.remove('pf-v6-theme-dark');
      }
    }
  };

  const headerToolbar = (
    <Toolbar id="vertical-toolbar">
      <ToolbarContent>
        <ToolbarItem>
          <Content component={ContentVariants.h1}>Netobserv</Content>
        </ToolbarItem>
        <ToolbarItem align={{ default: 'alignEnd' }}>
          <ToggleGroup>
            <ToggleGroupItem text="Light" isSelected={!isDark} onClick={() => onThemeSelect(false)} />
            <ToggleGroupItem text="Dark" isSelected={isDark} onClick={() => onThemeSelect(true)} />
          </ToggleGroup>
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const header = (
    <Masthead>
      <MastheadMain>
        <MastheadToggle>
          <Button
            id="vertical-nav-toggle"
            variant="plain"
            onClick={() => onSidebarToggle()}
            aria-label="Global navigation"
            icon={<BarsIcon />}
          />
        </MastheadToggle>
        <MastheadBrand>
          <MastheadLogo>
            <Brand src={'https://avatars.githubusercontent.com/u/91939379?s=35'} alt="Netobserv Logo" />
          </MastheadLogo>
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
      case 'dev-tab':
        return (
          <NetflowTrafficDevTab
            match={{
              path: '/dev-monitoring/ns/:ns',
              url: '/dev-monitoring/ns/netobserv',
              isExact: false,
              params: {
                ns: 'netobserv'
              }
            }}
          />
        );
      case 'udn-tab':
        return <NetflowTab obj={{ kind: 'UserDefinedNetwork', metadata: { name: 'my-udn', namespace: 'default' } }} />;
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
          <PageSection hasBodyWrapper={false} id="consolePageSection" className={`tab' ${isDark ? 'dark' : 'light'}`}>
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
      <Page id="page" masthead={header} sidebar={sidebar}>
        {pageContext()}
      </Page>
    </BrowserRouter>
  );
};

export default App;
