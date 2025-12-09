/* eslint-disable max-len */
import {
  Nav,
  NavItem,
  NavList,
  Page,
  PageSection,
  PageSidebar,
  PageSidebarBody,
  Tab,
  Tabs,
  Title
} from '@patternfly/react-core';
import { configure } from 'mobx';
import React from 'react';
import { BrowserRouter, Link } from 'react-router-dom';
import FlowCollectorForm from '../components/forms/flowCollector';
import FlowCollectorStatus from '../components/forms/flowCollector-status';
import FlowCollectorWizard from '../components/forms/flowCollector-wizard';
import FlowMetricForm from '../components/forms/flowMetric';
import FlowMetricWizard from '../components/forms/flowMetric-wizard';
import NetworkHealth from '../components/health/network-health';
import NetflowTrafficDevTab from '../components/netflow-traffic-dev-tab';
import NetflowTrafficParent from '../components/netflow-traffic-parent';
import NetflowTab from '../components/netflow-traffic-tab';
import { ContextSingleton } from '../utils/context';

import '@patternfly/patternfly/patternfly-charts-theme-dark.css';
import '@patternfly/patternfly/patternfly-theme-dark.css';
import '@patternfly/react-core/dist/styles/base.css';
import Header from './header';
import './index.css';

configure({ isolateGlobalState: true });

const allPages = [
  {
    id: 'netflow-traffic',
    name: 'Network Traffic'
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
    id: 'network-health',
    name: 'Network Health'
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
const endUserPages = allPages.filter(p => p.id === 'netflow-traffic' || p.id === 'network-health');

export const App: React.FunctionComponent<{ endUser?: boolean }> = ({ endUser }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [isDark, setDark] = React.useState(false);
  ContextSingleton.setStandalone();
  const pages = endUser ? endUserPages : allPages;

  const onSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const onNavSelect = (_event: React.FormEvent<HTMLInputElement>, result: { itemId: number | string }) => {
    setPageIndex(result.itemId as number);
  };

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
        return <FlowCollectorWizard name="cluster" />;
      case 'flowCollector':
        return <FlowCollectorForm name="cluster" />;
      case 'flowCollector-status':
        return <FlowCollectorStatus />;
      case 'flowMetric-wizard':
        return <FlowMetricWizard name="flowmetric-sample" />;
      case 'flowMetric':
        return <FlowMetricForm name="flowmetric-sample" />;
      case 'network-health':
        return <NetworkHealth />;
      default:
        return <NetflowTrafficParent />;
    }
  };

  const pageContext = () => {
    const page = pages[pageIndex];
    const content = pageContent(page.id);
    switch (page.id) {
      case 'netflow-traffic':
      case 'flowCollector-wizard':
      case 'flowCollector':
      case 'flowCollector-status':
      case 'flowMetric-wizard':
      case 'flowMetric':
      case 'network-health':
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
      <Page
        header={
          <Header isDark={isDark} setDark={setDark} isSidebarOpen={isSidebarOpen} onSidebarToggle={onSidebarToggle} />
        }
        sidebar={sidebar}
      >
        {pageContext()}
      </Page>
    </BrowserRouter>
  );
};

export default App;
