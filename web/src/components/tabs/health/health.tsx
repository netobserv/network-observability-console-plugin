import { Bullseye, Spinner } from '@patternfly/react-core';
import * as _ from 'lodash';
import * as React from 'react';
import { murmur3 } from 'murmurhash-js';

import { Rule } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { Stats } from '../../../api/loki';
import { getAlerts } from '../../../api/routes';
import { Config } from '../../../model/config';
import { HealthSummary } from './health-summary';
import { buildStats, HealthStats } from './helper';
import { HealthViolationTable } from './health-violation-table';

import './health.css';

export type HealthHandle = {
  fetch: (initFunction: () => void) => Promise<Stats[]> | undefined;
};

export interface HealthProps {
  ref?: React.Ref<HealthHandle>;
  loading?: boolean;
  selectedRule?: Rule;
  onSelect: (rule?: Rule) => void;
  resetDefaultFilters?: (c?: Config) => void;
  clearFilters?: () => void;
  isDark?: boolean;
}

export const Health: React.FC<HealthProps> = React.forwardRef(
  (props, ref: React.Ref<HealthHandle>) => {
    const { t } = useTranslation('plugin__netobserv-plugin');
    const [rules, setRules] = React.useState<Rule[]>([]);
    const [stats, setStats] = React.useState<HealthStats>({ global: [], byNamespace: [], byNode: [] });

    const fetch = React.useCallback((initFunction: () => void) => {
      initFunction();

      const promises: Promise<Stats>[] = [
        // matching netobserv="true" catches all alerts designed for netobserv (not necessarily owned by it)
        getAlerts('netobserv="true"').then(res => {
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
                ..._.map(r.labels, (k, v) => `${k}=${v}`),
              ].join(',');
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
      ];
      return Promise.all(promises);
    }, []);

    React.useImperativeHandle(ref, () => ({ fetch }));

    if (_.isEmpty(rules) && props.loading) {
      return (
        <Bullseye data-test="loading-contents">
          <Spinner size="xl" />
        </Bullseye>
      );
    }

    // TODO: add checkboxes: include pending, include silenced

    return (
      <>
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
      </>
    );
  }
);
Health.displayName = 'Health';
