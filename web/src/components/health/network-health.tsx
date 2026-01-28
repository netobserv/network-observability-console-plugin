import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, PageSection, Tab, Tabs, Text, TextVariants, Title } from '@patternfly/react-core';
import { QuestionCircleIcon, SyncAltIcon } from '@patternfly/react-icons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Config, defaultConfig } from '../../model/config';
import { loadConfig } from '../../utils/config';
import { getHTTPErrorDetails } from '../../utils/errors';
import { localStorageHealthRefreshKey, useLocalStorage } from '../../utils/local-storage-hook';
import { usePoll } from '../../utils/poll-hook';
import { useTheme } from '../../utils/theme-hook';
import { RefreshDropdown } from '../dropdowns/refresh-dropdown';
import { HealthDrawerContainer } from './health-drawer-container';
import HealthError from './health-error';
import { fetchNetworkHealth } from './health-fetcher';
import { HealthGlobal } from './health-global';
import { buildStats, HealthStats } from './health-helper';
import { HealthScoringDrawer } from './health-scoring-drawer';
import { HealthSummary } from './health-summary';
import { HealthTabTitle } from './tab-title';

import './health.css';

export const NetworkHealth: React.FC<{}> = ({}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const isDarkTheme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [interval, setInterval] = useLocalStorage<number | undefined>(localStorageHealthRefreshKey, undefined);
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [health, setHealth] = React.useState<HealthStats>(buildStats([]));
  const [activeTabKey, setActiveTabKey] = React.useState<string>('global');
  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const [isScoringDrawerOpen, setIsScoringDrawerOpen] = React.useState<boolean>(false);

  // Load config on mount
  React.useEffect(() => {
    loadConfig().then(v => {
      setConfig(v.config);
      if (v.error) {
        console.error('Error loading config:', v.error);
      }
    });
  }, []);

  const fetch = React.useCallback(() => {
    setLoading(true);
    setError(undefined);

    fetchNetworkHealth(config.recordingAnnotations || {})
      .then(res => {
        setHealth(res.stats);
        setRules(res.alertRules);
      })
      .catch(err => {
        const errStr = getHTTPErrorDetails(err, true);
        setError(errStr);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  usePoll(fetch, interval);
  React.useEffect(fetch, [fetch]);

  return (
    <PageSection id="pageSection" className={`${isDarkTheme ? 'dark' : 'light'}`}>
      <Flex className="health-header" alignItems={{ default: 'alignItemsFlexStart' }}>
        <Flex grow={{ default: 'grow' }}>
          <FlexItem>
            <Title headingLevel={TextVariants.h1}>{t('Network Health')}</Title>
          </FlexItem>
        </Flex>
        <Flex direction={{ default: 'row' }}>
          <FlexItem className="netobserv-refresh-interval-container">
            <Flex direction={{ default: 'column' }}>
              <FlexItem className="netobserv-action-title">
                <Text component={TextVariants.h4}>{t('Refresh interval')}</Text>
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <RefreshDropdown
                  data-test="refresh-dropdown"
                  id="refresh-dropdown"
                  interval={interval}
                  setInterval={setInterval}
                />
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem className="netobserv-refresh-container">
            <Button
              data-test="refresh-button"
              id="refresh-button"
              className="co-action-refresh-button"
              variant="primary"
              onClick={() => fetch()}
              icon={<SyncAltIcon style={{ animation: `spin ${loading ? 1 : 0}s linear infinite` }} />}
            />
          </FlexItem>
        </Flex>
      </Flex>
      <HealthScoringDrawer isOpen={isScoringDrawerOpen} onClose={() => setIsScoringDrawerOpen(false)}>
        <div className="health-tabs">
          <HealthSummary rules={rules} stats={health} />
          {error ? (
            <HealthError title={t('Error')} body={error} />
          ) : (
            <>
              <Flex className={`health-tabs-container ${isDarkTheme ? 'dark' : ''}`}>
                <FlexItem flex={{ default: 'flex_1' }}>
                  <Tabs
                    activeKey={activeTabKey}
                    onSelect={(_, tabIndex) => setActiveTabKey(String(tabIndex))}
                    role="region"
                    className={isDarkTheme ? 'dark' : ''}
                  >
                    <Tab
                      eventKey={'global'}
                      title={<HealthTabTitle title={t('Global')} stats={[health.global]} />}
                      aria-label="Tab global"
                    />
                    <Tab
                      eventKey={'per-node'}
                      title={<HealthTabTitle title={t('Nodes')} stats={health.byNode} />}
                      aria-label="Tab per node"
                    />
                    <Tab
                      eventKey={'per-namespace'}
                      title={<HealthTabTitle title={t('Namespaces')} stats={health.byNamespace} />}
                      aria-label="Tab per namespace"
                    />
                    <Tab
                      eventKey={'per-owner'}
                      title={<HealthTabTitle title={t('Workloads')} stats={health.byOwner} />}
                      aria-label="Tab per owner"
                    />
                  </Tabs>
                </FlexItem>
                <FlexItem className={`${isDarkTheme ? 'dark' : 'light'}-bottom-border`}>
                  <Button
                    data-test="health-scoring-info-button"
                    className="overflow-button"
                    variant="link"
                    onClick={() => setIsScoringDrawerOpen(!isScoringDrawerOpen)}
                    icon={<QuestionCircleIcon />}
                  >
                    {isScoringDrawerOpen ? t('Hide scoring information') : t('Show scoring information')}
                  </Button>
                </FlexItem>
              </Flex>
              {activeTabKey === 'global' && <HealthGlobal info={health.global} isDark={isDarkTheme} />}
              {activeTabKey === 'per-node' && (
                <HealthDrawerContainer
                  title={t('Rule violations per node')}
                  stats={health.byNode}
                  kind={'Node'}
                  isDark={isDarkTheme}
                />
              )}
              {activeTabKey === 'per-namespace' && (
                <HealthDrawerContainer
                  title={t('Rule violations per namespace')}
                  stats={health.byNamespace}
                  kind={'Namespace'}
                  isDark={isDarkTheme}
                />
              )}
              {activeTabKey === 'per-owner' && (
                <HealthDrawerContainer
                  title={t('Rule violations per workload')}
                  stats={health.byOwner}
                  kind={'Owner'}
                  isDark={isDarkTheme}
                />
              )}
            </>
          )}
        </div>
      </HealthScoringDrawer>
    </PageSection>
  );
};

NetworkHealth.displayName = 'NetworkHealth';
export default NetworkHealth;
