import { K8sResourceCommon, PageComponentProps } from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
  Title
} from '@patternfly/react-core';
import _ from 'lodash';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Config, defaultConfig } from '../model/config';
import { Filters } from '../model/filters';
import { loadConfig } from '../utils/config';
import { findFilter, getFilterDefinitions } from '../utils/filter-definitions';
import { usePrevious } from '../utils/previous-hook';
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
  const initState = React.useRef<Array<'initDone' | 'configLoading' | 'configLoaded' | 'forcedFiltersLoaded'>>([]);
  const [config, setConfig] = React.useState<Config>(defaultConfig);
  const [forcedFilters, setForcedFilters] = React.useState<Filters>();
  const previous = usePrevious({ obj });

  React.useEffect(() => {
    // init function will be triggered only once
    if (!initState.current.includes('initDone')) {
      initState.current.push('initDone');

      // load config only once and track its state
      if (!initState.current.includes('configLoading')) {
        initState.current.push('configLoading');
        loadConfig().then(v => {
          setConfig(v);
          initState.current.push('configLoaded');
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const filterDefinitions = getFilterDefinitions(config.filters, config.columns, t);

    if (
      !initState.current.includes('configLoaded') ||
      _.isEmpty(filterDefinitions) ||
      (initState.current.includes('forcedFiltersLoaded') &&
        obj?.kind === previous?.obj?.kind &&
        obj?.metadata?.name === previous?.obj?.metadata?.name &&
        obj?.metadata?.namespace === previous?.obj?.metadata?.namespace)
    ) {
      return;
    }

    initState.current.push('forcedFiltersLoaded');
    switch (obj?.kind) {
      case 'Pod':
      case 'Deployment':
      case 'StatefulSet':
      case 'DaemonSet':
      case 'Job':
      case 'CronJob':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
            }
          ],
          backAndForth: true
        });
        break;
      case 'Service':
        // NOTE: Services are always on the destination side
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'dst_resource')!,
              values: [{ v: `${obj.kind}.${obj.metadata!.namespace}.${obj.metadata!.name}` }]
            }
          ],
          backAndForth: false
        });
        break;
      case 'Route':
        const route = obj as RouteProps;
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'dst_resource')!,
              values: [{ v: `${route.spec.to!.kind}.${route.metadata!.namespace}.${route.spec.to!.name}` }]
            }
          ],
          backAndForth: false
        });
        break;
      case 'Namespace':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_namespace')!,
              values: [{ v: obj!.metadata!.name as string }]
            }
          ],
          backAndForth: true
        });
        break;
      case 'Node':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_host_name')!,
              values: [{ v: obj!.metadata!.name as string }]
            }
          ],
          backAndForth: true
        });
        break;
      case 'ReplicaSet':
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: obj.metadata!.ownerReferences!.map(ownerRef => {
                return { v: `${ownerRef.kind}.${obj.metadata!.namespace}.${ownerRef.name}` };
              })
            }
          ],
          backAndForth: true
        });
        break;
      case 'HorizontalPodAutoscaler':
        const hpa = obj as HPAProps;
        setForcedFilters({
          list: [
            {
              def: findFilter(filterDefinitions, 'src_resource')!,
              values: [
                { v: `${hpa.spec.scaleTargetRef.kind}.${hpa.metadata!.namespace}.${hpa.spec.scaleTargetRef.name}` }
              ]
            }
          ],
          backAndForth: true
        });
        break;
    }
  }, [config, obj, previous, t]);

  if (!initState.current.includes('forcedFiltersLoaded')) {
    return (
      <Bullseye data-test="loading-tab">
        <Spinner size="xl" />
      </Bullseye>
    );
  } else if (forcedFilters) {
    return <NetflowTrafficParent forcedFilters={forcedFilters} isTab={true} parentConfig={config} />;
  } else {
    return (
      <PageSection id="pageSection" data-test="tab-page-section">
        <EmptyState data-test="error-state" variant={EmptyStateVariant.sm}>
          <Title headingLevel="h2" size="lg">
            {t('Kind not managed')}
          </Title>
          <EmptyStateBody>{obj?.kind}</EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }
};

export default NetflowTab;
