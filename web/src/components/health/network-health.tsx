import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import {
  Button,
  Flex,
  FlexItem,
  PageSection,
  TextVariants,
  Title
} from '@patternfly/react-core';
import { SyncAltIcon } from '@patternfly/react-icons';
import * as _ from 'lodash';
import { murmur3 } from 'murmurhash-js';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { getAlerts } from '../../api/routes';
import { getHTTPErrorDetails } from '../../utils/errors';
import { localStorageHealthRefreshKey, useLocalStorage } from '../../utils/local-storage-hook';
import { usePoll } from '../../utils/poll-hook';
import { useTheme } from '../../utils/theme-hook';
import { RefreshDropdown } from '../dropdowns/refresh-dropdown';
import HealthError from './health-error';
import { HealthSummary } from './health-summary';
import { HealthViolationTable } from './health-violation-table';
import { buildStats, HealthStats } from './helper';

import './health.css';

export const NetworkHealth: React.FC<{}> = ({}) => {
  const { t } = useTranslation('plugin__netobserv-plugin');
  const isDarkTheme = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();
  const [interval, setInterval] = useLocalStorage<number | undefined>(localStorageHealthRefreshKey, 30000);
  const [rules, setRules] = React.useState<Rule[]>([]);
  const [stats, setStats] = React.useState<HealthStats>({ global: [], byNamespace: [], byNode: [] });

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
        setRules(rules);
        setStats(buildStats(rules));
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
  }, []);

  usePoll(fetch, interval);
  React.useEffect(fetch, []);

  return (
    <PageSection id="pageSection" className={`${isDarkTheme ? 'dark' : 'light'}`}>
      <Flex>
        <Flex grow={{ default: 'grow' }}>
          <FlexItem>
            <Title headingLevel={TextVariants.h1}>{t('Network Health')}</Title>
          </FlexItem>
        </Flex>
        <Flex>
          <FlexItem className="netobserv-refresh-interval-container">
            <RefreshDropdown
              data-test="refresh-dropdown"
              id="refresh-dropdown"
              interval={interval}
              setInterval={setInterval}
            />
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
      {error && <HealthError title={t('Error')} body={error} />}
      <HealthSummary rules={rules} />
      <HealthViolationTable
        title={t('Global rule violations')}
        stats={stats.global}
        // isDark={props.isDark}
      />
      <HealthViolationTable
        title={t('Rule violations per node')}
        stats={stats.byNode}
        kind={'Node'}
        // isDark={props.isDark}
      />
      <HealthViolationTable
        title={t('Rule violations per namespace')}
        stats={stats.byNamespace}
        kind={'Namespace'}
        // isDark={props.isDark}
      />
    </PageSection>
  );
};

NetworkHealth.displayName = 'NetworkHealth';
export default NetworkHealth;
