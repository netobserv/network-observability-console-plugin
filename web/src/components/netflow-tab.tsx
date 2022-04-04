import { PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, EmptyStateVariant, PageSection, Title } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Match, QueryOptions } from '../model/query-options';
import { ColumnsId } from '../utils/columns';
import { Filter } from '../utils/filters';
import { DEFAULT_FLOWDIR, DEFAULT_LIMIT, flowdirToReporter } from '../utils/router';
import NetflowTraffic from './netflow-traffic';
import NetflowTrafficParent from './netflow-traffic-parent';

export const NetflowTab: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  let forcedFilters: Filter[];
  let match: Match;
  switch (obj?.kind) {
    case 'Pod':
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
    case 'Job':
    case 'CronJob':
      match = 'any';
      forcedFilters = [
        {
          colId: ColumnsId.kubeobject,
          values: [{ v: `${obj!.kind}.${obj!.metadata!.namespace}.${obj.metadata!.name}` }]
        }
      ];
      break;
    case 'Service':
      // NOTE: Services are always on the destination side
      match = 'all';
      forcedFilters = [
        {
          colId: ColumnsId.dsttype,
          values: [{ v: obj!.kind }]
        },
        {
          colId: ColumnsId.dstname,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.dstnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Namespace':
      match = 'any';
      forcedFilters = [
        {
          colId: ColumnsId.namespace,
          values: [{ v: obj!.metadata!.name as string }]
        }
      ];
      break;
    default:
      return (
        <PageSection id="pageSection">
          <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
            <Title headingLevel="h2" size="lg">
              {t('Unknown kind')}
            </Title>
            <EmptyStateBody>{obj?.kind}</EmptyStateBody>
          </EmptyState>
          );
        </PageSection>
      );
  }

  const initialQueryOptions: QueryOptions = {
    reporter: flowdirToReporter[DEFAULT_FLOWDIR],
    match,
    limit: DEFAULT_LIMIT
  };

  return (
    <NetflowTrafficParent>
      <NetflowTraffic forcedFilters={forcedFilters} initialQueryOptions={initialQueryOptions} />;
    </NetflowTrafficParent>
  );
};

export default NetflowTab;
