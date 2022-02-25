import * as React from 'react';
import { PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, EmptyStateVariant, PageSection, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import NetflowTraffic from './netflow-traffic';
import { ColumnsId } from '../utils/columns';
import { Filter } from '../utils/filters';
import { QueryOptions, Match } from '../model/query-options';
import { DEFAULT_LIMIT, DEFAULT_FLOWDIR, flowdirToReporter } from '../utils/router';

export const NetflowTab: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  let match: Match;
  let forcedFilters: Filter[];
  switch (obj?.kind) {
    case 'Pod':
      match = 'srcOrDst';
      forcedFilters = [
        {
          colId: ColumnsId.srcpod,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.srcnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        },
        {
          colId: ColumnsId.dstpod,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.dstnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
    case 'Job':
    case 'CronJob':
      match = 'srcOrDst';
      forcedFilters = [
        {
          colId: ColumnsId.srcwkdkind,
          values: [{ v: obj!.kind }]
        },
        {
          colId: ColumnsId.srcwkd,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.srcnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        },
        {
          colId: ColumnsId.dstwkdkind,
          values: [{ v: obj!.kind }]
        },
        {
          colId: ColumnsId.dstwkd,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.dstnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Service':
      match = 'all';
      // NOTE: Services are always on the destination side
      forcedFilters = [
        {
          colId: ColumnsId.dstwkdkind,
          values: [{ v: 'Service' }]
        },
        {
          colId: ColumnsId.dstwkd,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.dstnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Namespace':
      match = 'srcOrDst';
      forcedFilters = [
        {
          colId: ColumnsId.srcnamespace,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          colId: ColumnsId.dstnamespace,
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
    match: match,
    limit: DEFAULT_LIMIT
  };

  return <NetflowTraffic forcedFilters={forcedFilters} initialQueryOptions={initialQueryOptions} />;
};

export default NetflowTab;
