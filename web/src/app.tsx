/* eslint-disable max-len */
import {
  Brand,
  Masthead,
  MastheadBrand,
  MastheadContent,
  MastheadMain,
  MastheadToggle,
  Nav,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  PageToggleButton,
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
import { GetFlowCollectorJS } from './components/forms/config/templates';
import Consumption from './components/forms/consumption';
import FlowCollectorForm from './components/forms/flowCollector';
import FlowCollectorStatus from './components/forms/flowCollector-status';
import FlowCollectorWizard from './components/forms/flowCollector-wizard';
import FlowMetricForm from './components/forms/flowMetric';
import FlowMetricWizard from './components/forms/flowMetric-wizard';
import NetflowTrafficDevTab from './components/netflow-traffic-dev-tab';
import NetflowTrafficParent from './components/netflow-traffic-parent';
import NetflowTab from './components/netflow-traffic-tab';
import { ContextSingleton } from './utils/context';

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
  },
  {
    id: 'flowCollector-wizard',
    name: 'FlowCollector wizard'
  },
  {
    id: 'flowCollector',
    name: 'FlowCollector form'
  },
  {
    id: 'flowCollector-consumption',
    name: 'FlowCollector consumption'
  },
  {
    id: 'flowCollector-status',
    name: 'FlowCollector status'
  },
  {
    id: 'flowMetric-wizard',
    name: 'FlowMetric wizard'
  },
  {
    id: 'flowMetric',
    name: 'FlowMetric form'
  }
];

export const App: React.FunctionComponent = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [isDark, setDark] = React.useState(false);
  ContextSingleton.setStandalone();

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
            <ToggleGroupItem text="Light" isSelected={!isDark} onClick={() => onThemeSelect(false)} />
            <ToggleGroupItem text="Dark" isSelected={isDark} onClick={() => onThemeSelect(true)} />
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
          id="nav-toggle"
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
      case 'flowCollector-wizard':
        return <FlowCollectorWizard />;
      case 'flowCollector':
        return <FlowCollectorForm />;
      case 'flowCollector-consumption':
        return <Consumption flowCollector={GetFlowCollectorJS()} />;
      case 'flowCollector-status':
        return <FlowCollectorStatus />;
      case 'flowMetric-wizard':
        return <FlowMetricWizard />;
      case 'flowMetric':
        return <FlowMetricForm />;
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
      case 'flowCollector-wizard':
      case 'flowCollector':
      case 'flowCollector-status':
      case 'flowMetric-wizard':
      case 'flowMetric':
        return <>{content}</>;
      case 'flowCollector-consumption':
        return (
          <PageSection id="pageSection" className={isDark ? 'dark' : 'light'}>
            {content}
          </PageSection>
        );
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
