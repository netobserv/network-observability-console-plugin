import * as React from 'react';
import { PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, EmptyStateVariant, PageSection, Title } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import NetflowTraffic from './netflow-traffic';
import { ColumnsId } from '../utils/columns';
import { Filter } from '../utils/filters';

export const NetflowTab: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  let forcedFilters: Filter[];
  switch (obj?.kind) {
    case 'Pod':
      forcedFilters = [
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcpod,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
    case 'Job':
    case 'CronJob':
      forcedFilters = [
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcwkdkind,
          values: [{ v: obj!.kind }]
        },
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcwkd,
          values: [{ v: obj!.metadata!.name as string }]
        },
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcnamespace,
          values: [{ v: obj!.metadata!.namespace as string }]
        }
      ];
      break;
    case 'Service':
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
      forcedFilters = [
        {
          /*TODO : set SRC and DST filters after implementing OR logic NETOBSERV-73*/
          colId: ColumnsId.srcnamespace,
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

  return <NetflowTraffic forcedFilters={forcedFilters} />;
};

export default NetflowTab;
