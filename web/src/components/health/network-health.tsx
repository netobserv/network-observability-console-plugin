import {
  AlertStates,
  PrometheusResponse,
  Rule
} from '@openshift-console/dynamic-plugin-sdk';
import { Button, Flex, FlexItem, PageSection, Tab, Tabs, Text, TextVariants, Title } from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { murmur3 } from 'murmurhash-js';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { SilenceMatcher } from '../../api/alert';
import { getAlerts, getRecordingRules, getSilencedAlerts, queryPrometheusMetric } from '../../api/routes';
import { Config, defaultConfig } from '../../model/config';
import { loadConfig } from '../../utils/config';
import { getHTTPErrorDetails } from '../../utils/errors';
import { localStorageHealthRefreshKey, useLocalStorage } from '../../utils/local-storage-hook';
import { usePoll } from '../../utils/poll-hook';
import { useTheme } from '../../utils/theme-hook';
import { RefreshDropdown } from '../dropdowns/refresh-dropdown';
import { HealthDrawerContainer } from './health-drawer-container';
import HealthError from './health-error';
import { HealthGlobal } from './health-global';
import { buildStats, isSilenced, RecordingRuleMetric } from './health-helper';
import { HealthSummary } from './health-summary';
import { HealthTabTitle } from './tab-title';

import './health.css';

export const NetworkHealth: React.FC<{}> = ({}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const isDarkTheme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [interval, setInterval] = useLocalStorage<number | undefined>(localStorageHealthRefreshKey, undefined);
  const [rawRules, setRawRules] = React.useState<Rule[]>([]);
  const [recordingRulesMetrics, setRecordingRulesMetrics] = React.useState<RecordingRuleMetric[]>([]);
  const [silenced, setSilenced] = React.useState<SilenceMatcher[][]>([]);
  const [activeTabKey, setActiveTabKey] = React.useState<string>('global');
  const [config, setConfig] = React.useState<Config>(defaultConfig);

  const fetch = React.useCallback(() => {
    setLoading(true);
    setError(undefined);

    // matching netobserv="true" catches all alerts designed for netobserv (not necessarily owned by it)
    getAlerts('netobserv="true"')
      .then(res => {
        const rules = res.data.groups.flatMap(group => {
          // Inject rule id, for links to the alerting page
          // Warning: ID generation may in theory differ with openshift version (in practice, this has been stable across versions since 4.12 at least)
          // See https://github.com/openshift/console/blob/29374f38308c4ebe9ea461a5d69eb3e4956c7086/frontend/public/components/monitoring/utils.ts#L47-L56
          group.rules.forEach(r => {
            const key = [
              group.file,
              group.name,
              r.name,
              r.duration,
              r.query,
              ..._.map(r.labels, (k, v) => `${k}=${v}`)
            ].join(',');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            r.id = String(murmur3(key, 'monitoring-salt' as any));
          });
          return group.rules;
        });
        setRawRules(rules);
        return {
          limitReached: false,
          numQueries: 1,
          dataSources: ['prometheus']
        };
      })
      .catch(err => {
        const errStr = getHTTPErrorDetails(err, true);
        setError(errStr);
      })
      .finally(() => {
        setLoading(false);
      });

    getSilencedAlerts('netobserv=true')
      .then(res => {
        const silenced = res.filter(a => a.status.state == 'active').map(a => a.matchers);
        setSilenced(silenced);
      })
      .catch(err => {
        console.log('Could not get silenced alerts:', err);
        // Showing all alerts since we could not get silenced alerts list
        setSilenced([]);
      });

    // Fetch recording rules and their current values
    getRecordingRules('netobserv="true"')
      .then(res => {
        const recordingRules = res.data.groups.flatMap(group => group.rules);

        // For each recording rule, query its current metric values
        const queries = recordingRules.map(rule => {
          return queryPrometheusMetric(rule.name)
            .then((metricRes: PrometheusResponse) => {
              // Store the raw metric results with the rule metadata
              if (metricRes.data && metricRes.data.result) {
                return {
                  template: rule.labels?.template,
                  name: rule.name,
                  values: metricRes.data.result
                    .filter(item => item.value && item.value.length > 1)
                    .map(item => ({
                      labels: item.metric,
                      value: parseFloat(item.value![1])
                    }))
                } as RecordingRuleMetric;
              }
              return { template: rule.labels?.template, name: rule.name, values: [] } as RecordingRuleMetric;
            })
            .catch((): RecordingRuleMetric => {
              return { template: rule.labels?.template, name: rule.name, values: [] };
            });
        });

        Promise.all(queries).then(metrics => {
          setRecordingRulesMetrics(metrics);
        });
      })
      .catch(err => {
        // Recording rules not available
        console.error('Failed to fetch recording rules:', err);
      });
  }, []);

  // Load config on mount
  React.useEffect(() => {
    loadConfig().then(v => {
      setConfig(v.config);
      if (v.error) {
        console.error('Error loading config:', v.error);
      }
    });
  }, []);

  usePoll(fetch, interval);
  React.useEffect(fetch, [fetch]);

  const rules = rawRules.map(r => {
    const alerts = r.alerts.map(a => {
      let state = a.state;
      const labels = { ...r.labels, ...a.labels };
      if (silenced.some(s => isSilenced(s, labels))) {
        state = 'silenced' as AlertStates;
      }
      return { ...a, state: state };
    });
    return { ...r, alerts: alerts };
  });

  const stats = buildStats(rules, config.healthRules || [], recordingRulesMetrics);

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
      <div className="health-tabs">
        <HealthSummary rules={rules} stats={stats} />
        {error ? (
          <HealthError title={t('Error')} body={error} />
        ) : (
          <Tabs
            activeKey={activeTabKey}
            onSelect={(_, tabIndex) => setActiveTabKey(String(tabIndex))}
            role="region"
            className={isDarkTheme ? 'dark' : ''}
          >
            <Tab
              eventKey={'global'}
              title={<HealthTabTitle title={t('Global')} stats={[stats.global]} />}
              aria-label="Tab global"
            >
              <HealthGlobal info={stats.global} recordingRules={stats.recordingRules.global} isDark={isDarkTheme} />
            </Tab>
            <Tab
              eventKey={'per-node'}
              title={<HealthTabTitle title={t('Nodes')} stats={stats.byNode} />}
              aria-label="Tab per node"
            >
              <HealthDrawerContainer
                title={t('Rule violations per node')}
                stats={stats.byNode}
                recordingRulesStats={stats.recordingRules.byNode}
                kind={'Node'}
                isDark={isDarkTheme}
              />
            </Tab>
            <Tab
              eventKey={'per-namespace'}
              title={<HealthTabTitle title={t('Namespaces')} stats={stats.byNamespace} />}
              aria-label="Tab per namespace"
            >
              <HealthDrawerContainer
                title={t('Rule violations per namespace')}
                stats={stats.byNamespace}
                recordingRulesStats={stats.recordingRules.byNamespace}
                kind={'Namespace'}
                isDark={isDarkTheme}
              />
            </Tab>
          </Tabs>
        )}
      </div>
    </PageSection>
  );
};

NetworkHealth.displayName = 'NetworkHealth';
export default NetworkHealth;
