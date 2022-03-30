import { PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, EmptyStateVariant, PageSection, Title } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Filter } from '../model/filters';
import { findFilter } from '../utils/filter-definitions';
import NetflowTraffic from './netflow-traffic';
import NetflowTrafficParent from './netflow-traffic-parent';

export const NetflowTab: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__network-observability-plugin');

  let forcedFilters: Filter[];
  switch (obj?.kind) {
    case 'Pod':
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
    case 'Job':
    case 'CronJob':
      forcedFilters = [
        {
          def: findFilter(t, 'resource')!,
          values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
        }
      ];
      break;
    case 'Service':
      // NOTE: Services are always on the destination side
      forcedFilters = [
        {
          def: findFilter(t, 'dst_resource')!,
          values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
        }
      ];
      break;
    case 'Namespace':
      forcedFilters = [
        {
          def: findFilter(t, 'namespace')!,
          values: [{ v: obj!.metadata!.name as string }]
        }
      ];
      break;
    default:
      return (
        <PageSection id="pageSection">
          <EmptyState data-test="error-state" variant={EmptyStateVariant.small}>
            <Title headingLevel="h2" size="lg">
              {t('Kind not managed')}
            </Title>
            <EmptyStateBody>{obj?.kind}</EmptyStateBody>
          </EmptyState>
          );
        </PageSection>
      );
  }

  return (
    <NetflowTrafficParent>
      <NetflowTraffic forcedFilters={forcedFilters} />;
    </NetflowTrafficParent>
  );
};

export default NetflowTab;
