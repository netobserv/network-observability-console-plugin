import { K8sResourceCommon, PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import { EmptyState, EmptyStateBody, EmptyStateVariant, PageSection, Title } from '@patternfly/react-core';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Filters } from '../model/filters';
import { findFilter } from '../utils/filter-definitions';
import NetflowTraffic from './netflow-traffic';
import NetflowTrafficParent from './netflow-traffic-parent';

type RouteProps = K8sResourceCommon & {
  spec: {
    to: {
      kind?: string;
      name?: string;
    };
  };
};

type HPAProps = K8sResourceCommon & {
  spec: {
    scaleTargetRef: {
      kind?: string;
      name?: string;
    };
  };
};

export const NetflowTab: React.FC<PageComponentProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__netobserv-plugin');

  let forcedFilters: Filters;
  switch (obj?.kind) {
    case 'Pod':
    case 'Deployment':
    case 'StatefulSet':
    case 'DaemonSet':
    case 'Job':
    case 'CronJob':
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'src_resource')!,
            values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
          }
        ],
        backAndForth: true
      };
      break;
    case 'Service':
      // NOTE: Services are always on the destination side
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'dst_resource')!,
            values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
          }
        ],
        backAndForth: false
      };
      break;
    case 'Route':
      const route = obj as RouteProps;
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'dst_resource')!,
            values: [{ v: `${route.spec.to!.kind}.${route.metadata!.namespace}.${route.spec.to!.name}` }]
          }
        ],
        backAndForth: false
      };
      break;
    case 'Namespace':
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'src_namespace')!,
            values: [{ v: obj!.metadata!.name as string }]
          }
        ],
        backAndForth: true
      };
      break;
    case 'Node':
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'src_host_name')!,
            values: [{ v: obj!.metadata!.name as string }]
          }
        ],
        backAndForth: true
      };
      break;
    case 'ReplicaSet':
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'src_resource')!,
            values: obj.metadata!.ownerReferences!.map(ownerRef => {
              return { v: `${ownerRef.kind}.${obj.metadata!.namespace}.${ownerRef.name}` };
            })
          }
        ],
        backAndForth: true
      };
      break;
    case 'HorizontalPodAutoscaler':
      const hpa = obj as HPAProps;
      forcedFilters = {
        list: [
          {
            def: findFilter(t, 'src_resource')!,
            values: [
              { v: `${hpa.spec.scaleTargetRef.kind}.${hpa.metadata!.namespace}.${hpa.spec.scaleTargetRef.name}` }
            ]
          }
        ],
        backAndForth: true
      };
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
        </PageSection>
      );
  }

  return (
    <NetflowTrafficParent>
      <NetflowTraffic forcedFilters={forcedFilters} isTab />
    </NetflowTrafficParent>
  );
};

export default NetflowTab;
